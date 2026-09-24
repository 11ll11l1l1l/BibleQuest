import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createSessionService } from '../../src/app/session.js';

function deferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function user(id: string) {
  return { id, email: `${id}@example.test`, user_metadata: { preferred_name: id } };
}

function authSession(id: string) {
  return { user: user(id), expires_at: 4102444800 };
}

function store() {
  let state: any = {};
  return {
    setState(patch: any) {
      state = typeof patch === 'function' ? patch(state) : { ...state, ...patch };
      return state;
    },
    snapshot() { return state; },
  };
}

describe('legacy Session operation sequencing', () => {
  it('does not let an older sign-in overwrite a newer account', async () => {
    const aStarted = deferred();
    const releaseA = deferred();
    let current = user('user-b');
    const auth = {
      enabled: () => true,
      async signIn(email: string) {
        if (email.startsWith('a@')) {
          aStarted.resolve();
          await releaseA.promise;
          return { session: authSession('user-a') };
        }
        current = user('user-b');
        return { session: authSession('user-b') };
      },
      async getUser() { return { user: current }; },
    };
    const service = createSessionService({ auth, store: store() });

    const older = service.signIn('a@example.test', 'password');
    await aStarted.promise;
    const newer = await service.signIn('b@example.test', 'password');
    assert.equal(newer.user?.id, 'user-b');

    releaseA.resolve();
    await assert.rejects(() => older, (error: any) => error?.code === 'BQ_SESSION_CONTEXT_STALE');
    assert.equal(service.getState().user?.id, 'user-b');
    assert.equal(service.getState().authenticated, true);
  });

  it('does not let a late sign-in re-authenticate after a newer sign-out', async () => {
    const started = deferred();
    const release = deferred();
    let signOutCalls = 0;
    const auth = {
      enabled: () => true,
      async signIn() {
        started.resolve();
        await release.promise;
        return { session: authSession('user-a') };
      },
      async getUser() { return { user: user('user-a') }; },
      async signOut() { signOutCalls += 1; },
    };
    const service = createSessionService({ auth, store: store() });

    const pending = service.signIn('a@example.test', 'password');
    await started.promise;
    const signedOut = await service.signOut();
    assert.equal(signedOut.authenticated, false);
    assert.equal(signOutCalls, 1);

    release.resolve();
    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_SESSION_CONTEXT_STALE');
    assert.equal(service.getState().authenticated, false);
    assert.equal(service.getState().user, null);
  });

  it('does not let a late boot restore Account A after Account B signed in', async () => {
    const sessionStarted = deferred();
    const releaseSession = deferred();
    let current = user('user-b');
    const auth = {
      enabled: () => true,
      async subscribe() { return () => undefined; },
      async getSession() {
        sessionStarted.resolve();
        await releaseSession.promise;
        return { session: authSession('user-a') };
      },
      async getUser() { return { user: current }; },
      async signIn() {
        current = user('user-b');
        return { session: authSession('user-b') };
      },
      async signOut() {},
    };
    const service = createSessionService({ auth, store: store() });

    const booting = service.boot();
    await sessionStarted.promise;
    await service.signIn('b@example.test', 'password');
    releaseSession.resolve();

    const bootResult = await booting;
    assert.equal(bootResult.user?.id, 'user-b');
    assert.equal(service.getState().user?.id, 'user-b');
  });

  it('does not publish a password-change result after a newer account sign-in', async () => {
    const verifyStarted = deferred();
    const releaseVerify = deferred();
    let current = user('user-a');
    const auth = {
      enabled: () => true,
      async signIn(email: string) {
        current = email.startsWith('b@') ? user('user-b') : user('user-a');
        return { session: authSession(current.id) };
      },
      async getUser() { return { user: current }; },
      async verifyPassword() {
        verifyStarted.resolve();
        await releaseVerify.promise;
        return { session: authSession('user-a') };
      },
      async updatePassword() { return { user: user('user-a') }; },
      async getSession() { return { session: authSession(current.id) }; },
    };
    const service = createSessionService({ auth, store: store() });
    await service.signIn('a@example.test', 'password');

    const changing = service.changePassword('old-password', 'new-password', 'new-password');
    await verifyStarted.promise;
    await service.signIn('b@example.test', 'password');
    releaseVerify.resolve();

    await assert.rejects(() => changing, (error: any) => error?.code === 'BQ_SESSION_CONTEXT_STALE');
    assert.equal(service.getState().user?.id, 'user-b');
    assert.equal(service.getState().error, '');
  });

  it('allows the auth event emitted by the same sign-in to confirm that identity', async () => {
    let listener: ((event: string, session: any) => void) | null = null;
    let current: any = null;
    const auth = {
      enabled: () => true,
      async subscribe(fn: (event: string, session: any) => void) {
        listener = fn;
        return () => { listener = null; };
      },
      async getSession() { return { session: null }; },
      async getUser() { return { user: current }; },
      async signIn() {
        current = user('user-a');
        const session = authSession('user-a');
        listener?.('SIGNED_IN', session);
        return { session };
      },
    };
    const service = createSessionService({ auth, store: store() });
    await service.boot();

    const signed = await service.signIn('a@example.test', 'password');
    assert.equal(signed.user?.id, 'user-a');
    assert.equal(signed.authenticated, true);
  });

  it('abandons an older sign-out before calling auth.signOut when a newer sign-in wins during cleanup', async () => {
    const cleanupStarted = deferred();
    const releaseCleanup = deferred();
    let current = user('user-a');
    let signOutCalls = 0;
    const auth = {
      enabled: () => true,
      async signIn(email: string) {
        current = email.startsWith('b@') ? user('user-b') : user('user-a');
        return { session: authSession(current.id) };
      },
      async getUser() { return { user: current }; },
      async signOut() { signOutCalls += 1; },
    };
    const service = createSessionService({ auth, store: store() });
    await service.signIn('a@example.test', 'password');
    service.beforeSignOut(async () => {
      cleanupStarted.resolve();
      await releaseCleanup.promise;
    });

    const signingOut = service.signOut();
    await cleanupStarted.promise;
    await service.signIn('b@example.test', 'password');
    releaseCleanup.resolve();

    const result = await signingOut;
    assert.equal(result.user?.id, 'user-b');
    assert.equal(signOutCalls, 0);
    assert.equal(service.getState().user?.id, 'user-b');
  });
});


