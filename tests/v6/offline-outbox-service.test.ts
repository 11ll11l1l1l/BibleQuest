import assert from 'node:assert/strict';
import test from 'node:test';

import type { OfflineMutationPolicy } from '../../src/v6/offline/outbox.ts';
import type { OfflineOutboxPersistence, PersistedOfflineMutation } from '../../src/v6/offline/outbox-persistence.ts';
import { OfflineOutboxService } from '../../src/v6/offline/outbox-service.ts';

const safe: OfflineMutationPolicy = {
  domain: 'example-progress',
  operation: 'upsert',
  risk: 'safe-idempotent',
  queueable: true,
};

class MemoryPersistence implements OfflineOutboxPersistence {
  readonly records = new Map<string, PersistedOfflineMutation>();

  async list(): Promise<readonly unknown[]> {
    return [...this.records.values()].map((value) => structuredClone(value));
  }

  async put(record: PersistedOfflineMutation): Promise<void> {
    this.records.set(record.id, structuredClone(record));
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

function request(id = 'mutation-1', congregationId = 'congregation-a', accountId = 'user-1') {
  return {
    id,
    domain: 'example-progress',
    operation: 'upsert',
    idempotencyKey: `progress:${accountId}:${id}`,
    identity: { accountId, congregationId },
    createdAt: '2026-09-25T00:00:00.000Z',
    payload: { complete: true },
  };
}

const activeA = { accountId: 'user-1', congregationId: 'congregation-a' };

test('outbox service enqueues only explicitly approved safe-idempotent operations', async () => {
  const storage = new MemoryPersistence();
  const allowed = new OfflineOutboxService(storage, [safe]);
  const record = await allowed.enqueue(request());
  assert.equal(record.id, 'mutation-1');
  assert.equal(storage.records.size, 1);

  const denied = new OfflineOutboxService(new MemoryPersistence(), [{ ...safe, risk: 'privileged' }]);
  await assert.rejects(() => denied.enqueue(request()), /not explicitly allowlisted/i);
});

test('fresh service instance recovers durable due work only for the active account and congregation', async () => {
  const storage = new MemoryPersistence();
  const first = new OfflineOutboxService(storage, [safe], () => new Date('2026-09-25T00:00:00.000Z'));
  await first.enqueue(request('a', 'congregation-a'));
  await first.enqueue(request('b', 'congregation-b'));

  const restarted = new OfflineOutboxService(storage, [safe], () => new Date('2026-09-25T00:01:00.000Z'));
  const recovered = await restarted.recover(activeA);
  assert.deepEqual(recovered.replayable.map((item) => item.id), ['a']);
});

test('retry persists incremented attempt and due time across a fresh service instance', async () => {
  const storage = new MemoryPersistence();
  const clock = { now: new Date('2026-09-25T00:00:00.000Z') };
  const service = new OfflineOutboxService(storage, [safe], () => clock.now);
  const queued = await service.enqueue(request());
  const retried = await service.retry(queued, activeA);
  assert.equal(retried.attempt, 1);
  assert.equal(retried.retryAt, '2026-09-25T00:00:01.000Z');

  clock.now = new Date('2026-09-25T00:00:00.500Z');
  const early = await new OfflineOutboxService(storage, [safe], () => clock.now)
    .recover(activeA);
  assert.deepEqual(early.replayable, []);

  clock.now = new Date('2026-09-25T00:00:01.000Z');
  const due = await new OfflineOutboxService(storage, [safe], () => clock.now)
    .recover(activeA);
  assert.deepEqual(due.replayable.map((item) => item.id), ['mutation-1']);
  assert.equal(due.replayable[0]?.attempt, 1);
});

test('retry fails closed after account or congregation switch and preserves queued state', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe], () => new Date('2026-09-25T00:00:01.000Z'));
  const queued = await service.enqueue(request());

  await assert.rejects(
    () => service.retry(queued, { accountId: 'user-2', congregationId: 'congregation-a' }),
    /active account and congregation/i,
  );
  await assert.rejects(
    () => service.retry(queued, { accountId: 'user-1', congregationId: 'congregation-b' }),
    /active account and congregation/i,
  );
  await assert.rejects(() => service.retry(queued, null), /active account and congregation/i);

  assert.equal(storage.records.get('mutation-1')?.attempt, 0);
  assert.equal(storage.records.get('mutation-1')?.retryAt, null);
});

test('completion is tenant-bound so stale contexts cannot delete queued work', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const queued = await service.enqueue(request());

  await assert.rejects(
    () => service.complete(queued, { accountId: 'user-2', congregationId: 'congregation-a' }),
    /active account and congregation/i,
  );
  await assert.rejects(
    () => service.complete(queued, { accountId: 'user-1', congregationId: 'congregation-b' }),
    /active account and congregation/i,
  );
  assert.equal(storage.records.has('mutation-1'), true);

  await service.complete(queued, activeA);
  assert.equal(storage.records.size, 0);
});

test('policy revocation blocks retry persistence for the still-active tenant', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe], () => new Date('2026-09-25T00:00:00.000Z'));
  const queued = await service.enqueue(request());

  const revoked = new OfflineOutboxService(storage, [{ ...safe, queueable: false }], () => new Date('2026-09-25T00:00:01.000Z'));
  await assert.rejects(() => revoked.retry(queued, activeA), /not explicitly allowlisted/i);
  assert.equal(storage.records.get('mutation-1')?.attempt, 0);
});
