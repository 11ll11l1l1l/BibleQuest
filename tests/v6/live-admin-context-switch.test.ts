import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createLiveRoomsService } from '../../src/app/live-rooms.js';
import { createAdminAccessService } from '../../src/app/admin-access.js';
import { createAdminConsoleService } from '../../src/app/admin-console.js';
import { createAdminOperationsService } from '../../src/app/admin-operations.js';

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

describe('Live Rooms and admin account-switch isolation', () => {
  it('Live Rooms hides the old room immediately and discards a late membership response', async () => {
    const session = mutableSession();
    const aStarted = deferred();
    const releaseA = deferred();
    const rows = (userId: string) => [{
      congregationId: userId === 'user-a' ? 'cong-a' : 'cong-b',
      role: userId === 'user-a' ? 'leader' : 'member',
      congregation: { name: userId === 'user-a' ? 'Church A' : 'Church B' },
    }];
    let membershipUser = 'user-a';
    const congregation = {
      async load() {
        const requested = membershipUser;
        if (requested === 'user-a') {
          aStarted.resolve();
          await releaseA.promise;
        }
        return rows(requested);
      },
      get(id: string) {
        return rows(session.getState().user?.id || '')[0]?.congregationId === id ? rows(session.getState().user?.id || '')[0] : null;
      },
      can(id: string, capability: string) {
        return capability === 'ministry' && id === 'cong-a' && session.getState().user?.id === 'user-a';
      },
      assert(id: string, capability: string) {
        if (!this.can(id, capability)) {
          const error = new Error('denied');
          (error as any).code = 'BQ_CONGREGATION_PERMISSION_DENIED';
          throw error;
        }
      },
    };
    const roomRow = {
      id: 'room-a',
      congregation_id: 'cong-a',
      created_by: 'user-a',
      session_type: 'live-room',
      title: 'A room',
      room_code: 'ABC234',
      status: 'lobby',
      state: {},
    };
    const api = {
      async create() { return roomRow; },
      async findByCode() { return roomRow; },
      async loadRoom() { return roomRow; },
      async joinParticipant() { return {}; },
      async participants() { return { participants: [], directory: [] }; },
      async subscribe() { return () => undefined; },
      async endRoom() { return roomRow; },
    };
    const rooms = createLiveRoomsService({ api, session, congregation, codeFactory: () => 'ABC234' });

    const stale = rooms.load();
    await aStarted.promise;
    session.setUser('user-b');
    membershipUser = 'user-b';
    const fresh = await rooms.load();
    assert.deepEqual(fresh.memberships.map((row: any) => row.congregationId), ['cong-b']);
    releaseA.resolve();
    await stale;
    assert.deepEqual(rooms.snapshot().memberships.map((row: any) => row.congregationId), ['cong-b']);

    session.setUser('user-a');
    membershipUser = 'user-a';
    releaseA.resolve();
    await rooms.load();
    await rooms.create({ congregationId: 'cong-a', title: 'A room' });
    assert.equal(rooms.snapshot().room?.id, 'room-a');

    session.setUser('user-b');
    assert.equal(rooms.snapshot().room, null);
    assert.deepEqual(rooms.snapshot().participants, []);
    assert.equal(rooms.snapshot().connected, false);
  });

  it('Admin Access never publishes Account A authorization after Account B becomes current', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const service = createAdminAccessService({
      session,
      api: {
        async status() {
          started.resolve();
          await release.promise;
          return { role: 'owner' };
        },
      },
    });

    const pending = service.refresh();
    await started.promise;
    session.setUser('user-b');
    assert.equal(service.getState().authorized, false);
    release.resolve();
    const result = await pending;
    assert.equal(result.authorized, false);
    assert.equal(service.getState().role, '');
  });

  it('Admin Console suppresses late Account A data and blocks cached A privileges under B', async () => {
    const session = mutableSession();
    const listStarted = deferred();
    const releaseList = deferred();
    let mutations = 0;
    const api = {
      async status() { return { role: 'owner' }; },
      async listUsers() {
        listStarted.resolve();
        await releaseList.promise;
        return { role: 'owner', users: [{ id: 'member-a', email: 'a@example.test', role: 'member' }], options: {} };
      },
      async setRole() { mutations++; return {}; },
      async setCongregation() { mutations++; return {}; },
      async removeCongregation() { mutations++; return {}; },
      async setCongregationRole() { mutations++; return {}; },
      async createCongregation() { mutations++; return {}; },
      async createSmallGroup() { mutations++; return {}; },
      async setGroupMembership() { mutations++; return {}; },
      async setGroupOwner() { mutations++; return {}; },
    };
    const consoleService = createAdminConsoleService({ api, session });
    const pending = consoleService.refresh();
    await listStarted.promise;
    session.setUser('user-b');
    assert.deepEqual(consoleService.getState().users, []);
    releaseList.resolve();
    const stale = await pending;
    assert.notEqual(stale.status, 'ready');
    assert.deepEqual(consoleService.getState().users, []);

    session.setUser('user-a');
    const immediateApi = { ...api, listUsers: async () => ({ role: 'owner', users: [], options: {} }) };
    const ready = createAdminConsoleService({ api: immediateApi, session });
    assert.equal((await ready.refresh()).status, 'ready');
    session.setUser('user-b');
    await assert.rejects(() => ready.setRole('member-a', 'admin'), (error: any) => error?.code === 'BQ_ADMIN_CONTEXT_STALE');
    assert.equal(mutations, 0);
  });

  it('Admin Operations hides stale dashboards and blocks privileged mutations after account switch', async () => {
    const session = mutableSession();
    const dashboardStarted = deferred();
    const releaseDashboard = deferred();
    let deletes = 0;
    const api = {
      async status() { return { role: 'owner', userId: session.getState().user?.id }; },
      async dashboard() {
        dashboardStarted.resolve();
        await releaseDashboard.promise;
        return { role: 'owner', online: [{ user_id: 'secret-a', display_name: 'A' }] };
      },
      async frontendHealth() { return { pwa: 'ok' }; },
      async deleteUser() { deletes++; return { deleted: true }; },
      async suspendAccount() { return { active: false }; },
      async reactivateAccount() { return { active: true }; },
      async forceSignOut() { return { revoked: true }; },
      async setTempPassword() { return { revoked: true }; },
      async changeEmail() { return { changed: true }; },
    };
    const operations = createAdminOperationsService({ api, session });
    const pending = operations.refresh();
    await dashboardStarted.promise;
    session.setUser('user-b');
    assert.deepEqual(operations.getState().dashboard.online, []);
    releaseDashboard.resolve();
    const stale = await pending;
    assert.notEqual(stale.status, 'ready');
    assert.deepEqual(operations.getState().dashboard.online, []);

    session.setUser('user-a');
    const readyApi = { ...api, dashboard: async () => ({ role: 'owner' }) };
    const ready = createAdminOperationsService({ api: readyApi, session });
    assert.equal((await ready.refresh()).status, 'ready');
    session.setUser('user-b');
    await assert.rejects(() => ready.deleteUser('member-a'), (error: any) => error?.code === 'BQ_ADMIN_OPS_CONTEXT_STALE');
    assert.equal(deletes, 0);
  });
});
