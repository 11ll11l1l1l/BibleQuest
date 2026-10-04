import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipLessonStateService } from '../../src/app/discipleship-lesson-state.js';

const types = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
const lesson = {
  id: 'lesson-1', revisionId: 'revision-1',
  steps: types.map((type, index) => ({ id: `step-${index}`, type })),
};

function fixture({ progress = [], responses = [] } = {}) {
  let savedProgress = progress;
  let savedResponses = responses;
  const calls = [];
  const discipleship = {
    async loadLesson(pairId, revisionId) {
      calls.push(['loadLesson', pairId, revisionId]);
      return structuredClone(lesson);
    },
    async loadOperationalProgress(pairId, revisionId) {
      calls.push(['loadOperationalProgress', pairId, revisionId]);
      return structuredClone(savedProgress);
    },
    async loadPrivateResponses(pairId, revisionId) {
      calls.push(['loadPrivateResponses', pairId, revisionId]);
      return structuredClone(savedResponses);
    },
    async saveProgress(pairId, revisionId, value) {
      calls.push(['saveProgress', pairId, revisionId, structuredClone(value)]);
      savedProgress = [{ lessonRevisionId: revisionId, ...value, updatedAt: '2026-10-04T12:30:00.000Z' }];
      return { saved: true };
    },
    async savePrivateResponse(pairId, revisionId, stepId, response) {
      calls.push(['savePrivateResponse', pairId, revisionId, stepId, structuredClone(response)]);
      return { id: 'response-new' };
    },
  };
  const service = createDiscipleshipLessonStateService({
    discipleship,
    clock: () => '2026-10-04T12:00:00.000Z',
  });
  return {
    calls,
    service,
    setProgress(value) { savedProgress = value; },
    setResponses(value) { savedResponses = value; },
  };
}

function progress(patch = {}) {
  return [{
    lessonRevisionId: 'revision-1', status: 'in_progress', currentStepId: 'step-3',
    startedAt: '2026-10-04T10:00:00.000Z', completedAt: null, updatedAt: '2026-10-04T11:00:00.000Z',
    ...patch,
  }];
}

function response(stepId, responseValue, patch = {}) {
  return {
    id: `response-${stepId}`, stepId, lessonRevisionId: 'revision-1', visibility: 'owner',
    audienceUserIds: [], response: responseValue, updatedAt: '2026-10-04T11:00:00.000Z', ...patch,
  };
}

test('new lesson resumes deterministically at Scripture without fabricating persisted progress', async () => {
  const f = fixture();
  const state = await f.service.load('pair-1', 'revision-1');
  assert.equal(state.status, 'not_started');
  assert.equal(state.persisted, false);
  assert.equal(state.currentStepId, null);
  assert.equal(state.resumeStepId, 'step-0');
  assert.equal(state.completed, false);
  assert.deepEqual(state.responses, []);
});

test('in-progress reload resumes the exact pinned step and restores prayer/action privately', async () => {
  const f = fixture({
    progress: progress({ currentStepId: 'step-5' }),
    responses: [
      response('step-5', { text: 'Private prayer' }),
      response('step-6', { commitment: 'Call a friend', done: false }),
    ],
  });
  const state = await f.service.load('pair-1', 'revision-1');
  assert.equal(state.status, 'in_progress');
  assert.equal(state.resumeStepId, 'step-5');
  assert.equal(state.prayerResponse.response.text, 'Private prayer');
  assert.equal(state.actionResponse.response.commitment, 'Call a friend');
  assert.equal(state.responsesByStep['step-5'].stepType, 'pray');
  assert.equal(state.responsesByStep['step-6'].stepType, 'action');
});

test('resume fails closed for duplicate progress, invalid states and foreign step ids', async () => {
  const duplicate = fixture({ progress: [...progress(), ...progress({ currentStepId: 'step-4' })] });
  await assert.rejects(duplicate.service.load('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_PROGRESS_INVALID' });

  const badStatus = fixture({ progress: progress({ status: 'started' }) });
  await assert.rejects(badStatus.service.load('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_PROGRESS_INVALID' });

  const foreignStep = fixture({ progress: progress({ currentStepId: 'step-other' }) });
  await assert.rejects(foreignStep.service.load('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_PROGRESS_STEP_INVALID' });
});

test('private state cannot be attached to a step outside the pinned lesson revision', async () => {
  const f = fixture({ progress: progress(), responses: [response('foreign-step', { text: 'wrong revision' })] });
  await assert.rejects(f.service.load('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_RESPONSE_INVALID' });
  const writesBefore = f.calls.filter(call => call[0] === 'savePrivateResponse').length;
  await assert.rejects(f.service.savePrivateStepResponse('pair-1', 'revision-1', 'foreign-step', { text: 'no' }),
    { code: 'BQ_DISCIPLESHIP_RESPONSE_SCOPE' });
  assert.equal(f.calls.filter(call => call[0] === 'savePrivateResponse').length, writesBefore);
});

