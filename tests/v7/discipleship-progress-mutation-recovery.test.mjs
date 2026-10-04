import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipLessonStateService } from '../../src/app/discipleship-lesson-state.js';

const types = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
const lesson = { id: 'lesson-1', revisionId: 'revision-1', steps: types.map((type, index) => ({ id: `step-${index}`, type })) };

function baseDiscipleship(overrides = {}) {
  let progress = [];
  const calls = [];
  return {
    calls,
    getProgress: () => progress,
    setProgress: value => { progress = value; },
    api: {
      async loadLesson() { calls.push('lesson'); return structuredClone(lesson); },
      async loadOperationalProgress() { calls.push('progress'); return structuredClone(progress); },
      async loadPrivateResponses() { calls.push('private'); return []; },
      async saveProgress(pairId, revisionId, value) {
        calls.push(['save', value.currentStepId, value.status]);
        progress = [{ lessonRevisionId: revisionId, ...structuredClone(value) }];
      },
      async savePrivateResponse() { return { id: 'response' }; },
      ...overrides,
    },
  };
}

test('progress mutation does not depend on private-response reload success', async () => {
  const f = baseDiscipleship({
    async loadPrivateResponses() { throw Object.assign(new Error('private read unavailable'), { code: 'PRIVATE_DOWN' }); },
  });
  const service = createDiscipleshipLessonStateService({ discipleship: f.api, clock: () => '2026-10-04T12:00:00.000Z' });

  const receipt = await service.saveCurrentStep('pair-1', 'revision-1', 'step-2');
  assert.equal(receipt.status, 'in_progress');
  assert.equal(receipt.resumeStepId, 'step-2');
  assert.equal(receipt.startedAt, '2026-10-04T12:00:00.000Z');
  assert.equal(f.calls.includes('private'), false);

  await assert.rejects(service.load('pair-1', 'revision-1'), { code: 'PRIVATE_DOWN' });
});

test('same-lesson progress writes are serialized so an older slow write cannot overwrite a newer step', async () => {
  let progress = [];
  let releaseFirst;
  let firstSaveStarted;
  const firstStarted = new Promise(resolve => { firstSaveStarted = resolve; });
  const saves = [];
  const discipleship = {
    async loadLesson() { return structuredClone(lesson); },
    async loadOperationalProgress() { return structuredClone(progress); },
    async loadPrivateResponses() { return []; },
    async saveProgress(pairId, revisionId, value) {
      saves.push(value.currentStepId);
      if (saves.length === 1) {
        firstSaveStarted();
        await new Promise(resolve => { releaseFirst = resolve; });
      }
      progress = [{ lessonRevisionId: revisionId, ...structuredClone(value) }];
    },
    async savePrivateResponse() { return { id: 'response' }; },
  };
  const service = createDiscipleshipLessonStateService({ discipleship, clock: () => '2026-10-04T12:00:00.000Z' });

  const first = service.saveCurrentStep('pair-1', 'revision-1', 'step-1');
  await firstStarted;
  const second = service.saveCurrentStep('pair-1', 'revision-1', 'step-4');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(saves, ['step-1']);

  releaseFirst();
  const [firstReceipt, secondReceipt] = await Promise.all([first, second]);
  assert.equal(firstReceipt.resumeStepId, 'step-1');
  assert.equal(secondReceipt.resumeStepId, 'step-4');
  assert.deepEqual(saves, ['step-1', 'step-4']);
  assert.equal(progress[0].currentStepId, 'step-4');
  assert.equal(progress[0].startedAt, '2026-10-04T12:00:00.000Z');
});

test('completion queues behind navigation to Action and observes the persisted Action state', async () => {
  let progress = [{ lessonRevisionId: 'revision-1', status: 'in_progress', currentStepId: 'step-5', startedAt: '2026-10-04T10:00:00.000Z', completedAt: null }];
  let releaseAction;
  let actionStarted;
  const actionSaveStarted = new Promise(resolve => { actionStarted = resolve; });
  const saves = [];
  const discipleship = {
    async loadLesson() { return structuredClone(lesson); },
    async loadOperationalProgress() { return structuredClone(progress); },
    async loadPrivateResponses() { return []; },
    async saveProgress(pairId, revisionId, value) {
      saves.push(value.status);
      if (value.status === 'in_progress') {
        actionStarted();
        await new Promise(resolve => { releaseAction = resolve; });
      }
      progress = [{ lessonRevisionId: revisionId, ...structuredClone(value) }];
    },
    async savePrivateResponse() { return { id: 'response' }; },
  };
  const service = createDiscipleshipLessonStateService({ discipleship, clock: () => '2026-10-04T12:00:00.000Z' });

  const move = service.saveCurrentStep('pair-1', 'revision-1', 'step-6');
  await actionSaveStarted;
  const finish = service.complete('pair-1', 'revision-1');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(saves, ['in_progress']);

  releaseAction();
  const [, completion] = await Promise.all([move, finish]);
  assert.deepEqual(saves, ['in_progress', 'completed']);
  assert.equal(completion.completed, true);
  assert.equal(completion.resumeStepId, 'step-6');
  assert.equal(progress[0].status, 'completed');
});

test('a failed queued mutation does not poison the next valid progress write', async () => {
  const f = baseDiscipleship();
  const service = createDiscipleshipLessonStateService({ discipleship: f.api, clock: () => '2026-10-04T12:00:00.000Z' });

  const bad = service.saveCurrentStep('pair-1', 'revision-1', 'foreign-step');
  const good = service.saveCurrentStep('pair-1', 'revision-1', 'step-3');
  await assert.rejects(bad, { code: 'BQ_DISCIPLESHIP_PROGRESS_STEP_INVALID' });
  const receipt = await good;
  assert.equal(receipt.resumeStepId, 'step-3');
  assert.equal(f.getProgress()[0].currentStepId, 'step-3');
});
