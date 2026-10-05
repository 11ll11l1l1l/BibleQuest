import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonRunner } from '../../src/features/lesson-runner/controller.js';
function fixture({resumeStepId = null, userId = 'learner', progress = [], failSave = false } = {}) {
  const auth = { authenticated: true, user: { id: userId } }, active = { congregationId: 'church', userId };
  const writes = [];
  const lesson = { revisionId: 'revision', steps: ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'].map((type, index) => ({ id: `step-${index}`, type, content: { text: 'Lesson text' } })) };
  const service = {
    async listPairs() { return [{ id: 'pair', state: 'active', menteeId: 'learner' }]; },
    async loadLesson() { return lesson; }, async loadOperationalProgress() { return progress; },
    async saveProgress(pair, revision, data) { if (failSave) throw new Error('Offline'); writes.push({ pair, revision, data }); },
  };
  const runner = createLessonRunner({ service, session: { getState: () => auth }, membership: { getActive: () => active }, pairId: 'pair', revisionId: 'revision', resumeStepId, now: () => '2026-10-04T10:00:00Z' });
  return { runner, service, writes, auth, active, lesson };
}
test('resumes the saved immutable revision and preserves its start timestamp', async () => {
  const f = fixture({ progress: [{ status: 'in_progress', currentStepId: 'step-3', startedAt: '2026-10-03T10:00:00Z' }] });
  await f.runner.load(); assert.equal(f.runner.getState().stepIndex, 3);
  await f.runner.move(1);
  assert.equal(f.writes[0].revision, 'revision');
  assert.equal(f.writes[0].data.startedAt, '2026-10-03T10:00:00Z');
  assert.equal(f.writes[0].data.currentStepId, 'step-4');
});
test('completion requires the Action step and records the exact revision once', async () => {
  const f = fixture(); await f.runner.load();
  await assert.rejects(f.runner.complete(), { code: 'BQ_LESSON_COMPLETION_DENIED' });
  for (let index = 0; index < 6; index++) await f.runner.move(1);
  await f.runner.complete(); assert.equal(f.runner.getState().status, 'completed');
  assert.equal(f.writes.at(-1).data.completedAt, '2026-10-04T10:00:00Z');
  const count = f.writes.length; await f.runner.move(-1); await f.runner.move(1);
  assert.equal(f.writes.length, count);
});
test('mentor preview navigates without writing mentee progress', async () => {
  const f = fixture({ userId: 'mentor' }); await f.runner.load();
  await f.runner.move(1); assert.equal(f.runner.getState().stepIndex, 1); assert.equal(f.writes.length, 0);
});
test('save failure retains the last saved position and permits retry', async () => {
  const f = fixture({ failSave: true }); await f.runner.load(); await f.runner.move(1);
  assert.equal(f.runner.getState().stepIndex, 0); assert.equal(f.runner.getState().status, 'save-error');
  f.service.saveProgress = async (_pair, _revision, data) => f.writes.push(data);
  await f.runner.move(1); assert.equal(f.runner.getState().stepIndex, 1); assert.equal(f.writes.length, 1);
});
test('unknown saved step fails visibly rather than erasing progress', async () => {
  const f = fixture({ progress: [{ status: 'in_progress', currentStepId: 'step-other-revision' }] });
  await f.runner.load(); assert.equal(f.runner.getState().status, 'error'); assert.equal(f.runner.getState().lesson, null); assert.equal(f.writes.length, 0);
});
test('scope change invalidates visible content and rejects late responses and writes', async () => {
  const f = fixture(); let resolve;
  f.service.loadLesson = () => new Promise(r => { resolve = r; });
  const pending = f.runner.load(); await new Promise(r => setImmediate(r));
  f.runner.invalidate(); resolve(f.lesson); await pending;
  assert.equal(f.runner.getState().lesson, null);
  f.service.loadLesson = async () => f.lesson; await f.runner.load(); f.active.congregationId = 'other';
  await f.runner.move(1); assert.equal(f.runner.getState().lesson, null); assert.equal(f.writes.length, 0);
});
test('concurrent clicks cannot create overlapping progress writes', async () => {
  const f = fixture(); await f.runner.load(); let resolve;
  f.service.saveProgress = () => new Promise(r => { resolve = r; });
  const pending = f.runner.move(1); await f.runner.move(1);
  assert.equal(f.runner.getState().status, 'saving'); resolve(); await pending;
  assert.equal(f.runner.getState().stepIndex, 1);
});

test('sign-out between load and navigation clears all lesson content without writing', async () => {
  const f = fixture(); await f.runner.load(); f.auth.authenticated = false;
  await f.runner.move(1); assert.equal(f.runner.getState().lesson, null); assert.equal(f.writes.length, 0);
});

test('Reader return restores the exact pinned step without rewriting saved progress', async () => {
  const f=fixture({resumeStepId:'step-4',progress:[{status:'in_progress',currentStepId:'step-2'}]});
  await f.runner.load();assert.equal(f.runner.getState().stepIndex,4);assert.equal(f.runner.getState().progress.currentStepId,'step-2');assert.equal(f.writes.length,0);
  const invalid=fixture({resumeStepId:'another-revision-step'});await invalid.runner.load();assert.equal(invalid.runner.getState().status,'error');assert.equal(invalid.writes.length,0);
  const corrupt=fixture({resumeStepId:'step-4',progress:[{status:'in_progress',currentStepId:'unknown'}]});await corrupt.runner.load();assert.equal(corrupt.runner.getState().status,'error');
});
