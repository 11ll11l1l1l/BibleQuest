import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createProgressCloudSyncService } from '../../src/app/progress-cloud-sync.js';
import { createBibleQuestCloudSyncService } from '../../src/app/bible-quest-cloud-sync.js';
import { createWeeklyJourneyCloudSyncService } from '../../src/app/weekly-journey-cloud-sync.js';
import { createPersonalChallengesCloudSyncService } from '../../src/app/personal-challenges-cloud-sync.js';
import { createExplorerCloudSyncService } from '../../src/app/explorer-cloud-sync.js';
import { createProgressLeaderboardBridgeService } from '../../src/app/progress-leaderboard-bridge.js';

const sliceKeys = [
  'biblequest_global_progress_v1',
  'biblequest_main_bible_quest_v1',
  'biblequest_weekly_journey_v1',
  'biblequest_personal_challenges_v1',
  'biblequest_explorer_v1',
] as const;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function memoryStorage() {
  const map = new Map<string, unknown>();
  return {
    read(key: string, fallback: unknown = null) {
      return map.has(key) ? clone(map.get(key)) : clone(fallback);
    },
    write(key: string, value: unknown) {
      map.set(key, clone(value));
      return value;
    },
    inspect(key: string) {
      return clone(map.get(key));
    },
  };
}

function ownerStorage() {
  const map = new Map<string, string>();
  return {
    getItem(key: string) { return map.has(key) ? map.get(key)! : null; },
    setItem(key: string, value: unknown) { map.set(key, String(value)); return value; },
    removeItem(key: string) { map.delete(key); },
  };
}

function mutableSession(initial = 'user-a') {
  let userId = initial;
  const signOutListeners = new Set<() => unknown>();
  return {
    getState() {
      return userId
        ? { authenticated: true, remoteAvailable: true, user: { id: userId } }
        : { authenticated: false, remoteAvailable: true, user: null };
    },
    beforeSignOut(listener: () => unknown) {
      signOutListeners.add(listener);
      return () => signOutListeners.delete(listener);
    },
    setUser(next: string) { userId = next; },
  };
}

function accountModel() {
  let value: unknown = { marker: 'local-a' };
  let merges = 0;
  return {
    exportAccountState() { return clone(value); },
    replaceAccountState(next: unknown) { value = next == null ? null : clone(next); },
    mergeFromAccount(next: unknown) { merges += 1; value = clone(next); return { winner: 'remote' }; },
    subscribe() { return () => undefined; },
    inspect() { return clone(value); },
    mergeCount() { return merges; },
  };
}

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function row(marker: string) {
  return {
    state: Object.fromEntries(sliceKeys.map((key) => [key, { marker }])),
    updated_at: `2026-09-24T00:00:00.000Z`,
  };
}

const factories = [
  {
    name: 'progress',
    create: (deps: any) => createProgressCloudSyncService({ ...deps, progress: deps.model }),
  },
  {
    name: 'bible-quest',
    create: (deps: any) => createBibleQuestCloudSyncService({ ...deps, bibleQuest: deps.model }),
  },
  {
    name: 'weekly-journey',
    create: (deps: any) => createWeeklyJourneyCloudSyncService({ ...deps, weeklyJourney: deps.model }),
  },
  {
    name: 'personal-challenges',
    create: (deps: any) => createPersonalChallengesCloudSyncService({ ...deps, challenges: deps.model }),
  },
  {
    name: 'explorer',
    create: (deps: any) => createExplorerCloudSyncService({ ...deps, explorer: deps.model }),
  },
] as const;

describe('account cloud sync stale-response isolation', () => {
  for (const factory of factories) {
    it(`${factory.name} ignores an Account A load that resolves after switching to Account B`, async () => {
      const session = mutableSession();
      const model = accountModel();
      const loadStarted = deferred();
      const releaseLoad = deferred();
      const saves: string[] = [];
      const api = {
        async load(userId: string) {
          if (userId === 'user-a') {
            loadStarted.resolve();
            await releaseLoad.promise;
            return row('remote-a');
          }
          return row('remote-b');
        },
        async saveSlice(userId: string) {
          saves.push(userId);
          return row(userId === 'user-a' ? 'remote-a' : 'remote-b');
        },
      };
      const service = factory.create({
        api,
        session,
        model,
        ownerStorage: ownerStorage(),
        cacheStorage: memoryStorage(),
      });

      const first = service.syncNow();
      await loadStarted.promise;
      session.setUser('user-b');
      service.switchToGuest();
      releaseLoad.resolve();
      await first;

      assert.equal(model.inspect(), null);
      assert.equal(model.mergeCount(), 0);
      assert.deepEqual(saves, []);

      await service.syncNow();
      assert.deepEqual(model.inspect(), { marker: 'remote-b' });
      assert.equal(model.mergeCount(), 1);
      service.dispose();
    });

    it(`${factory.name} does not republish/cache Account A after its save finishes under Account B`, async () => {
      const session = mutableSession();
      const model = accountModel();
      const saveStarted = deferred();
      const releaseSave = deferred();
      const api = {
        async load(userId: string) {
          return userId === 'user-a' ? { state: {}, updated_at: 'a0' } : row('remote-b');
        },
        async saveSlice(userId: string) {
          if (userId === 'user-a') {
            saveStarted.resolve();
            await releaseSave.promise;
          }
          return row(userId === 'user-a' ? 'remote-a' : 'remote-b');
        },
      };
      const service = factory.create({
        api,
        session,
        model,
        ownerStorage: ownerStorage(),
        cacheStorage: memoryStorage(),
      });

      const first = service.syncNow();
      await saveStarted.promise;
      session.setUser('user-b');
      service.switchToGuest();
      releaseSave.resolve();
      await first;

      assert.equal(model.inspect(), null);
      assert.equal(service.getState().userId, '');

      await service.syncNow();
      assert.deepEqual(model.inspect(), { marker: 'remote-b' });
      assert.equal(service.getState().userId, 'user-b');
      service.dispose();
    });
  }

  it('leaderboard delivery stops before submitting Account A queue after switching to Account B', async () => {
    const session = mutableSession();
    const loadStarted = deferred();
    const releaseLoad = deferred();
    const ledgerKey = 'user-a:cong-a:reading.chapter:GEN:1';
    const storage = memoryStorage();
    storage.write('progress-leaderboard-delivery-v1', {
      version: 1,
      pending: {
        [ledgerKey]: {
          userId: 'user-a',
          congregationId: 'cong-a',
          claim: {
            sourceEventId: 'reading.chapter:GEN:1',
            source: 'Bible Chapter Read',
            category: 'reading',
            meta: { code: 'GEN', chapter: 1 },
          },
          queuedAt: '2026-09-24T00:00:00.000Z',
        },
      },
      settled: {},
    });
    let submitCalls = 0;
    const bridge = createProgressLeaderboardBridgeService({
      progress: {
        getState: () => ({ events: {} }),
        subscribe: () => () => undefined,
      },
      scoreEvents: {
        async submit() { submitCalls += 1; return { processed: [] }; },
      },
      session,
      congregation: {
        async load() {
          loadStarted.resolve();
          await releaseLoad.promise;
          return [];
        },
        getActive: () => ({ congregationId: 'cong-a' }),
        can: () => true,
      },
      storage,
    });

    const pending = bridge.syncNow();
    await loadStarted.promise;
    session.setUser('user-b');
    bridge.switchToGuest();
    releaseLoad.resolve();
    await pending;

    assert.equal(submitCalls, 0);
    assert.equal(bridge.getState().state, 'idle');
    bridge.dispose();
  });
});
