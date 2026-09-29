import assert from 'node:assert/strict';
import test from 'node:test';

import { createAvatarVaultService } from '../../src/app/avatar-vault.js';

function createHarness({
  activeCongregationId = 'congregation-a',
  save = async () => ({ selected_style: 'starter' })
}: {
  activeCongregationId?: string;
  save?: (...args: string[]) => Promise<unknown>;
} = {}) {
  const sessionState = { authenticated: true, user: { id: 'user-a' } };
  const memory = new Map<string, unknown>();
  let active = activeCongregationId;

  const vault = createAvatarVaultService({
    session: { getState: () => sessionState },
    privateStorage: {
      read: (key: string, fallback: unknown) => memory.has(key) ? memory.get(key) : fallback,
      write: (key: string, value: unknown) => { memory.set(key, value); }
    },
    api: {
      avatarVault: {
        load: async () => null,
        save
      }
    },
    congregation: {
      getActive: () => active ? { congregationId: active } : null
    }
  });

  return {
    vault,
    setActiveCongregationId(value: string) { active = value; }
  };
}

test('Avatar Vault sends the active congregation with authenticated membership writes', async () => {
  const calls: string[][] = [];
  const { vault } = createHarness({
    save: async (...args: string[]) => {
      calls.push(args);
      return { selected_style: 'starter' };
    }
  });

  const state = await vault.select('starter');

  assert.equal(state.synced, true);
  assert.deepEqual(calls, [['user-a', 'congregation-a', 'starter']]);
});

test('Avatar Vault keeps authenticated selection pending when there is no active congregation', async () => {
  let saveCalls = 0;
  const { vault } = createHarness({
    activeCongregationId: '',
    save: async () => {
      saveCalls += 1;
      return null;
    }
  });

  const state = await vault.select('starter');

  assert.equal(state.synced, false);
  assert.equal(saveCalls, 0);
});

test('Avatar Vault rejects a cloud result after the active congregation changes', async () => {
  let releaseSave!: () => void;
  let markStarted!: () => void;
  const started = new Promise<void>(resolve => { markStarted = resolve; });
  const blockedSave = new Promise<void>(resolve => { releaseSave = resolve; });
  const { vault, setActiveCongregationId } = createHarness({
    save: async () => {
      markStarted();
      await blockedSave;
      return { selected_style: 'starter' };
    }
  });

  const selection = vault.select('starter');
  await started;
  setActiveCongregationId('congregation-b');
  releaseSave();

  await assert.rejects(selection, (error: unknown) => {
    return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'BQ_AVATAR_VAULT_CONTEXT_STALE');
  });
});
