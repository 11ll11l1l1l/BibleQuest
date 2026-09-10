import assert from 'node:assert/strict';
import { STYLES, findStyle, unlockedIds, isUnlocked, progressFor, normalizeMetrics, iconFor } from '../src/engines/avatar-vault.js';
import { createAvatarVaultService } from '../src/app/avatar-vault.js';

// --- engine: catalog parity ---
assert.equal(STYLES.length, 15, 'Avatar Vault must retain all 15 legacy styles for catalog parity.');
assert.equal(STYLES.filter(s => s.available).length, 5, 'Exactly 5 styles are sourceable from v3 Progress in v1.');
assert.equal(STYLES.filter(s => !s.available).length, 10, '10 legacy styles must be explicitly deferred, not silently dropped.');
for (const style of STYLES.filter(s => !s.available)) assert.ok(style.needsOwner, `Deferred style ${style.id} must record which owner it needs.`);
assert.equal(findStyle('nope').id, 'starter', 'Unknown style id must fall back to starter.');

// --- engine: unlock thresholds, exact boundaries ---
assert.ok(isUnlocked('starter', { xp: 0, streak: 0 }), 'starter must always be unlocked.');
assert.ok(!isUnlocked('sakura', { xp: 0, streak: 6 }), 'sakura must not unlock one day early.');
assert.ok(isUnlocked('sakura', { xp: 0, streak: 7 }), 'sakura must unlock exactly at 7-day streak.');
assert.ok(!isUnlocked('lantern', { xp: 499, streak: 0 }), 'lantern must not unlock one XP early.');
assert.ok(isUnlocked('lantern', { xp: 500, streak: 0 }), 'lantern must unlock exactly at 500 XP.');
assert.ok(!isUnlocked('flame', { xp: 0, streak: 29 }), 'flame must not unlock one day early.');
assert.ok(isUnlocked('flame', { xp: 0, streak: 30 }), 'flame must unlock exactly at 30-day streak.');
assert.ok(isUnlocked('crown', { xp: 2500, streak: 0 }), 'crown must unlock exactly at 2500 XP.');

// --- engine: deferred styles never unlock regardless of metrics ---
const generousMetrics = { xp: 999999, streak: 999999, answered: 999999, correct: 999999, deck: 999999, couples: 999999, group: 999999, assignments: 999999, mastery: [100, 100, 100, 100, 100, 100, 100, 100] };
for (const style of STYLES.filter(s => !s.available)) {
  assert.ok(!isUnlocked(style.id, generousMetrics), `Deferred style ${style.id} must never unlock until its owner exists, regardless of metrics.`);
}

// --- engine: normalizeMetrics fails closed on malformed input ---
assert.deepEqual(normalizeMetrics({}), { xp: 0, streak: 0 }, 'Missing metrics must fail closed to zero.');
assert.deepEqual(normalizeMetrics({ xp: -5, streak: 'nope' }), { xp: 0, streak: 0 }, 'Negative/non-numeric metrics must fail closed to zero.');

// --- engine: progress labels ---
assert.equal(progressFor(findStyle('sakura'), { xp: 0, streak: 3 }, ['starter']), '3/7 streak days');
assert.equal(progressFor(findStyle('starter'), { xp: 0, streak: 0 }, ['starter']), 'Ready');

// --- engine: iconFor render helper ---
assert.equal(iconFor({ cosmetic: 'lantern' }), '🏮', 'iconFor must resolve a known cosmetic id.');
assert.equal(iconFor({}), '🌱', 'iconFor must fall back to starter for missing/invalid cosmetic.');
assert.equal(iconFor(null), '🌱', 'iconFor must fail closed on null avatar.');

// --- app owner: guest device-only, no cloud call ---
function fakeStorage() {
  const map = new Map();
  return { read: (k, fb = null) => (map.has(k) ? map.get(k) : fb), write: (k, v) => { map.set(k, v); return v; }, remove: k => { map.delete(k); } };
}
let cloudCalls = 0;
const cloudApi = { avatarVault: { load: async () => { cloudCalls++; return null; }, save: async () => { cloudCalls++; } } };
const guestSession = { getState: () => ({ authenticated: false, user: null }) };
const guestProgress = { getState: () => ({ xp: 0, streak: 0 }) };
const guestVault = createAvatarVaultService({ session: guestSession, privateStorage: fakeStorage(), api: cloudApi, progress: guestProgress });
const guestState = await guestVault.load();
assert.equal(cloudCalls, 0, 'Guest owner must never call the API boundary.');
assert.equal(guestState.scope, 'guest-device');
assert.equal(guestState.selected.id, 'starter');

// --- app owner: locked selection fails closed and does not persist ---
await assert.rejects(() => guestVault.select('crown'), err => err.code === 'BQ_AVATAR_VAULT_LOCKED', 'Selecting a locked style must fail closed.');
assert.equal(guestVault.getState().selected.id, 'starter', 'A rejected selection must not change equipped style.');

// --- app owner: unlocked selection persists locally ---
const richProgress = { getState: () => ({ xp: 3000, streak: 40 }) };
const richStorage = fakeStorage();
const guestRich = createAvatarVaultService({ session: guestSession, privateStorage: richStorage, api: cloudApi, progress: richProgress });
await guestRich.load();
const afterSelect = await guestRich.select('crown');
assert.equal(afterSelect.selected.id, 'crown');
assert.equal(cloudCalls, 0, 'Guest select must still never call the API boundary.');

// --- app owner: authenticated select syncs; failed sync keeps device state authoritative and reports synced:false ---
const acctSession = { getState: () => ({ authenticated: true, user: { id: 'user-1' } }) };
const failingApi = { avatarVault: { load: async () => null, save: async () => { throw new Error('network down'); } } };
const acctVault = createAvatarVaultService({ session: acctSession, privateStorage: fakeStorage(), api: failingApi, progress: richProgress });
await acctVault.load();
const failedSync = await acctVault.select('crown');
assert.equal(failedSync.selected.id, 'crown', 'Device state stays authoritative even when cloud sync fails.');
assert.equal(failedSync.synced, false, 'A failed cloud sync must be visibly reported, not silently swallowed.');

// --- app owner: account and guest owners are isolated ---
const sharedStorage = fakeStorage();
const okApi = { avatarVault: { load: async () => null, save: async () => {} } };
const guestIso = createAvatarVaultService({ session: guestSession, privateStorage: sharedStorage, api: okApi, progress: richProgress });
const acctIso = createAvatarVaultService({ session: acctSession, privateStorage: sharedStorage, api: okApi, progress: richProgress });
await guestIso.load(); await guestIso.select('crown');
await acctIso.load();
assert.equal(acctIso.getState().selected.id, 'starter', 'Guest selection must not leak into a signed-in account owner sharing the same device storage.');

console.log('BibleQuest v3 Avatar Vault edge suite passed.');
