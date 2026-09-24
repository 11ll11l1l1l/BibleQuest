import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAvatarVaultService } from '../../src/app/avatar-vault.js';

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
        ? { authenticated: true, user: { id: userId } }
        : { authenticated: false, user: null };
    },
    setUser(next: string) { userId = next; },
  };
}

function fakeStorage() {
  const map = new Map<string, unknown>();
  return {
    read(key: string, fallback: unknown = null) { return map.has(key) ? map.get(key) : fallback; },
    write(key: string, value: unknown) { map.set(key, value); return value; },
    remove(key: string) { map.delete(key); },
  };
}

const richProgress = { getState: () => ({ xp: 3000, streak: 40 }) };

describe('Avatar Vault account-switch isolation', () => {
  it('does not apply a late Account A cloud selection after switching to B', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const vault = createAvatarVaultService({
      session,
      privateStorage: fakeStorage(),
      progress: richProgress,
      api: {
        avatarVault: {
          async load(userId: string) {
            assert.equal(userId, 'user-a');
            started.resolve();
            await release.promise;
            return { selected_style: 'crown' };
          },
          async save() {},
        },
      },
    });

    const pending = vault.load();
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_AVATAR_VAULT_CONTEXT_STALE');
    assert.equal(vault.getState().owner, 'account:user-b');
    assert.equal(vault.getState().selected.id, 'starter');
  });

  it('keeps Account A selection pending instead of clearing it under Account B', async () => {
    const session = mutableSession();
    const started = deferred();
    const release = deferred();
    const vault = createAvatarVaultService({
      session,
      privateStorage: fakeStorage(),
      progress: richProgress,
      api: {
        avatarVault: {
          async load() { return null; },
          async save(userId: string, styleId: string) {
            assert.equal(userId, 'user-a');
            assert.equal(styleId, 'crown');
            started.resolve();
            await release.promise;
          },
        },
      },
    });

    const pending = vault.select('crown');
    await started.promise;
    session.setUser('user-b');
    release.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_AVATAR_VAULT_CONTEXT_STALE');
    assert.equal(vault.getState().selected.id, 'starter');

    session.setUser('user-a');
    const accountA = vault.getState();
    assert.equal(accountA.selected.id, 'crown');
    assert.equal(accountA.synced, false);
  });

  it('stops a pending Account A retry before starting a later cloud read after switching to B', async () => {
    const session = mutableSession();
    const storage = fakeStorage();
    const retryStarted = deferred();
    const releaseRetry = deferred();
    let failSave = false;
    let holdRetry = false;
    let loadCalls = 0;
    const vault = createAvatarVaultService({
      session,
      privateStorage: storage,
      progress: richProgress,
      api: {
        avatarVault: {
          async load() { loadCalls++; return null; },
          async save() {
            if (failSave) throw new Error('offline');
            if (holdRetry) {
              retryStarted.resolve();
              await releaseRetry.promise;
            }
          },
        },
      },
    });

    await vault.load();
    failSave = true;
    const localChoice = await vault.select('crown');
    assert.equal(localChoice.synced, false);
    failSave = false;
    holdRetry = true;
    loadCalls = 0;

    const pending = vault.load();
    await retryStarted.promise;
    session.setUser('user-b');
    releaseRetry.resolve();

    await assert.rejects(() => pending, (error: any) => error?.code === 'BQ_AVATAR_VAULT_CONTEXT_STALE');
    assert.equal(loadCalls, 0, 'A second Account A cloud read must not start after the session changed.');
  });
});
