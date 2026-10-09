import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonRunner } from '../../src/features/lesson-runner/controller.js';

const lesson = { revisionId: 'revision', steps: ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action']
  .map((type, index) => ({ id: `step-${index}`, type, content: { text: 'Lesson text' } })) };
const row = (stepId = 'step-3', response = 'saved') => ({ id: `response-${stepId}`, stepId, lessonRevisionId: 'revision', response, audienceUserIds: [], visibility: 'owner' });

function fixture({ userId = 'learner', loadResponses = async () => [], saveResponse, shareCallback, revokeCallback } = {}) {
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
    async shareResponse(pairId, revisionId, stepId, responseId, options) { log.push(['shareResponse', stepId, responseId, options]); return shareCallback ? shareCallback({pairId,revisionId,stepId,responseId,options}) : [{ id: 'share', response_id: responseId }]; },
    async revokeResponseShare(pairId, revisionId, stepId, responseId) { log.push(['revokeResponseShare', stepId, responseId]); return revokeCallback ? revokeCallback({pairId,revisionId,stepId,responseId}) : { id: 'share', response_id: responseId }; },
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

test('mentor preview hydrates only an explicitly shared response and never creates an editable draft', async () => {
  let reads = 0;
  const shared = { ...row('step-3', 'mentor-visible'), visibility: 'shared', audienceUserIds: ['mentor'] };
  const f = fixture({ userId: 'mentor', loadResponses: async () => { reads += 1; return [shared]; } });
  await f.runner.load();
  const state = f.runner.getState();
  assert.equal(state.writable, false);
  assert.equal(reads, 1);
  assert.equal(state.responses['step-3'].response, 'mentor-visible');
  assert.deepEqual(state.responseDrafts, {});
  assert.throws(() => f.runner.updateResponse('forbidden', 'step-3'), { code: 'BQ_LESSON_RESPONSE_DENIED' });
});

test('mentor preview fails closed if a repository ever returns an owner-only response', async () => {
  const f = fixture({ userId: 'mentor', loadResponses: async () => [row('step-3', 'must-not-leak')] });
  await f.runner.load();
  assert.equal(f.runner.getState().writable, false);
  assert.equal(f.runner.getState().responses['step-3'], undefined);
  assert.equal(f.runner.getState().responseStatus, 'error');
  assert.match(f.runner.getState().responseError, /not explicitly shared/);
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


test('mentee explicitly shares a persisted response and can make it private again', async () => {
  const f = fixture();
  await f.runner.load();
  await f.runner.move(1);
  f.runner.updateResponse('share this carefully', 'step-1');
  await f.runner.shareResponse('step-1', { confirmed: true });
  const shared = f.runner.getState().responses['step-1'];
  assert.equal(shared.visibility, 'shared');
  assert.deepEqual(shared.audienceUserIds, ['mentor']);
  const saveIndex = f.log.findIndex(entry => entry[0] === 'savePrivateResponse');
  const shareIndex = f.log.findIndex(entry => entry[0] === 'shareResponse');
  assert.ok(saveIndex >= 0 && shareIndex > saveIndex);
  assert.equal(f.responseWrites[0].response, 'share this carefully');

  await f.runner.revokeResponseShare('step-1');
  const privateAgain = f.runner.getState().responses['step-1'];
  assert.equal(privateAgain.visibility, 'owner');
  assert.deepEqual(privateAgain.audienceUserIds, []);
  assert.ok(f.log.some(entry => entry[0] === 'revokeResponseShare'));
});

test('mentee share requires explicit confirmation before any persistence or disclosure', async () => {
  const f = fixture();
  await f.runner.load();
  await f.runner.move(1);
  f.runner.updateResponse('not yet shared', 'step-1');
  await assert.rejects(f.runner.shareResponse('step-1'), { code: 'BQ_LESSON_SHARE_CONFIRMATION_REQUIRED' });
  assert.equal(f.responseWrites.length, 0);
  assert.equal(f.log.some(entry => entry[0] === 'shareResponse'), false);
});

test('overlapping explicit share and revoke taps cannot race or advance lesson while disclosure is pending', async () => {
  let finishSharing;
  const f=fixture({
    loadResponses: async()=>[row('step-1','saved private text')],
    shareCallback:()=>new Promise(resolve=>{finishSharing=resolve;}),
  });
  await f.runner.load();
  await f.runner.move(1);
  const first=f.runner.shareResponse('step-1',{confirmed:true});
  assert.equal(f.runner.getState().shareStatus,'saving');
  const sameShare=f.runner.shareResponse('step-1',{confirmed:true});
  const prematureRevoke=f.runner.revokeResponseShare('step-1');
  const prematureMove=f.runner.move(1);
  await Promise.all([sameShare,prematureRevoke,prematureMove]);
  assert.equal(f.runner.getState().stepIndex,1,'A pending disclosure must not advance the lesson.');
  assert.equal(f.log.filter(entry=>entry[0]==='shareResponse').length,1);
  assert.equal(f.log.filter(entry=>entry[0]==='revokeResponseShare').length,0);
  assert.equal(f.progressWrites.length,1,'No extra progress write while sharing.');
  finishSharing([{id:'share',response_id:'response-step-1'}]);
  await first;
  assert.equal(f.runner.getState().responses['step-1'].visibility,'shared');
  await f.runner.revokeResponseShare('step-1');
  assert.equal(f.log.filter(entry=>entry[0]==='revokeResponseShare').length,1);
  assert.equal(f.runner.getState().responses['step-1'].visibility,'owner');
});

test('an unfinished revoke cannot race a second share or navigation', async () => {
  let finishRevoke;
  const f=fixture({
    loadResponses:async()=>[{...row('step-1','already shared'),visibility:'shared',audienceUserIds:['mentor']}],
    revokeCallback:()=>new Promise(resolve=>{finishRevoke=resolve;}),
  });
  await f.runner.load();await f.runner.move(1);
  const pending=f.runner.revokeResponseShare('step-1');
  assert.equal(f.runner.getState().shareStatus,'saving');
  await Promise.all([
    f.runner.revokeResponseShare('step-1'),
    f.runner.shareResponse('step-1',{confirmed:true}),
    f.runner.move(1),
  ]);
  assert.equal(f.log.filter(row=>row[0]==='revokeResponseShare').length,1);
  assert.equal(f.log.filter(row=>row[0]==='shareResponse').length,0);
  assert.equal(f.runner.getState().stepIndex,1);
  finishRevoke({id:'share',response_id:'response-step-1'});
  await pending;
  assert.equal(f.runner.getState().responses['step-1'].visibility,'owner');
});

test('editing a shared answer revokes mentor access before updating the response row', async () => {
  const shared = { ...row('step-1', 'previous shared text'), visibility: 'shared', audienceUserIds: ['mentor'] };
  const f = fixture({ loadResponses: async () => [shared] });
  await f.runner.load(); await f.runner.move(1);
  f.runner.updateResponse('new private text', 'step-1');
  await f.runner.move(1);
  const operations = f.log.map(item => item[0]);
  const revocation = operations.indexOf('revokeResponseShare');
  const responseSave = operations.indexOf('savePrivateResponse');
  const progressSave = operations.lastIndexOf('saveProgress');
  assert.ok(revocation >= 0 && revocation < responseSave && responseSave < progressSave);
  assert.equal(f.responseWrites[0].response, 'new private text');
  assert.equal(f.runner.getState().responses['step-1'].visibility, 'owner');
  assert.deepEqual(f.runner.getState().responses['step-1'].audienceUserIds, []);
});

test('a failed revocation leaves a shared old answer intact and blocks the new draft', async () => {
  const shared = { ...row('step-1', 'old shared text'), visibility: 'shared', audienceUserIds: ['mentor'] };
  const f = fixture({ loadResponses: async () => [shared],
    revokeCallback: async () => { throw new Error('revoke unavailable'); } });
  await f.runner.load(); await f.runner.move(1);
  f.runner.updateResponse('never shared new draft', 'step-1');
  const progressBefore = f.progressWrites.length;
  await f.runner.move(1);
  const state = f.runner.getState();
  assert.equal(state.status, 'save-error');
  assert.equal(state.stepIndex, 1);
  assert.equal(state.responseDrafts['step-1'], 'never shared new draft');
  assert.equal(state.responses['step-1'].response, 'old shared text');
  assert.equal(f.responseWrites.length, 0);
  assert.equal(f.progressWrites.length, progressBefore);
});

test('an edit during a pending response save is flushed before advancing progress', async () => {
  let releaseFirstSave;
  let calls = 0;
  const f = fixture({ saveResponse: async ({ stepId }) => {
    calls += 1;
    if (calls === 1) await new Promise(resolve => { releaseFirstSave = resolve; });
    return { id: `response-${stepId}` };
  } });
  await f.runner.load(); await f.runner.move(1);
  f.runner.updateResponse('initial draft', 'step-1');
  const move = f.runner.move(1);
  await tick();
  assert.equal(f.responseWrites.length, 1);
  f.runner.updateResponse('latest draft', 'step-1');
  releaseFirstSave();
  await move;
  assert.deepEqual(f.responseWrites.map(item => item.response), ['initial draft', 'latest draft']);
  assert.equal(f.runner.getState().responses['step-1'].response, 'latest draft');
  assert.equal(f.runner.getState().stepIndex, 2);
  assert.ok(f.log.findLastIndex(item => item[0] === 'saveProgress') >
    f.log.findLastIndex(item => item[0] === 'savePrivateResponse'));
});

test('explicit privacy action after editing a shared answer revokes exactly once', async () => {
  const shared = { ...row('step-1', 'shared answer'), visibility: 'shared', audienceUserIds: ['mentor'] };
  const f = fixture({ loadResponses: async () => [shared] });
  await f.runner.load(); await f.runner.move(1);
  f.runner.updateResponse('private edit', 'step-1');
  await f.runner.revokeResponseShare('step-1');
  assert.equal(f.log.filter(item => item[0] === 'revokeResponseShare').length, 1);
  assert.equal(f.runner.getState().responses['step-1'].visibility, 'owner');
  assert.equal(f.runner.getState().shareStatus, 'ready');
});