test('saving a current step creates coherent in-progress state with a stable start time', async () => {
  const f = fixture();
  let state = await f.service.saveCurrentStep('pair-1', 'revision-1', 'step-2');
  const firstWrite = f.calls.find(call => call[0] === 'saveProgress');
  assert.deepEqual(firstWrite.slice(1), ['pair-1', 'revision-1', {
    status: 'in_progress', currentStepId: 'step-2', startedAt: '2026-10-04T12:00:00.000Z', completedAt: null,
  }]);
  assert.equal(state.resumeStepId, 'step-2');

  state = await f.service.saveCurrentStep('pair-1', 'revision-1', 'step-4');
  const writes = f.calls.filter(call => call[0] === 'saveProgress');
  assert.equal(writes[1][3].startedAt, '2026-10-04T12:00:00.000Z');
  assert.equal(state.resumeStepId, 'step-4');
});

test('completion is allowed only from Action and completed re-entry remains completed', async () => {
  const notReady = fixture({ progress: progress({ currentStepId: 'step-5' }) });
  await assert.rejects(notReady.service.complete('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_COMPLETION_NOT_READY' });
  assert.equal(notReady.calls.some(call => call[0] === 'saveProgress'), false);

  const f = fixture({ progress: progress({ currentStepId: 'step-6' }) });
  let state = await f.service.complete('pair-1', 'revision-1');
  assert.equal(state.completed, true);
  assert.equal(state.resumeStepId, 'step-6');
  assert.equal(state.completedAt, '2026-10-04T12:00:00.000Z');
  const writes = f.calls.filter(call => call[0] === 'saveProgress');
  assert.equal(writes.length, 1);
  assert.equal(writes[0][3].status, 'completed');

  state = await f.service.complete('pair-1', 'revision-1');
  assert.equal(state.completed, true);
  assert.equal(f.calls.filter(call => call[0] === 'saveProgress').length, 1);
  await assert.rejects(f.service.saveCurrentStep('pair-1', 'revision-1', 'step-3'), { code: 'BQ_DISCIPLESHIP_PROGRESS_COMPLETED' });
  assert.equal(f.calls.filter(call => call[0] === 'saveProgress').length, 1);
});

test('contradictory completion records fail closed instead of silently reopening', async () => {
  for (const patch of [
    { status: 'completed', currentStepId: 'step-5', completedAt: '2026-10-04T12:00:00.000Z' },
    { status: 'completed', currentStepId: 'step-6', completedAt: null },
    { status: 'in_progress', currentStepId: null },
    { status: 'not_started', currentStepId: 'step-0', startedAt: null },
  ]) {
    const f = fixture({ progress: progress(patch) });
    await assert.rejects(f.service.load('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_PROGRESS_INVALID' });
  }
});

test('private prayer/action writes are pinned to real lesson steps and remain separate from progress', async () => {
  const f = fixture({ progress: progress({ currentStepId: 'step-6' }) });
  await f.service.savePrivateStepResponse('pair-1', 'revision-1', 'step-5', { text: 'Prayer' });
  await f.service.savePrivateStepResponse('pair-1', 'revision-1', 'step-6', { commitment: 'Action' });
  const writes = f.calls.filter(call => call[0] === 'savePrivateResponse');
  assert.equal(writes.length, 2);
  assert.deepEqual(writes[0].slice(1), ['pair-1', 'revision-1', 'step-5', { text: 'Prayer' }]);
  assert.deepEqual(writes[1].slice(1), ['pair-1', 'revision-1', 'step-6', { commitment: 'Action' }]);
  assert.equal(f.calls.filter(call => call[0] === 'saveProgress').length, 0);
});

test('malformed lesson identity or duplicate step ids block all continuity decisions', async () => {
  const malformed = fixture();
  malformed.service = createDiscipleshipLessonStateService({
    discipleship: {
      loadLesson: async () => ({ ...lesson, revisionId: 'other' }),
      loadOperationalProgress: async () => [], loadPrivateResponses: async () => [],
      saveProgress: async () => {}, savePrivateResponse: async () => {},
    },
  });
  await assert.rejects(malformed.service.load('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_STATE_LESSON_INVALID' });

  const duplicateStepService = createDiscipleshipLessonStateService({
    discipleship: {
      loadLesson: async () => ({ ...lesson, steps: lesson.steps.map((step, index) => index === 1 ? { ...step, id: 'step-0' } : step) }),
      loadOperationalProgress: async () => [], loadPrivateResponses: async () => [],
      saveProgress: async () => {}, savePrivateResponse: async () => {},
    },
  });
  await assert.rejects(duplicateStepService.load('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_STATE_LESSON_INVALID' });
});
