import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCouplesCloudService } from '../../src/app/couples-cloud.js';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function mutableSession(initial = 'user-a') {
  let userId = initial;
  return {
    getState() {
      return userId
        ? { authenticated: true, remoteAvailable: true, user: { id: userId } }
        : { authenticated: false, remoteAvailable: true, user: null };
    },
    setUser(next: string) { userId = next; },
  };
}

const now = '2026-09-24T00:00:00.000Z';
const pairFor = (userId: string, id = `pair-${userId}`) => ({
  id,
  user_a: userId,
  user_b: 'partner',
  status: 'active',
  created_at: now,
  updated_at: now,
});

describe('Couples Cloud account-switch isolation', () => {
  it('rejects a late Account A status response and does not expose its pair to B', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const service = createCouplesCloudService({
      session,
      api: {
        async status() {
          started.resolve();
          await release.promise;
          return { pair: pairFor('user-a') };
        },
        async listShared() { return []; },
      },
    });

    const pending = service.load();
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_COUPLES_CLOUD_CONTEXT_STALE');
    assert.equal(service.snapshot().pair, null);
    assert.deepEqual(service.snapshot().shared, []);
  });

  it('hides an already-loaded Account A pair immediately after switching to B', async () => {
    const session = mutableSession();
    const service = createCouplesCloudService({
      session,
      api: {
        async status() { return { pair: pairFor('user-a') }; },
        async listShared() {
          return [{
            id: 'shared-a',
            pair_id: 'pair-user-a',
            author_id: 'partner',
            item_type: 'journey',
            body: '1|Pray',
            created_at: now,
            updated_at: now,
          }];
        },
      },
    });

    assert.equal((await service.load()).pair?.id, 'pair-user-a');
    assert.equal(service.snapshot().shared.length, 1);

    session.setUser('user-b');
    assert.equal(service.snapshot().pair, null);
    assert.deepEqual(service.snapshot().shared, []);
    assert.equal(service.snapshot().inviteCode, '');
  });

  it('does not publish a late Account A pair-code creation into Account B', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const service = createCouplesCloudService({
      session,
      api: {
        async create() {
          started.resolve();
          await release.promise;
          return {
            pair: {
              id: 'pair-pending-a',
              user_a: 'user-a',
              user_b: null,
              status: 'pending',
              created_at: now,
              updated_at: now,
            },
            inviteCode: 'ABCD2345',
          };
        },
      },
    });

    const pending = service.createPair();
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_COUPLES_CLOUD_CONTEXT_STALE');
    assert.equal(service.snapshot().pair, null);
    assert.equal(service.snapshot().inviteCode, '');
  });

  it('clears Account A pair authority before a B mutation can write shared rows', async () => {
    const session = mutableSession();
    let writes = 0;
    const service = createCouplesCloudService({
      session,
      api: {
        async status() { return { pair: pairFor('user-a') }; },
        async listShared() { return []; },
        async addShared() { writes++; return []; },
      },
    });
    await service.load();

    session.setUser('user-b');
    await assert.rejects(
      () => service.completeJourney(2, 'Listen First', ''),
      (error: any) => error?.code === 'BQ_COUPLES_CLOUD_PAIR_REQUIRED',
    );
    assert.equal(writes, 0);
    assert.equal(service.snapshot().pair, null);
  });
});
