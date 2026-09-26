import assert from 'node:assert/strict';
import test from 'node:test';

import type { OfflineMutationPolicy } from '../../src/v6/offline/outbox.ts';
import {
  samePersistedOfflineMutation,
  type OfflineOutboxPersistence,
  type PersistedOfflineMutation,
} from '../../src/v6/offline/outbox-persistence.ts';
import { OfflineOutboxService, createV6OfflineOutboxService } from '../../src/v6/offline/outbox-service.ts';

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

  async compareAndPut(
    expected: PersistedOfflineMutation,
    record: PersistedOfflineMutation,
  ): Promise<boolean> {
    const current = this.records.get(expected.id);
    if (!samePersistedOfflineMutation(current, expected)) return false;
    this.records.set(record.id, structuredClone(record));
    return true;
  }

  async compareAndDelete(expected: PersistedOfflineMutation): Promise<boolean> {
    const current = this.records.get(expected.id);
    if (!samePersistedOfflineMutation(current, expected)) return false;
    this.records.delete(expected.id);
    return true;
  }

  async clear(): Promise<void> {
    this.records.clear();
  }
}

class RacingPersistence extends MemoryPersistence {
  beforeCompareAndPut: (() => void) | null = null;
  beforeCompareAndDelete: (() => void) | null = null;

  override async compareAndPut(
    expected: PersistedOfflineMutation,
    record: PersistedOfflineMutation,
  ): Promise<boolean> {
    this.beforeCompareAndPut?.();
    this.beforeCompareAndPut = null;
    return super.compareAndPut(expected, record);
  }

  override async compareAndDelete(expected: PersistedOfflineMutation): Promise<boolean> {
    this.beforeCompareAndDelete?.();
    this.beforeCompareAndDelete = null;
    return super.compareAndDelete(expected);
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

test('retry advances from the latest durable attempt instead of a stale caller envelope', async () => {
  const storage = new MemoryPersistence();
  const clock = { now: new Date('2026-09-25T00:00:00.000Z') };
  const service = new OfflineOutboxService(storage, [safe], () => clock.now);
  const queued = await service.enqueue(request());

  const first = await service.retry(queued, activeA);
  assert.equal(first.attempt, 1);
  assert.equal(first.retryAt, '2026-09-25T00:00:01.000Z');

  clock.now = new Date('2026-09-25T00:00:01.000Z');
  const second = await service.retry(queued, activeA);
  assert.equal(second.attempt, 2);
  assert.equal(second.retryAt, '2026-09-25T00:00:03.000Z');
  assert.equal(storage.records.get(queued.id)?.attempt, 2);
});

test('atomic retry cannot resurrect work completed after retry reads durable state', async () => {
  const storage = new RacingPersistence();
  const service = new OfflineOutboxService(storage, [safe], () => new Date('2026-09-25T00:00:01.000Z'));
  const queued = await service.enqueue(request());

  storage.beforeCompareAndPut = () => {
    storage.records.delete(queued.id);
  };

  await assert.rejects(
    () => service.retry(queued, activeA),
    /changed concurrently before retry persistence/i,
  );
  assert.equal(storage.records.has(queued.id), false);
});

test('atomic retry refuses to overwrite a newer retry state from another worker', async () => {
  const storage = new RacingPersistence();
  const service = new OfflineOutboxService(storage, [safe], () => new Date('2026-09-25T00:00:01.000Z'));
  const queued = await service.enqueue(request());

  storage.beforeCompareAndPut = () => {
    storage.records.set(queued.id, {
      ...structuredClone(queued),
      attempt: 1,
      retryAt: '2026-09-25T00:00:02.000Z',
    });
  };

  await assert.rejects(
    () => service.retry(queued, activeA),
    /changed concurrently before retry persistence/i,
  );
  assert.equal(storage.records.get(queued.id)?.attempt, 1);
  assert.equal(storage.records.get(queued.id)?.retryAt, '2026-09-25T00:00:02.000Z');
});

test('retry cannot resurrect work that was already completed', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const queued = await service.enqueue(request());

  await service.complete(queued, activeA);
  await assert.rejects(() => service.retry(queued, activeA), /no longer queued/i);
  assert.equal(storage.records.size, 0);
});

test('retry fails closed when the durable id belongs to a different logical mutation', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const queued = await service.enqueue(request());
  storage.records.set(queued.id, structuredClone({
    ...queued,
    idempotencyKey: 'progress:user-1:different-logical-write',
  }));

  await assert.rejects(() => service.retry(queued, activeA), /different queued mutation/i);
  assert.equal(storage.records.get(queued.id)?.idempotencyKey, 'progress:user-1:different-logical-write');
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
  await assert.rejects(
    () => service.complete(queued, null),
    /active account and congregation/i,
  );
  assert.equal(storage.records.has('mutation-1'), true);

  await service.complete(queued, activeA);
  assert.equal(storage.records.size, 0);

  await service.complete(queued, activeA);
  assert.equal(storage.records.size, 0);
});

test('atomic completion refuses to delete state retried by another worker after inspection', async () => {
  const storage = new RacingPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const queued = await service.enqueue(request());

  storage.beforeCompareAndDelete = () => {
    storage.records.set(queued.id, {
      ...structuredClone(queued),
      attempt: 1,
      retryAt: '2026-09-25T00:00:02.000Z',
    });
  };

  await assert.rejects(
    () => service.complete(queued, activeA),
    /changed concurrently before completion/i,
  );
  assert.equal(storage.records.get(queued.id)?.attempt, 1);
  assert.equal(storage.records.get(queued.id)?.retryAt, '2026-09-25T00:00:02.000Z');
});

