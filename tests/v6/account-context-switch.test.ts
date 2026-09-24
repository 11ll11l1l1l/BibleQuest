import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAccountService } from '../../src/app/account.js';

const DEVICE_ID = '11111111-1111-4111-8111-111111111111';

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
        ? { authenticated: true, user: { id: userId, email: `${userId}@example.test` } }
        : { authenticated: false, user: null };
    },
    setUser(next: string) { userId = next; },
    async signIn() {
      return { authenticated: true, user: this.getState().user };
    },
    async changePassword() { return { ok: true }; },
  };
}

function storage() {
  const values = new Map<string, unknown>();
  return {
    read(key: string, fallback: unknown = null) { return values.has(key) ? values.get(key) : fallback; },
    write(key: string, value: unknown) { values.set(key, value); return value; },
    remove(key: string) { values.delete(key); },
  };
}

describe('Account account-switch isolation', () => {
  it('does not expose Account A devices after Account B becomes current', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const account = createAccountService({
      session,
      storage: storage(),
      uuid: () => DEVICE_ID,
      userAgent: () => 'Test Browser',
      api: {
        account: {
          async listDevices(userId: string) {
            assert.equal(userId, 'user-a');
            started.resolve();
            await release.promise;
            return [{ id: 'device-a', device_key: '22222222-2222-4222-8222-222222222222' }];
          },
        },
      },
    });

    const pending = account.listDevices();
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_ACCOUNT_CONTEXT_STALE');
  });

  it('does not delete a device when the account switches while resolving the target', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    let deletes = 0;
    const account = createAccountService({
      session,
      storage: storage(),
      uuid: () => DEVICE_ID,
      userAgent: () => 'Test Browser',
      api: {
        account: {
          async listDevices() {
            started.resolve();
            await release.promise;
            return [{ id: 'device-a', device_key: '22222222-2222-4222-8222-222222222222' }];
          },
          async removeDevice() {
            deletes++;
            return { ok: true };
          },
        },
      },
    });

    const pending = account.removeDevice('device-a');
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_ACCOUNT_CONTEXT_STALE');
    assert.equal(deletes, 0);
  });

  it('does not expose a recovery code issued to the previous account', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const account = createAccountService({
      session,
      storage: storage(),
      uuid: () => DEVICE_ID,
      userAgent: () => 'Test Browser',
      api: {
        account: {
          async issueRecoveryCode() {
            started.resolve();
            await release.promise;
            return { recovery_code: 'BQ-A111-A222-A333-A444' };
          },
        },
      },
    });

    const pending = account.issueRecoveryCode();
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_ACCOUNT_CONTEXT_STALE');
  });

  it('does not treat a stale device registration as a successful current-account registration', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const account = createAccountService({
      session,
      storage: storage(),
      uuid: () => DEVICE_ID,
      userAgent: () => 'Android Test',
      api: {
        account: {
          async upsertDevice(row: any) {
            assert.equal(row.user_id, 'user-a');
            started.resolve();
            await release.promise;
            return { id: 'device-a', ...row };
          },
        },
      },
    });

    const pending = account.ensureCurrentDevice();
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_ACCOUNT_CONTEXT_STALE');
  });
});
