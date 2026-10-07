import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipService } from '../../src/app/discipleship.js';
import { createDiscipleshipSupabaseRepository } from '../../src/app/discipleship-supabase-adapter.js';

const menteeContext = { userId: 'mentee-1', congregationId: 'church-1' };
const endedPair = {
  id: 'pair-1', congregationId: 'church-1', mentorId: 'mentor-1', menteeId: 'mentee-1', state: 'ended',
};

function serviceFixture({ userId = 'mentee-1', pair = endedPair } = {}) {
  const calls = [];
  const repository = {
    async getPair() { return pair; },
    async revokeResponseShare(args) { calls.push(args); return { id: 'share-1', share_state: 'revoked' }; },
  };
  const service = createDiscipleshipService({
    repository,
    session: { getState: () => ({ authenticated: true, user: { id: userId } }) },
    membership: { getActive: () => ({ userId, congregationId: 'church-1' }) },
  });
  return { calls, service };
}

test('mentee can revoke an explicit share after the ONE 2 ONE pair has ended', async () => {
  const f = serviceFixture();
  const result = await f.service.revokeResponseShare('pair-1', 'revision-1', 'step-reflect', 'response-1');
  assert.equal(result.share_state, 'revoked');
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].recipientId, 'mentor-1');
  assert.equal(f.calls[0].pair.state, 'ended');
  assert.equal(f.calls[0].lessonRevisionId, 'revision-1');
  assert.equal(f.calls[0].stepId, 'step-reflect');
  assert.equal(f.calls[0].responseId, 'response-1');
});

test('mentor cannot revoke the mentee response share', async () => {
  const f = serviceFixture({ userId: 'mentor-1' });
  await assert.rejects(
    f.service.revokeResponseShare('pair-1', 'revision-1', 'step-reflect', 'response-1'),
    { code: 'BQ_DISCIPLESHIP_SHARE_DENIED' },
  );
  assert.equal(f.calls.length, 0);
});

function repositoryFixture() {
  const tables = {
    v7_lesson_responses: [{
      id: 'response-1', assignment_id: 'assignment-1', learner_id: 'mentee-1',
      lesson_revision_id: 'revision-1', lesson_step_id: 'step-reflect',
    }],
    // A cancelled assignment must not trap an old share in the shared state.
    v7_pair_assignments: [{
      id: 'assignment-1', pair_id: 'pair-1', lesson_revision_id: 'revision-1', status: 'cancelled',
    }],
    v7_response_shares: [{
      id: 'share-1', response_id: 'response-1', recipient_id: 'mentor-1', share_state: 'shared', revoked_at: null,
    }],
  };
  const writes = [];
  const client = {
    from(table) {
      const filters = [];
      let columns = '*';
      let mutation = null;
      const query = {
        select(value) { columns = value; return query; },
        eq(key, value) { filters.push(row => row[key] === value); return query; },
        update(value) { mutation = { value }; return query; },
        async then(resolve, reject) {
          try {
            const matched = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
            if (mutation) {
              for (const row of matched) Object.assign(row, mutation.value);
              writes.push({ table, value: mutation.value, matched: matched.length });
            }
            const keys = columns === '*' ? null : columns.split(',').map(key => key.trim());
            const data = matched.map(row => keys
              ? Object.fromEntries(keys.map(key => [key, row[key]]))
              : { ...row });
            return resolve({ data, error: null });
          } catch (error) {
            return reject(error);
          }
        },
      };
      return query;
    },
  };
  return { tables, writes, repository: createDiscipleshipSupabaseRepository(client) };
}

test('repository revokes an existing mentor share without requiring an active assignment or pair', async () => {
  const f = repositoryFixture();
  const result = await f.repository.revokeResponseShare({
    lessonRevisionId: 'revision-1', stepId: 'step-reflect', responseId: 'response-1', recipientId: 'mentor-1',
    pair: endedPair, context: menteeContext,
  });
  assert.equal(result.id, 'share-1');
  assert.equal(result.share_state, 'revoked');
  assert.equal(Number.isNaN(Date.parse(result.revoked_at)), false);
  assert.equal(f.tables.v7_response_shares[0].share_state, 'revoked');
  assert.equal(f.writes.length, 1);
  assert.equal(f.writes[0].table, 'v7_response_shares');
  assert.equal(f.writes[0].matched, 1);
});

test('repository refuses cross-pair revocation before touching the share row', async () => {
  const f = repositoryFixture();
  await assert.rejects(f.repository.revokeResponseShare({
    lessonRevisionId: 'revision-1', stepId: 'step-reflect', responseId: 'response-1', recipientId: 'mentor-1',
    pair: { ...endedPair, id: 'pair-other' }, context: menteeContext,
  }), { code: 'BQ_DISCIPLESHIP_SHARE_DENIED' });
  assert.equal(f.writes.length, 0);
  assert.equal(f.tables.v7_response_shares[0].share_state, 'shared');
});

test('repository reports already-private responses instead of manufacturing a share row', async () => {
  const f = repositoryFixture();
  f.tables.v7_response_shares[0].share_state = 'revoked';
  f.tables.v7_response_shares[0].revoked_at = '2026-10-04T00:00:00.000Z';
  await assert.rejects(f.repository.revokeResponseShare({
    lessonRevisionId: 'revision-1', stepId: 'step-reflect', responseId: 'response-1', recipientId: 'mentor-1',
    pair: endedPair, context: menteeContext,
  }), { code: 'BQ_DISCIPLESHIP_SHARE_NOT_FOUND' });
  assert.equal(f.tables.v7_response_shares.length, 1);
  assert.equal(f.tables.v7_response_shares[0].share_state, 'revoked');
});
