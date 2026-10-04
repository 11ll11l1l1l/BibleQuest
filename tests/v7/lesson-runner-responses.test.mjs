import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonRunner } from '../../src/features/lesson-runner/controller.js';

const lesson = { revisionId: 'revision', steps: ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action']
  .map((type, index) => ({ id: `step-${index}`, type, content: { text: 'Lesson text' } })) };
const row = (stepId = 'step-3', response = 'saved') => ({ id: `response-${stepId}`, stepId, lessonRevisionId: 'revision', response, audienceUserIds: [], visibility: 'owner' });

function fixture({ userId = 'learner', loadResponses = async () => [], saveResponse } = {}) {
  const auth = { authenticated: true, user: { id: userId } };
  const active = { congregationId: 'church', userId };
  const log = [], responseWrites = [], progressWrites = [];
  const service = {
    async listPairs() { return [{ id: 'pair', state: 'active', menteeId: 'learner', mentorId: 'mentor' }]; },
    async loadLesson() { return lesson; },
    async loadOperationalProgress() { return []; },
    async loadPrivateResponses(...args) { log.push(['loadPrivateResponses', ...args]); return loadResponses(...args); },
    async savePrivateResponse(pairId, revisionId, stepId, response) {
      log.push(['savePrivateResponse', stepId]); responseWrites.push({ pairId, revisionId, stepId, response });
      if (saveResponse) return saveResponse({ pairId, revisionId, stepId, response });
      return { id: `response-${stepId}` };
    },
    async saveProgress(pairId, revisionId, data) { log.push(['saveProgress', data.currentStepId]); progressWrites.push({ pairId, revisionId, data }); },
  };
  const runner = createLessonRunner({ service, session: { getState: () => auth }, membership: { getActive: () => active },
    pairId: 'pair', revisionId: 'revision', now: () => '2026-10-04T10:00:00Z' });
  return { runner, auth, active, log, responseWrites, progressWrites };
}

const tick = () => new Promise(resolve => setImmediate(resolve));

test('hydrates persisted owner responses into the exact immutable lesson revision', async () => {
  const f = fixture({ loadResponses: async () => [row('step-3', { text: 'restored', action: { done: false } })] });
  await f.runner.load();
  const state = f.runner.getState();
  assert.equal(state.status, 'ready');
  assert.equal(state.responseStatus, 'ready');
  assert.equal(state.responseDrafts['step-3'], 'restored');
  assert.equal(state.responses['step-3'].response.action.done, false);
});

test('late hydration never overwrites or injects a response edited after the read started', async () => {
  let resolveResponses;
  const f = fixture({ loadResponses: () => new Promise(resolve => { resolveResponses = resolve; }) });
  const pending = f.runner.load();
  await tick();
  assert.equal(f.runner.getState().responseStatus, 'loading');
  f.runner.updateResponse('fresh local edit', 'step-3');
  resolveResponses([row('step-3', 'stale database text')]);
  await pending;
  assert.equal(f.runner.getState().responseDrafts['step-3'], 'fresh local edit');
  assert.equal(f.runner.getState().responses['step-3'], undefined);
});

test('stale hydration cannot win even after the newer local edit has already been saved', async () => {
  let resolveResponses;
  const f = fixture({ loadResponses: () => new Promise(resolve => { resolveResponses = resolve; }) });
  const pending = f.runner.load();
  await tick();
  f.runner.updateResponse('newer saved text', 'step-0');
  await f.runner.move(1);
  assert.equal(f.responseWrites[0].response, 'newer saved text');
  resolveResponses([row('step-0', 'older database text')]);
  await pending;
  assert.equal(f.runner.getState().responseDrafts['step-0'], 'newer saved text');
  assert.equal(f.runner.getState().responses['step-0'].response, 'newer saved text');
});

test('a previous hydration request cannot inject data after a reload supersedes it', async () => {
  let resolveFirst, calls = 0;
  const f = fixture({ loadResponses: () => {
    calls += 1;
    if (calls === 1) return new Promise(resolve => { resolveFirst = resolve; });
    return Promise.resolve([row('step-3', 'new request')]);
  } });
  const first = f.runner.load(); await tick();
  await f.runner.load();
  assert.equal(f.runner.getState().responseDrafts['step-3'], 'new request');
  resolveFirst([row('step-3', 'obsolete request')]);
  await first;
  assert.equal(f.runner.getState().responseDrafts['step-3'], 'new request');
});

test('foreign-step or malformed hydration fails closed without erasing usable lesson progress', async () => {
  const f = fixture({ loadResponses: async () => [row('step-from-another-revision', 'private leak')] });
  await f.runner.load();
  const state = f.runner.getState();
  assert.equal(state.status, 'ready');
  assert.equal(state.lesson.revisionId, 'revision');
  assert.equal(state.responseStatus, 'error');
  assert.match(state.responseError, /did not belong/);
  assert.deepEqual(state.responseDrafts, {});
});

test('mentor preview never opens the owner-only private response reader', async () => {
  let reads = 0;
  const f = fixture({ userId: 'mentor', loadResponses: async () => { reads += 1; return [row()]; } });
  await f.runner.load();
  assert.equal(f.runner.getState().writable, false);
  assert.equal(reads, 0);
  assert.deepEqual(f.runner.getState().responseDrafts, {});
  assert.throws(() => f.runner.updateResponse('forbidden', 'step-3'), { code: 'BQ_LESSON_RESPONSE_DENIED' });
});

test('saving a step persists its private response before advancing operational progress', async () => {
  const f = fixture({ loadResponses: async () => [row('step-3', { text: 'old', action: { done: false } })] });
  await f.runner.load();
  await f.runner.move(1); await f.runner.move(1); await f.runner.move(1);
  f.runner.updateResponse('edited reflection', 'step-3');
  await f.runner.move(1);
  const write = f.responseWrites.at(-1);
  assert.equal(write.stepId, 'step-3');
  assert.deepEqual(write.response, { text: 'edited reflection', action: { done: false } });
  const privateIndex = f.log.findLastIndex(entry => entry[0] === 'savePrivateResponse');
  const progressIndex = f.log.findLastIndex(entry => entry[0] === 'saveProgress');
  assert.ok(privateIndex >= 0 && privateIndex < progressIndex);
  assert.equal(f.runner.getState().stepIndex, 4);
});

test('private response save failure keeps the draft and does not advance progress', async () => {
  const f = fixture({ saveResponse: async () => { throw new Error('response offline'); } });
  await f.runner.load();
  await f.runner.move(1);
  const progressBefore = f.progressWrites.length;
  f.runner.updateResponse('do not lose this', 'step-1');
  await f.runner.move(1);
  const state = f.runner.getState();
  assert.equal(state.status, 'save-error');
  assert.equal(state.stepIndex, 1);
  assert.equal(state.responseDrafts['step-1'], 'do not lose this');
  assert.equal(f.progressWrites.length, progressBefore);
});

test('private-response read failure is non-destructive and navigation can still retry/save', async () => {
  const f = fixture({ loadResponses: async () => { throw new Error('temporary read failure'); } });
  await f.runner.load();
  assert.equal(f.runner.getState().status, 'ready');
  assert.equal(f.runner.getState().responseStatus, 'error');
  await f.runner.move(1);
  assert.equal(f.runner.getState().stepIndex, 1);
});