describe('legacy Session stale auth callbacks', () => {
  it('ignores a stale SIGNED_IN callback from an older overlapping sign-in', async () => {
    let listener: ((event: string, session: any) => void) | null = null;
    const aStarted = deferred();
    const releaseA = deferred();
    let current: any = null;
    const auth = {
      enabled: () => true,
      async subscribe(fn: (event: string, session: any) => void) {
        listener = fn;
        return () => { listener = null; };
      },
      async getSession() { return { session: null }; },
      async getUser() { return { user: current }; },
      async signIn(email: string) {
        if (email.startsWith('user-a@')) {
          aStarted.resolve();
          await releaseA.promise;
          const session = authSession('user-a');
          listener?.('SIGNED_IN', session);
          return { session };
        }
        current = user('user-b');
        const session = authSession('user-b');
        listener?.('SIGNED_IN', session);
        return { session };
      },
    };
    const service = createSessionService({ auth, store: store() });
    await service.boot();

    const older = service.signIn('user-a@example.test', 'password');
    await aStarted.promise;
    await service.signIn('user-b@example.test', 'password');
    assert.equal(service.getState().user?.id, 'user-b');

    releaseA.resolve();
    await assert.rejects(() => older, (error: any) => error?.code === 'BQ_SESSION_CONTEXT_STALE');
    assert.equal(service.getState().user?.id, 'user-b');
  });

  it('ignores a stale SIGNED_OUT callback from an older sign-out after a newer sign-in', async () => {
    let listener: ((event: string, session: any) => void) | null = null;
    const signOutStarted = deferred();
    const releaseSignOut = deferred();
    let current: any = user('user-a');
    const auth = {
      enabled: () => true,
      async subscribe(fn: (event: string, session: any) => void) {
        listener = fn;
        return () => { listener = null; };
      },
      async getSession() { return { session: authSession(current.id) }; },
      async getUser() { return { user: current }; },
      async signIn() {
        current = user('user-b');
        const session = authSession('user-b');
        listener?.('SIGNED_IN', session);
        return { session };
      },
      async signOut() {
        signOutStarted.resolve();
        await releaseSignOut.promise;
        listener?.('SIGNED_OUT', null);
      },
    };
    const service = createSessionService({ auth, store: store() });
    await service.boot();
    assert.equal(service.getState().user?.id, 'user-a');

    const olderSignOut = service.signOut();
    await signOutStarted.promise;
    await service.signIn('b@example.test', 'password');
    assert.equal(service.getState().user?.id, 'user-b');

    releaseSignOut.resolve();
    const result = await olderSignOut;
    assert.equal(result.user?.id, 'user-b');
    assert.equal(service.getState().user?.id, 'user-b');
    assert.equal(service.getState().authenticated, true);
  });

  it('ignores a stale USER_UPDATED callback from Account A after Account B wins', async () => {
    let listener: ((event: string, session: any) => void) | null = null;
    const updateStarted = deferred();
    const releaseUpdate = deferred();
    let current: any = user('user-a');
    const auth = {
      enabled: () => true,
      async subscribe(fn: (event: string, session: any) => void) {
        listener = fn;
        return () => { listener = null; };
      },
      async getSession() { return { session: authSession(current.id) }; },
      async getUser() { return { user: current }; },
      async signIn() {
        current = user('user-b');
        const session = authSession('user-b');
        listener?.('SIGNED_IN', session);
        return { session };
      },
      async verifyPassword() { return { session: authSession('user-a') }; },
      async updatePassword() {
        updateStarted.resolve();
        await releaseUpdate.promise;
        listener?.('USER_UPDATED', authSession('user-a'));
        return { user: user('user-a') };
      },
    };
    const service = createSessionService({ auth, store: store() });
    await service.boot();

    const changing = service.changePassword('old-password', 'new-password', 'new-password');
    await updateStarted.promise;
    await service.signIn('b@example.test', 'password');
    releaseUpdate.resolve();

    await assert.rejects(() => changing, (error: any) => error?.code === 'BQ_SESSION_CONTEXT_STALE');
    assert.equal(service.getState().user?.id, 'user-b');
    assert.equal(service.getState().authenticated, true);
  });
});
