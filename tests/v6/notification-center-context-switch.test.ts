import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createNotificationCenterService } from '../../src/app/notification-center.js';

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

function row(userId: string, id = `notification-${userId}`, readAt: string | null = null) {
  return {
    id,
    user_id: userId,
    congregation_id: userId === 'user-a' ? 'cong-a' : 'cong-b',
    created_by: 'leader',
    notification_type: 'assignment',
    title: `Inbox ${userId}`,
    body: `Private notification for ${userId}`,
    action_kind: 'assignment',
    action_payload: { assignment_id: `assignment-${userId}` },
    created_at: '2026-09-24T00:00:00.000Z',
    read_at: readAt,
    expires_at: '2099-01-01T00:00:00.000Z',
  };
}

describe('Notification Center account-context isolation', () => {
  it('hides Account A immediately and ignores its late load after Account B becomes current', async () => {
    const session = mutableSession();
    const aStarted = deferred();
    const releaseA = deferred();
    const api = {
      async list(userId: string) {
        if (userId === 'user-a') {
          aStarted.resolve();
          await releaseA.promise;
        }
        return [row(userId)];
      },
      async setReadState() { throw new Error('unused'); },
      async markAllRead() { throw new Error('unused'); },
    };
    const inbox = createNotificationCenterService({ api, session });

    const stale = inbox.load();
    await aStarted.promise;
    session.setUser('user-b');

    const switched = inbox.snapshot();
    assert.equal(switched.userId, 'user-b');
    assert.equal(switched.status, 'idle');
    assert.deepEqual(switched.items, []);
    assert.equal(switched.unread, 0);

    const fresh = await inbox.load();
    assert.equal(fresh.status, 'ready');
    assert.equal(fresh.userId, 'user-b');
    assert.deepEqual(fresh.items.map((item: any) => item.userId), ['user-b']);

    releaseA.resolve();
    await stale;
    const final = inbox.snapshot();
    assert.equal(final.userId, 'user-b');
    assert.deepEqual(final.items.map((item: any) => item.userId), ['user-b']);
  });

  it('does not commit a read-state response after the authenticated account changes', async () => {
    const session = mutableSession();
    const saveStarted = deferred();
    const releaseSave = deferred();
    let setCalls = 0;
    const api = {
      async list(userId: string) { return [row(userId)]; },
      async setReadState(userId: string, id: string, readAt: string | null) {
        setCalls += 1;
        saveStarted.resolve();
        await releaseSave.promise;
        return row(userId, id, readAt);
      },
      async markAllRead() { throw new Error('unused'); },
    };
    const inbox = createNotificationCenterService({ api, session });
    await inbox.load();

    const pending = inbox.setRead('notification-user-a', true);
    await saveStarted.promise;
    session.setUser('user-b');
    assert.deepEqual(inbox.snapshot().items, []);

    releaseSave.resolve();
    await assert.rejects(pending, (error: any) => error?.code === 'BQ_NOTIFICATION_CONTEXT_STALE');
    assert.equal(setCalls, 1);
    assert.deepEqual(inbox.snapshot().items, []);

    await inbox.load();
    assert.deepEqual(inbox.snapshot().items.map((item: any) => item.userId), ['user-b']);
  });

  it('never returns an Account A route when opening an unread notification races with A→B', async () => {
    const session = mutableSession();
    const saveStarted = deferred();
    const releaseSave = deferred();
    const api = {
      async list(userId: string) { return [row(userId)]; },
      async setReadState(userId: string, id: string, readAt: string | null) {
        saveStarted.resolve();
        await releaseSave.promise;
        return row(userId, id, readAt);
      },
      async markAllRead() { return []; },
    };
    const inbox = createNotificationCenterService({ api, session });
    await inbox.load();

    const pendingRoute = inbox.openTarget('notification-user-a');
    await saveStarted.promise;
    session.setUser('user-b');
    releaseSave.resolve();

    await assert.rejects(pendingRoute, (error: any) => error?.code === 'BQ_NOTIFICATION_CONTEXT_STALE');
    assert.deepEqual(inbox.snapshot().items, []);
  });

  it('rejects cached Account A actions before crossing the API boundary under Account B', async () => {
    const session = mutableSession();
    let setCalls = 0;
    let markCalls = 0;
    const api = {
      async list(userId: string) { return [row(userId)]; },
      async setReadState() { setCalls += 1; return row('user-a', 'notification-user-a', '2026-09-24T01:00:00.000Z'); },
      async markAllRead() { markCalls += 1; return []; },
    };
    const inbox = createNotificationCenterService({ api, session });
    await inbox.load();
    session.setUser('user-b');

    await assert.rejects(
      () => inbox.setRead('notification-user-a', true),
      (error: any) => error?.code === 'BQ_NOTIFICATION_CONTEXT_STALE',
    );
    await assert.rejects(
      () => inbox.markAllRead(),
      (error: any) => error?.code === 'BQ_NOTIFICATION_CONTEXT_STALE',
    );
    await assert.rejects(
      () => inbox.openTarget('notification-user-a'),
      (error: any) => error?.code === 'BQ_NOTIFICATION_CONTEXT_STALE',
    );
    assert.equal(setCalls, 0);
    assert.equal(markCalls, 0);
  });
});