test('stale completion cannot delete a newer logical mutation that reuses the same durable id', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const original = await service.enqueue(request());

  await service.complete(original, activeA);
  const replacement = await service.enqueue({
    ...request(original.id),
    idempotencyKey: original.idempotencyKey,
    createdAt: '2026-09-25T00:00:05.000Z',
    payload: { complete: false },
  });

  await assert.rejects(() => service.complete(original, activeA), /no longer matches the queued mutation/i);
  assert.equal(storage.records.get(replacement.id)?.idempotencyKey, original.idempotencyKey);
  assert.equal(storage.records.get(replacement.id)?.createdAt, replacement.createdAt);
  assert.deepEqual(storage.records.get(replacement.id)?.payload, { complete: false });

  await service.complete(replacement, activeA);
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


test('duplicate enqueue preserves the already-durable retry state instead of resetting it', async () => {
  const storage = new MemoryPersistence();
  const clock = { now: new Date('2026-09-25T00:00:00.000Z') };
  const service = new OfflineOutboxService(storage, [safe], () => clock.now);
  const queued = await service.enqueue(request());
  const retried = await service.retry(queued, activeA);
  assert.equal(retried.attempt, 1);

  const duplicate = await service.enqueue(request());
  assert.equal(duplicate.id, queued.id);
  assert.equal(duplicate.attempt, 1);
  assert.equal(duplicate.retryAt, '2026-09-25T00:00:01.000Z');
  assert.equal(storage.records.size, 1);
});

test('conflicting reuse of an idempotency key fails closed without replacing queued work', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const original = await service.enqueue(request());

  await assert.rejects(
    () => service.enqueue({ ...request('mutation-2'), idempotencyKey: original.idempotencyKey }),
    /idempotency key conflicts/i,
  );

  assert.equal(storage.records.size, 1);
  assert.equal(storage.records.has(original.id), true);
  assert.equal(storage.records.has('mutation-2'), false);
});

test('conflicting reuse of a durable mutation id with a different idempotency key fails closed', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const original = await service.enqueue(request());

  await assert.rejects(
    () => service.enqueue({ ...request(original.id), idempotencyKey: 'progress:user-1:replacement-logical-write' }),
    /mutation id conflicts/i,
  );

  assert.equal(storage.records.size, 1);
  assert.equal(storage.records.get(original.id)?.idempotencyKey, original.idempotencyKey);
  assert.deepEqual(storage.records.get(original.id)?.payload, original.payload);
});

test('same durable mutation id and idempotency key cannot change immutable payload or creation time', async () => {
  const storage = new MemoryPersistence();
  const service = new OfflineOutboxService(storage, [safe]);
  const original = await service.enqueue(request());

  await assert.rejects(
    () => service.enqueue({ ...request(original.id), payload: { complete: false } }),
    /mutation id conflicts/i,
  );
  await assert.rejects(
    () => service.enqueue({ ...request(original.id), createdAt: '2026-09-25T00:00:02.000Z' }),
    /mutation id conflicts/i,
  );

  assert.equal(storage.records.size, 1);
  assert.equal(storage.records.get(original.id)?.createdAt, original.createdAt);
  assert.deepEqual(storage.records.get(original.id)?.payload, original.payload);
});

test('idempotency conflict scope is isolated by tenant, domain and operation', async () => {
  const storage = new MemoryPersistence();
  const otherOperation = { ...safe, operation: 'replace' };
  const service = new OfflineOutboxService(storage, [safe, otherOperation]);
  const original = await service.enqueue(request());

  const otherTenant = await service.enqueue({
    ...request('tenant-b', 'congregation-b'),
    idempotencyKey: original.idempotencyKey,
  });
  const otherOperationRecord = await service.enqueue({
    ...request('other-operation'),
    operation: 'replace',
    idempotencyKey: original.idempotencyKey,
  });

  assert.equal(otherTenant.id, 'tenant-b');
  assert.equal(otherOperationRecord.id, 'other-operation');
  assert.equal(storage.records.size, 3);
});

test('malformed durable rows do not create false idempotency conflicts', async () => {
  const storage = new MemoryPersistence();
  storage.records.set('broken', {
    id: 'broken',
    schemaVersion: 1,
    domain: safe.domain,
    operation: safe.operation,
    idempotencyKey: 'progress:user-1:mutation-1',
    identity: activeA,
    createdAt: 'not-an-iso-date',
    attempt: 0,
    payload: null,
    retryAt: null,
  } as unknown as PersistedOfflineMutation);

  const service = new OfflineOutboxService(storage, [safe]);
  const queued = await service.enqueue(request());
  assert.equal(queued.id, 'mutation-1');
  assert.equal(storage.records.has('mutation-1'), true);
});


test('production V6 outbox factory fails closed for uncertified and privileged domain writes', async () => {
  const storage = new MemoryPersistence();
  const service = createV6OfflineOutboxService(storage);

  await assert.rejects(
    () => service.enqueue({
      id: 'reader-1',
      domain: 'reader-progress',
      operation: 'record-read',
      idempotencyKey: 'reader:user-1:GEN:1',
      identity: activeA,
      createdAt: '2026-09-25T00:00:00.000Z',
      payload: { bookCode: 'GEN', chapter: 1 },
    }),
    /not explicitly allowlisted/i,
  );

  await assert.rejects(
    () => service.enqueue({
      id: 'admin-1',
      domain: 'admin-user',
      operation: 'suspend',
      idempotencyKey: 'admin:user-1:suspend:user-2',
      identity: activeA,
      createdAt: '2026-09-25T00:00:00.000Z',
      payload: { targetUserId: 'user-2' },
    }),
    /not explicitly allowlisted/i,
  );

  assert.equal(storage.records.size, 0);
});
