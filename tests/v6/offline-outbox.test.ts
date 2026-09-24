import assert from 'node:assert/strict';
import test from 'node:test';

import {
  OFFLINE_OUTBOX_SCHEMA_VERSION,
  canQueueOfflineMutation,
  createOfflineMutationEnvelope,
  envelopeMatchesActiveIdentity,
  nextOfflineMutationAttempt,
  selectReplayableOfflineMutations,
  type OfflineMutationPolicy,
} from '../../src/v6/offline/outbox.ts';

const safe: OfflineMutationPolicy = {
  domain: 'example-progress',
  operation: 'upsert',
  risk: 'safe-idempotent',
  queueable: true,
};

function request(congregationId = 'congregation-a') {
  return {
    id: 'mutation-1',
    domain: 'example-progress',
    operation: 'upsert',
    idempotencyKey: 'progress:user-1:item-1',
    identity: { accountId: 'user-1', congregationId },
    createdAt: '2026-09-25T00:00:00.000Z',
    payload: { complete: true },
  };
}

test('offline queue is deny-by-default and requires explicit safe-idempotent policy', () => {
  assert.equal(canQueueOfflineMutation(null, 'example-progress', 'upsert'), false);
  assert.equal(canQueueOfflineMutation({ ...safe, queueable: false }, 'example-progress', 'upsert'), false);
  assert.equal(canQueueOfflineMutation({ ...safe, risk: 'privileged' }, 'example-progress', 'upsert'), false);
  assert.equal(canQueueOfflineMutation({ ...safe, risk: 'destructive' }, 'example-progress', 'upsert'), false);
  assert.equal(canQueueOfflineMutation(safe, 'example-progress', 'delete'), false);
  assert.equal(canQueueOfflineMutation(safe, 'example-progress', 'upsert'), true);
});

test('queued mutations carry version, idempotency key, account and congregation identity', () => {
  const envelope = createOfflineMutationEnvelope(request(), safe);
  assert.equal(envelope.schemaVersion, OFFLINE_OUTBOX_SCHEMA_VERSION);
  assert.equal(envelope.idempotencyKey, 'progress:user-1:item-1');
  assert.deepEqual(envelope.identity, { accountId: 'user-1', congregationId: 'congregation-a' });
  assert.equal(envelope.attempt, 0);
});

test('queue refuses missing tenant identity and privileged/destructive operations', () => {
  assert.throws(() => createOfflineMutationEnvelope({ ...request(), identity: { accountId: 'user-1', congregationId: '' } }, safe), /explicit account and congregation/i);
  assert.throws(() => createOfflineMutationEnvelope(request(), { ...safe, risk: 'privileged' }), /not explicitly allowlisted/i);
  assert.throws(() => createOfflineMutationEnvelope(request(), { ...safe, risk: 'destructive' }), /not explicitly allowlisted/i);
});

test('replay fails closed after account or congregation switch', () => {
  const a = createOfflineMutationEnvelope(request('congregation-a'), safe);
  const b = createOfflineMutationEnvelope({ ...request('congregation-b'), id: 'mutation-2', idempotencyKey: 'progress:user-1:item-2' }, safe);

  assert.equal(envelopeMatchesActiveIdentity(a, { accountId: 'user-1', congregationId: 'congregation-a' }), true);
  assert.equal(envelopeMatchesActiveIdentity(a, { accountId: 'user-1', congregationId: 'congregation-b' }), false);
  assert.equal(envelopeMatchesActiveIdentity(a, { accountId: 'user-2', congregationId: 'congregation-a' }), false);

  assert.deepEqual(selectReplayableOfflineMutations([a, b], { accountId: 'user-1', congregationId: 'congregation-b' }, [safe]).map((item) => item.id), ['mutation-2']);
  assert.deepEqual(selectReplayableOfflineMutations([a, b], null, [safe]), []);
});

test('retry attempt increments without mutating the queued envelope', () => {
  const original = createOfflineMutationEnvelope(request(), safe);
  const retried = nextOfflineMutationAttempt(original);
  assert.equal(original.attempt, 0);
  assert.equal(retried.attempt, 1);
  assert.notEqual(retried, original);
});
