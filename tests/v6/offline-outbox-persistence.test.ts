import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createOfflineMutationEnvelope,
  scheduleOfflineMutationRetry,
  type OfflineMutationPolicy,
} from '../../src/v6/offline/outbox.ts';
import {
  OFFLINE_OUTBOX_DB_VERSION,
  parsePersistedOfflineMutation,
  recoverOfflineOutbox,
  samePersistedOfflineMutation,
  toPersistedOfflineMutation,
  type OfflineOutboxPersistence,
  type PersistedOfflineMutation,
} from '../../src/v6/offline/outbox-persistence.ts';

const safe: OfflineMutationPolicy = {
  domain: 'example-progress',
  operation: 'upsert',
  risk: 'safe-idempotent',
  queueable: true,
};

function envelope(id: string, congregationId = 'congregation-a') {
  return createOfflineMutationEnvelope({
    id,
    domain: 'example-progress',
    operation: 'upsert',
    idempotencyKey: `progress:user-1:${id}`,
    identity: { accountId: 'user-1', congregationId },
    createdAt: '2026-09-25T00:00:00.000Z',
    payload: { complete: true },
  }, safe);
}

class MemoryPersistence implements OfflineOutboxPersistence {
  readonly records = new Map<string, unknown>();

  async list(): Promise<readonly unknown[]> {
    return [...this.records.values()];
  }

  async put(record: PersistedOfflineMutation): Promise<void> {
    this.records.set(record.id, structuredClone(record));
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async compareAndPut(
    expected: PersistedOfflineMutation,
    record: PersistedOfflineMutation,
  ): Promise<boolean> {
    const current = parsePersistedOfflineMutation(this.records.get(expected.id));
    if (!samePersistedOfflineMutation(current, expected)) return false;
    this.records.set(record.id, structuredClone(record));
    return true;
  }

  async compareAndDelete(expected: PersistedOfflineMutation): Promise<boolean> {
    const current = parsePersistedOfflineMutation(this.records.get(expected.id));
    if (!samePersistedOfflineMutation(current, expected)) return false;
    this.records.delete(expected.id);
    return true;
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

test('durable offline outbox schema is versioned and rejects corrupt records fail-closed', () => {
  assert.equal(OFFLINE_OUTBOX_DB_VERSION, 1);
  const valid = toPersistedOfflineMutation(envelope('mutation-1'));
  assert.equal(parsePersistedOfflineMutation(valid)?.id, 'mutation-1');

  assert.equal(parsePersistedOfflineMutation({ ...valid, schemaVersion: 99 }), null);
  assert.equal(parsePersistedOfflineMutation({ ...valid, attempt: -1 }), null);
  assert.equal(parsePersistedOfflineMutation({ ...valid, createdAt: 'not-a-date' }), null);
  assert.equal(parsePersistedOfflineMutation({ ...valid, retryAt: 'later' }), null);
  assert.equal(parsePersistedOfflineMutation({ ...valid, identity: { accountId: '', congregationId: 'congregation-a' } }), null);
});

test('durable record comparison includes retry version, immutable metadata and JSON-like payload', () => {
  const original = toPersistedOfflineMutation(envelope('mutation-1'));
  const reorderedPayload = {
    ...original,
    payload: { complete: true },
  };

  assert.equal(samePersistedOfflineMutation(original, reorderedPayload), true);
  assert.equal(samePersistedOfflineMutation(original, { ...original, attempt: 1 }), false);
  assert.equal(
    samePersistedOfflineMutation(original, { ...original, retryAt: '2026-09-25T00:00:01.000Z' }),
    false,
  );
  assert.equal(
    samePersistedOfflineMutation(original, { ...original, payload: { complete: false } }),
    false,
  );
});

test('queued safe mutation survives a simulated app restart and remains identity-bound', async () => {
  const durable = new MemoryPersistence();
  await durable.put(toPersistedOfflineMutation(envelope('mutation-a')));

  // A new recovery owner represents a fresh page/app process using the same durable store.
  const recoveredA = await recoverOfflineOutbox(
    durable,
    { accountId: 'user-1', congregationId: 'congregation-a' },
    [safe],
    new Date('2026-09-25T00:01:00.000Z'),
  );
  assert.deepEqual(recoveredA.replayable.map((item) => item.id), ['mutation-a']);

  const recoveredB = await recoverOfflineOutbox(
    durable,
    { accountId: 'user-1', congregationId: 'congregation-b' },
    [safe],
    new Date('2026-09-25T00:01:00.000Z'),
  );
  assert.deepEqual(recoveredB.replayable, []);
});

test('recovery revalidates current allowlist so persisted operations cannot bypass a later policy change', async () => {
  const durable = new MemoryPersistence();
  await durable.put(toPersistedOfflineMutation(envelope('mutation-1')));

  const denied = await recoverOfflineOutbox(
    durable,
    { accountId: 'user-1', congregationId: 'congregation-a' },
    [{ ...safe, queueable: false }],
    new Date('2026-09-25T00:01:00.000Z'),
  );
  assert.deepEqual(denied.replayable, []);
});

test('future retry records remain deferred after restart until their deterministic retry time', async () => {
  const durable = new MemoryPersistence();
  const original = envelope('mutation-1');
  const scheduled = scheduleOfflineMutationRetry(original, new Date('2026-09-25T00:00:00.000Z'));
  await durable.put(toPersistedOfflineMutation(scheduled.envelope, scheduled.retryAt));

  const early = await recoverOfflineOutbox(
    durable,
    { accountId: 'user-1', congregationId: 'congregation-a' },
    [safe],
    new Date('2026-09-25T00:00:00.500Z'),
  );
  assert.equal(early.deferredRecords, 1);
  assert.deepEqual(early.replayable, []);

  const due = await recoverOfflineOutbox(
    durable,
    { accountId: 'user-1', congregationId: 'congregation-a' },
    [safe],
    new Date('2026-09-25T00:00:01.000Z'),
  );
  assert.deepEqual(due.replayable.map((item) => item.id), ['mutation-1']);
});

test('corrupt durable rows are ignored without blocking valid queued work', async () => {
  const durable = new MemoryPersistence();
  await durable.put(toPersistedOfflineMutation(envelope('good')));
  durable.records.set('bad', { id: 'bad', schemaVersion: 1, attempt: -10 });

  const recovered = await recoverOfflineOutbox(
    durable,
    { accountId: 'user-1', congregationId: 'congregation-a' },
    [safe],
    new Date('2026-09-25T00:01:00.000Z'),
  );
  assert.equal(recovered.rejectedRecords, 1);
  assert.deepEqual(recovered.replayable.map((item) => item.id), ['good']);
});
