import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiscipleshipSupabaseRepository } from '../../src/app/discipleship-supabase-adapter.js';

const context = { userId: 'learner', congregationId: 'church' };
const activePair = { id: 'pair', congregationId: 'church', mentorId: 'mentor', menteeId: 'learner', state: 'active' };
const endedPair = { ...activePair, state: 'ended' };

function fixture({ shareAck = 'valid', revokeAck = 'valid' } = {}) {
  const tables = {
    v7_pair_assignments: [{ id: 'assignment', pair_id: 'pair', lesson_revision_id: 'revision', status: 'assigned' }],
    v7_lesson_responses: [{ id: 'response', assignment_id: 'assignment', learner_id: 'learner', lesson_revision_id: 'revision', lesson_step_id: 'step-reflect' }],
    v7_response_shares: [{ id: 'share', response_id: 'response', recipient_id: 'mentor', share_state: 'shared', revoked_at: null }],
  };
  const client = {
    from(table) {
      const filters = [];
      let columns = '*';
      let mutation = null;
      const query = {
        select(value) { columns = value; return query; },
        eq(key, value) { filters.push(row => row[key] === value); return query; },
        neq(key, value) { filters.push(row => row[key] !== value); return query; },
        upsert(value) { mutation = { kind: 'upsert', value }; return query; },
        update(value) { mutation = { kind: 'update', value }; return query; },
        async then(resolve, reject) {
          try {
            let matched = (tables[table] ?? []).filter(row => filters.every(filter => filter(row)));
            if (mutation?.kind === 'upsert') {
              if (table === 'v7_response_shares') {
                if (shareAck === 'empty') matched = [];
                else matched = [{ id: 'share', ...mutation.value, ...(shareAck === 'wrong-recipient' ? { recipient_id: 'other' } : {}) }];
              }
            } else if (mutation?.kind === 'update') {
              matched = matched.map(row => ({ ...row, ...mutation.value }));
              if (revokeAck === 'empty') matched = [];
              if (revokeAck === 'wrong-response') matched = matched.map(row => ({ ...row, response_id: 'other-response' }));
            }
            const keys = columns === '*' ? null : columns.split(',').map(key => key.trim());
            const data = matched.map(row => keys ? Object.fromEntries(keys.map(key => [key, row[key]])) : { ...row });
            return resolve({ data, error: null });
          } catch (error) { return reject(error); }
        },
      };
      return query;
    },
  };
  return createDiscipleshipSupabaseRepository(client);
}

const shareArgs = {
  lessonRevisionId: 'revision', stepId: 'step-reflect', responseId: 'response', audienceUserIds: ['mentor'],
  pair: activePair, context,
};

test('sharing fails closed when the backend does not acknowledge the exact named mentor share', async () => {
  await assert.rejects(fixture({ shareAck: 'empty' }).setResponseShare(shareArgs), { code: 'BQ_DISCIPLESHIP_SHARE_ACK_INVALID' });
  await assert.rejects(fixture({ shareAck: 'wrong-recipient' }).setResponseShare(shareArgs), { code: 'BQ_DISCIPLESHIP_SHARE_ACK_INVALID' });

  const result = await fixture().setResponseShare(shareArgs);
  assert.equal(result.length, 1);
  assert.equal(result[0].response_id, 'response');
  assert.equal(result[0].recipient_id, 'mentor');
  assert.equal(result[0].share_state, 'shared');
});

test('revocation fails closed when the acknowledged share is not the exact requested response', async () => {
  const args = {
    lessonRevisionId: 'revision', stepId: 'step-reflect', responseId: 'response', recipientId: 'mentor',
    pair: endedPair, context,
  };
  await assert.rejects(fixture({ revokeAck: 'wrong-response' }).revokeResponseShare(args), { code: 'BQ_DISCIPLESHIP_SHARE_ACK_INVALID' });
  await assert.rejects(fixture({ revokeAck: 'empty' }).revokeResponseShare(args), { code: 'BQ_DISCIPLESHIP_SHARE_NOT_FOUND' });

  const result = await fixture().revokeResponseShare(args);
  assert.equal(result.response_id, 'response');
  assert.equal(result.recipient_id, 'mentor');
  assert.equal(result.share_state, 'revoked');
  assert.equal(Number.isNaN(Date.parse(result.revoked_at)), false);
});
