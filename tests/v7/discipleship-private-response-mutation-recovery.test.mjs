import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipLessonStateService } from '../../src/app/discipleship-lesson-state.js';

const types = ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'];
const lesson = { id: 'lesson-1', revisionId: 'revision-1', steps: types.map((type, index) => ({ id: `step-${index}`, type })) };

function serviceWithSave(savePrivateResponse) {
  return createDiscipleshipLessonStateService({
    discipleship: {
      async loadLesson() { return structuredClone(lesson); },
      async loadOperationalProgress() { return []; },
      async loadPrivateResponses() { return []; },
      async saveProgress() {},
      savePrivateResponse,
    },
  });
}

test('same-step private response writes are serialized so an older slow save cannot overwrite newer learner text', async () => {
  let releaseFirst;
  let firstStarted;
  let stored = null;
  const saves = [];
  const firstSaveStarted = new Promise(resolve => { firstStarted = resolve; });
  const service = serviceWithSave(async (pairId, revisionId, stepId, response) => {
    saves.push(response);
    if (saves.length === 1) {
      firstStarted();
      await new Promise(resolve => { releaseFirst = resolve; });
    }
    stored = response;
    return { id: 'response-1', pairId, revisionId, stepId, response };
  });

  const older = service.savePrivateStepResponse('pair-1', 'revision-1', 'step-5', 'older prayer');
  await firstSaveStarted;
  const newer = service.savePrivateStepResponse('pair-1', 'revision-1', 'step-5', 'newer prayer');
  await new Promise(resolve => setImmediate(resolve));

  assert.deepEqual(saves, ['older prayer']);
  releaseFirst();
  const [olderResult, newerResult] = await Promise.all([older, newer]);

  assert.equal(olderResult.response, 'older prayer');
  assert.equal(newerResult.response, 'newer prayer');
  assert.deepEqual(saves, ['older prayer', 'newer prayer']);
  assert.equal(stored, 'newer prayer');
});

test('a failed private response save does not poison the next queued save for that step', async () => {
  let stored = null;
  const saves = [];
  const service = serviceWithSave(async (pairId, revisionId, stepId, response) => {
    saves.push(response);
    if (response === 'bad draft') throw Object.assign(new Error('temporary write failure'), { code: 'WRITE_DOWN' });
    stored = response;
    return { id: 'response-1', pairId, revisionId, stepId, response };
  });

  const failed = service.savePrivateStepResponse('pair-1', 'revision-1', 'step-6', 'bad draft');
  const recovered = service.savePrivateStepResponse('pair-1', 'revision-1', 'step-6', 'recovered action');

  await assert.rejects(failed, { code: 'WRITE_DOWN' });
  const result = await recovered;

  assert.equal(result.response, 'recovered action');
  assert.deepEqual(saves, ['bad draft', 'recovered action']);
  assert.equal(stored, 'recovered action');
});
