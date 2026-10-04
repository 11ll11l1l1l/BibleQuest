import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipService } from '../../src/app/discipleship.js';
import { createDiscipleshipSupabaseRepository } from '../../src/app/discipleship-supabase-adapter.js';

const endedPair = {
  id: 'pair-1', congregationId: 'church-1', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'ended',
};
const context = { userId: 'mentee-1', congregationId: 'church-1' };

function serviceFixture({ userId = 'mentee-1' } = {}) {
  const calls = [];
  const repository = {
    async getPair() { return endedPair; },
    async loadPrivateResponses(revisionId, pair, requestContext) {
      calls.push(['private', revisionId, pair.state, requestContext.userId]);
      return [{
        id: 'response-1', learnerId: 'mentee-1', lessonRevisionId: revisionId, stepId: 'step-reflect',
        response: { text: 'Learner-owned history' }, audienceUserIds: [], updatedAt: '2026-10-04T10:00:00.000Z',
      }];
    },
    async loadOperationalProgress() { calls.push(['progress']); return []; },
    async savePrivateResponse() { calls.push(['save-private']); return { id: 'response-new' }; },
  };
  const service = createDiscipleshipService({
    repository,
    session: { getState: () => ({ authenticated: true, user: { id: userId } }) },
    membership: { getActive: () => ({ userId, congregationId: 'church-1' }) },
  });
  return { calls, service };
}

test('learner can reopen owned private responses after the ONE 2 ONE pair ends', async () => {
  const f = serviceFixture();
  const [response] = await f.service.loadPrivateResponses('pair-1', 'revision-1');
  assert.equal(response.response.text, 'Learner-owned history');
  assert.equal(response.visibility, 'owner');
  assert.deepEqual(f.calls, [['private', 'revision-1', 'ended', 'mentee-1']]);
});

test('ended-pair owner-history exception does not expose private responses to the mentor', async () => {
  const f = serviceFixture({ userId: 'mentor-1' });
  await assert.rejects(f.service.loadPrivateResponses('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_RESPONSE_DENIED' });
  assert.equal(f.calls.length, 0);
});

test('ended-pair history does not reopen operational progress or private-response writes', async () => {
  const f = serviceFixture();
  await assert.rejects(f.service.loadOperationalProgress('pair-1', 'revision-1'), { code: 'BQ_DISCIPLESHIP_PAIR_INACTIVE' });
  await assert.rejects(f.service.savePrivateResponse('pair-1', 'revision-1', 'step-reflect', { text: 'new' }),
    { code: 'BQ_DISCIPLESHIP_PAIR_INACTIVE' });
  assert.equal(f.calls.some(call => call[0] === 'progress' || call[0] === 'save-private'), false);
});

function repositoryFixture() {
  const tables = {
    v7_pair_assignments: [{ id: 'assignment-1', pair_id: 'pair-1', lesson_revision_id: 'revision-1', status: 'completed' }],
    v7_lesson_responses: [{
      id: 'response-1', assignment_id: 'assignment-1', learner_id: 'mentee-1', lesson_revision_id: 'revision-1',
      lesson_step_id: 'step-reflect', response: { text: 'Historical response' }, updated_at: '2026-10-04T10:00:00.000Z', shares: [],
    }],
  };
  const client = {
    from(table) {
      const filters = [];
      let columns = '*';
      const query = {
        select(value) { columns = value; return query; },
        eq(key, value) { filters.push(row => row[key] === value); return query; },
        neq(key, value) { filters.push(row => row[key] !== value); return query; },
        order() { return query; },
        async then(resolve, reject) {
          try {
            const matched = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
            const selected = matched.map(row => {
              if (columns.includes('shares:v7_response_shares')) return { ...row };
              if (columns === '*') return { ...row };
              const keys = columns.split(',').map(value => value.trim());
              return Object.fromEntries(keys.map(key => [key, row[key]]));
            });
            return resolve({ data: selected, error: null });
          } catch (error) { return reject(error); }
        },
      };
      return query;
    },
  };
  return createDiscipleshipSupabaseRepository(client);
}

test('repository permits only the learner owner to read response history for an ended pair', async () => {
  const repository = repositoryFixture();
  const rows = await repository.loadPrivateResponses('revision-1', endedPair, context);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].response.text, 'Historical response');
  assert.equal(rows[0].pairId, 'pair-1');

  await assert.rejects(repository.loadPrivateResponses('revision-1', endedPair, { ...context, userId: 'mentor-1' }),
    { code: 'BQ_DISCIPLESHIP_SCOPE_DENIED' });
});
