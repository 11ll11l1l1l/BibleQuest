import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createCalendarService } from '../../src/app/calendar.js';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function memoryStorage() {
  const map = new Map<string, unknown>();
  return {
    read(name: string, fallback: unknown = null) { return map.has(name) ? map.get(name) : fallback; },
    write(name: string, value: unknown) { map.set(name, value); return value; },
    remove(name: string) { map.delete(name); },
  };
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

function congregationStub() {
  return {
    async load() { return []; },
    getActive() { return null; },
    can() { return false; },
    assert() { throw new Error('unused'); },
  };
}

describe('Calendar account-context isolation', () => {
  it('stops Account A pending uploads after A→B and resumes them only when A is active again', async () => {
    const session = mutableSession();
    const storage = memoryStorage();
    let online = false;
    const rows: any[] = [];
    const calls: string[] = [];
    const firstStarted = deferred();
    const releaseFirst = deferred();
    let pauseFirstOnlineCreate = true;

    const api = {
      calendar: {
        async list(userId: string) { return rows.filter(row => row.user_id === userId); },
        async create(userId: string, event: any) {
          calls.push(`${userId}:${event.id}`);
          if (!online) throw new Error('offline');
          if (pauseFirstOnlineCreate) {
            pauseFirstOnlineCreate = false;
            firstStarted.resolve();
            await releaseFirst.promise;
          }
          let row = rows.find(item => item.id === event.id && item.user_id === userId);
          if (!row) {
            row = { id: event.id, user_id: userId, title: event.title, notes: event.notes, event_date: event.date, all_day: event.allDay };
            rows.push(row);
          }
          return { ...row };
        },
        async remove() { return true; },
        async listCongregation() { return []; },
      },
    };

    const calendar = createCalendarService({
      session,
      privateStorage: storage,
      api,
      assignments: { snapshot: () => ({ assignments: [] }) },
      congregation: congregationStub(),
      clock: () => new Date('2026-09-24T00:00:00.000Z'),
    });

    await calendar.load();
    const first = await calendar.addEvent({ title: 'A first', eventDate: '2026-09-25' });
    const second = await calendar.addEvent({ title: 'A second', eventDate: '2026-09-26' });
    assert.equal(first.synced, false);
    assert.equal(second.synced, false);
    assert.equal(calendar.getState().pendingSync, 2);

    calls.length = 0;
    online = true;
    const pendingLoad = calendar.load();
    await firstStarted.promise;
    session.setUser('user-b');
    releaseFirst.resolve();

    const switched = await pendingLoad;
    assert.equal(switched.owner, 'account:user-b');
    assert.equal(switched.accountUserId, 'user-b');
    assert.deepEqual(switched.events, []);
    assert.equal(calls.length, 1, 'Account switch must stop later Account A queued writes.');

    session.setUser('user-a');
    const resumed = await calendar.load();
    assert.equal(resumed.owner, 'account:user-a');
    assert.equal(resumed.pendingSync, 0);
    assert.equal(rows.filter(row => row.user_id === 'user-a').length, 2);
    assert.ok(calls.every(call => call.startsWith('user-a:')), 'Queued work must never execute as the replacement account.');
  });

  it('does not clear Account A pending state when a direct save response arrives after switching to B', async () => {
    const session = mutableSession();
    const storage = memoryStorage();
    const started = deferred();
    const release = deferred();

    const api = {
      calendar: {
        async list() { return []; },
        async create(userId: string, event: any) {
          started.resolve();
          await release.promise;
          return { id: event.id, user_id: userId, title: event.title, notes: event.notes, event_date: event.date, all_day: event.allDay };
        },
        async remove() { return true; },
        async listCongregation() { return []; },
      },
    };

    const calendar = createCalendarService({
      session,
      privateStorage: storage,
      api,
      assignments: { snapshot: () => ({ assignments: [] }) },
      congregation: congregationStub(),
      clock: () => new Date('2026-09-24T00:00:00.000Z'),
    });

    const saving = calendar.addEvent({ title: 'Race-safe', eventDate: '2026-09-27' });
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    const visible = await saving;
    assert.equal(visible.owner, 'account:user-b');
    assert.equal(visible.accountUserId, 'user-b');
    assert.deepEqual(visible.events, []);
    assert.equal(visible.synced, false);

    session.setUser('user-a');
    const accountA = calendar.getState();
    assert.equal(accountA.pendingSync, 1, 'Account A must retain retry state after its late response is ignored.');
    assert.equal(accountA.events.length, 1);
  });

  it('suppresses a late congregation A response after the same account switches to congregation B', async () => {
    const session = mutableSession();
    const storage = memoryStorage();
    let activeId = 'congregation-a';
    const startedA = deferred();
    const releaseA = deferred<any[]>();
    const memberships = [
      { congregationId: 'congregation-a', congregation: { name: 'A' } },
      { congregationId: 'congregation-b', congregation: { name: 'B' } },
    ];
    const congregation = {
      async load() { return memberships; },
      getActive() { return memberships.find(row => row.congregationId === activeId); },
      can() { return true; },
      assert() {},
    };
    const api = {
      calendar: {
        async list() { return []; },
        async create() { throw new Error('unused'); },
        async remove() { return true; },
        async listCongregation(congregationId: string) {
          if (congregationId === 'congregation-a') {
            startedA.resolve();
            return releaseA.promise;
          }
          return [{ id: 'b-event', user_id: 'user-a', event_date: '2026-09-28', title: 'B event', notes: '', all_day: true }];
        },
      },
    };
    const calendar = createCalendarService({
      session,
      privateStorage: storage,
      api,
      assignments: { snapshot: () => ({ assignments: [] }) },
      congregation,
      clock: () => new Date('2026-09-24T00:00:00.000Z'),
    });

    const loadingA = calendar.load();
    await startedA.promise;
    activeId = 'congregation-b';
    releaseA.resolve([{ id: 'a-event', user_id: 'user-a', event_date: '2026-09-27', title: 'A event', notes: '', all_day: true }]);

    const staleResult = await loadingA;
    assert.equal(staleResult.congregationId, '', 'Late congregation A data must not remain visible after switching to B.');
    assert.ok(!staleResult.agenda.some((group: any) => group.events.some((row: any) => row.title === 'A event')));

    const refreshed = await calendar.load();
    assert.equal(refreshed.congregationId, 'congregation-b');
    assert.ok(refreshed.agenda.some((group: any) => group.events.some((row: any) => row.title === 'B event')));
    assert.ok(!refreshed.agenda.some((group: any) => group.events.some((row: any) => row.title === 'A event')));
  });
});
