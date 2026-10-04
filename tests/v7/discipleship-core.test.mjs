import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipService } from '../../src/app/discipleship.js';

function fixture({ userId = 'mentee-1', congregationId = 'cong-1', pairState = 'active' } = {}) {
  const state = { authenticated: true, user: { id: userId } };
  const active = { congregationId, userId };
  const calls = [];
  const pair = { id: 'pair-1', congregationId, mentorId: 'mentor-1', menteeId: 'mentee-1', state: pairState };
  const repository = {
    async listPairs(context) { calls.push(['listPairs', context]); return [pair]; },
    async getPair(id, context) { calls.push(['getPair', id, context]); return pair; },
    async loadCurriculum() {
      return [{
        id: 'track-1', revisionId: 'track-r1', title: 'Track', position: 0,
        modules: [{
          id: 'module-1', revisionId: 'module-r1', title: 'Module', position: 0,
          lessons: [{ id: 'lesson-1', revisionId: 'lesson-r1', title: 'Lesson', position: 0 }],
        }],
      }];
    },
    async loadLessonRevision(id) {
      return { id: 'lesson-1', revisionId: id, published: true, steps: ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'].map(type => ({ type })) };
    },
    async loadOperationalProgress(revisionId) { return [{ pairId: 'pair-1', learnerId: 'mentee-1', lessonRevisionId: revisionId, currentStepId: 'step-scripture', status: 'started' }]; },
    async saveProgress(revisionId, progress, resolvedPair, context) { calls.push(['saveProgress', revisionId, progress, resolvedPair, context]); return { saved: true }; },
    async savePrivateResponse(args) { calls.push(['savePrivateResponse', args]); return { id: 'response-1' }; },
    async setResponseShare(args) { calls.push(['setResponseShare', args]); return { shared: true }; },
  };
  return {
    active,
    calls,
    setUser(id) { state.user.id = id; },
    setCongregation(id) { active.congregationId = id; },
    service: createDiscipleshipService({ repository, session: { getState: () => state }, membership: { getActive: () => active } }),
  };
}

test('requires an authenticated user and an explicitly active congregation', async () => {
  const state = { authenticated: false, user: null };
  const service = createDiscipleshipService({ repository: {}, session: { getState: () => state }, membership: { getActive: () => null } });
  await assert.rejects(service.listPairs(), { code: 'BQ_DISCIPLESHIP_AUTH_REQUIRED' });
  state.authenticated = true;
  state.user = { id: 'mentee-1' };
  await assert.rejects(service.listPairs(), { code: 'BQ_DISCIPLESHIP_SCOPE_REQUIRED' });
});

test('rejects a pair whose participant or congregation does not match the current context', async () => {
  const unauthorized = fixture({ userId: 'other-user' });
  await assert.rejects(unauthorized.service.listPairs(), { code: 'BQ_DISCIPLESHIP_PAIR_DENIED' });
  const wrongTenant = fixture();
  const wrongTenantService = createDiscipleshipService({
    repository: { ...{}, async listPairs() { return [{ id: 'pair-1', congregationId: 'cong-other', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'active' }]; } },
    session: { getState: () => ({ authenticated: true, user: { id: 'mentee-1' } }) },
    membership: { getActive: () => ({ congregationId: 'cong-1', userId: 'mentee-1' }) },
  });
  await assert.rejects(wrongTenantService.listPairs(), { code: 'BQ_DISCIPLESHIP_PAIR_RESPONSE' });
});

test('uses the accepted lesson sequence and rejects inactive pair access', async () => {
  const f = fixture();
  const tracks = await f.service.loadCurriculum('pair-1');
  assert.equal(tracks[0].modules[0].lessons[0].revisionId, 'lesson-r1');
  const lesson = await f.service.loadLesson('pair-1', 'revision-4');
  assert.equal(lesson.revisionId, 'revision-4');
  assert.equal(lesson.steps[0].type, 'scripture');
  const inactive = fixture({ pairState: 'suspended' });
  await assert.rejects(inactive.service.loadCurriculum('pair-1'), { code: 'BQ_DISCIPLESHIP_PAIR_INACTIVE' });
  const mismatched = fixture();
  mismatched.service = createDiscipleshipService({
    repository: { async getPair() { return { id: 'pair-1', congregationId: 'cong-1', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'active' }; }, async loadLessonRevision() { return { id: 'lesson-1', revisionId: 'another-revision', published: true, steps: ['scripture', 'understand', 'discuss', 'reflect', 'apply', 'pray', 'action'].map(type => ({ type })) }; } },
    session: { getState: () => ({ authenticated: true, user: { id: 'mentee-1' } }) },
    membership: { getActive: () => ({ congregationId: 'cong-1', userId: 'mentee-1' }) },
  });
  await assert.rejects(mismatched.service.loadLesson('pair-1', 'revision-4'), { code: 'BQ_DISCIPLESHIP_LESSON_RESPONSE' });
});

test('rejects duplicate curriculum ordering and progress from another published revision', async () => {
  const invalidCurriculum = createDiscipleshipService({
    repository: {
      async getPair() { return { id: 'pair-1', congregationId: 'cong-1', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'active' }; },
      async loadCurriculum() { return [
        { id: 'track-1', revisionId: 'track-r1', title: 'First', position: 0, modules: [] },
        { id: 'track-2', revisionId: 'track-r2', title: 'Second', position: 0, modules: [] },
      ]; },
    },
    session: { getState: () => ({ authenticated: true, user: { id: 'mentee-1' } }) },
    membership: { getActive: () => ({ congregationId: 'cong-1', userId: 'mentee-1' }) },
  });
  await assert.rejects(invalidCurriculum.loadCurriculum('pair-1'), { code: 'BQ_DISCIPLESHIP_CURRICULUM_RESPONSE' });

  const mismatchedProgress = createDiscipleshipService({
    repository: {
      async getPair() { return { id: 'pair-1', congregationId: 'cong-1', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'active' }; },
      async loadOperationalProgress() { return { pairId: 'pair-1', learnerId: 'mentee-1', lessonRevisionId: 'old-revision', status: 'started' }; },
    },
    session: { getState: () => ({ authenticated: true, user: { id: 'mentor-1' } }) },
    membership: { getActive: () => ({ congregationId: 'cong-1', userId: 'mentor-1' }) },
  });
  await assert.rejects(mismatchedProgress.loadOperationalProgress('pair-1', 'current-revision'), { code: 'BQ_DISCIPLESHIP_PROGRESS_SCOPE' });
});

test('projects operational progress without exposing private response text', async () => {
  const f = fixture();
  const progress = await f.service.loadOperationalProgress('pair-1', 'revision-4');
  assert.deepEqual(progress[0], { pairId: 'pair-1', learnerId: 'mentee-1', lessonRevisionId: 'revision-4', currentStepId: 'step-scripture', status: 'started', startedAt: null, completedAt: null, updatedAt: null });
  const leakingRepository = {
    async getPair() { return { id: 'pair-1', congregationId: 'cong-1', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'active' }; },
    async loadOperationalProgress() { return [{ pairId: 'pair-1', learnerId: 'mentee-1', status: 'started', reflectionText: 'private' }]; },
  };
  const leaking = createDiscipleshipService({ repository: leakingRepository, session: { getState: () => ({ authenticated: true, user: { id: 'mentor-1' } }) }, membership: { getActive: () => ({ congregationId: 'cong-1', userId: 'mentor-1' }) } });
  const projected = await leaking.loadOperationalProgress('pair-1', 'revision-4');
  assert.equal(Object.hasOwn(projected[0], 'reflectionText'), false);
});

test('allows only the mentee to mutate progress and saves private responses separately', async () => {
  const f = fixture();
  await assert.rejects(f.service.shareResponse('pair-1', 'revision-4', 'step-reflect', 'response-1'), { code: 'BQ_DISCIPLESHIP_SHARE_CONFIRMATION_REQUIRED' });
  await f.service.saveProgress('pair-1', 'revision-4', { status: 'started' });
  await f.service.savePrivateResponse('pair-1', 'revision-4', 'step-reflect', 'private text');
  await f.service.shareResponse('pair-1', 'revision-4', 'step-reflect', 'response-1', { confirmed: true });
  const savedResponse = f.calls.find(call => call[0] === 'savePrivateResponse')[1];
  assert.equal(savedResponse.stepId, 'step-reflect');
  assert.equal(savedResponse.visibility, 'owner');
  const share = f.calls.find(call => call[0] === 'setResponseShare')[1];
  assert.deepEqual(share.audienceUserIds, ['mentor-1']);
  const mentor = fixture({ userId: 'mentor-1' });
  await assert.rejects(mentor.service.saveProgress('pair-1', 'revision-4', { status: 'started' }), { code: 'BQ_DISCIPLESHIP_PROGRESS_DENIED' });
});

test('drops a read result when the active congregation changes mid-request', async () => {
  const f = fixture();
  let complete;
  const deferredRepository = {
    async listPairs() { return new Promise(resolve => { complete = resolve; }); },
  };
  const service = createDiscipleshipService({ repository: deferredRepository, session: { getState: () => ({ authenticated: true, user: { id: 'mentee-1' } }) }, membership: { getActive: () => f.active } });
  const pending = service.listPairs();
  f.setCongregation('cong-2');
  complete([{ id: 'pair-1', congregationId: 'cong-1', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'active' }]);
  await assert.rejects(pending, { code: 'BQ_DISCIPLESHIP_CONTEXT_STALE' });
});
