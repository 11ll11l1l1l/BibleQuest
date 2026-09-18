import assert from 'node:assert/strict';
import test from 'node:test';

import { createBadgeAdapter } from '../../src/v6/platform/badge.ts';
import { detectClientCapabilities } from '../../src/v6/platform/capabilities.ts';
import { createConnectivityStore } from '../../src/v6/platform/connectivity.ts';
import { chooseInstallExperience } from '../../src/v6/platform/install-policy.ts';
import { validateBibleQuestManifest } from '../../src/v6/platform/manifest.ts';
import { createVersionedJsonStore } from '../../src/v6/platform/persistence.ts';
import { createShareAdapter } from '../../src/v6/platform/share.ts';
import {
  createNotificationPreferenceStore,
  defaultNotificationPreferences,
  isQuietMinute,
  normalizeNotificationPreferences,
} from '../../src/v6/notifications/preferences.ts';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
    dump: () => new Map(map),
  };
}

test('capability detection is injectable and recognizes standalone iOS progressive enhancements', () => {
  const caps = detectClientCapabilities({
    navigator: {
      userAgent: 'Mozilla/5.0 (iPhone)',
      standalone: true,
      serviceWorker: {},
      share() {},
      clipboard: { writeText() {} },
      storage: { persist() {}, estimate() {} },
      setAppBadge() {},
      clearAppBadge() {},
    },
    Notification: {},
    PushManager: {},
  });
  assert.equal(caps.ios, true);
  assert.equal(caps.standalone, true);
  assert.equal(caps.serviceWorker, true);
  assert.equal(caps.nativeShare, true);
  assert.equal(caps.appBadge, true);
});

test('install policy prefers installed, prompt, iOS guidance, then manual fallback', () => {
  assert.equal(chooseInstallExperience({ standalone: true, ios: false, serviceWorker: true }, true), 'installed');
  assert.equal(chooseInstallExperience({ standalone: false, ios: false, serviceWorker: true }, true), 'prompt');
  assert.equal(chooseInstallExperience({ standalone: false, ios: true, serviceWorker: true }, false), 'ios-a2hs');
  assert.equal(chooseInstallExperience({ standalone: false, ios: false, serviceWorker: true }, false), 'manual');
  assert.equal(chooseInstallExperience({ standalone: false, ios: false, serviceWorker: false }, false), 'unsupported');
});

test('connectivity store publishes only real transitions and disposes listeners', () => {
  let online = true;
  let now = 10;
  const listeners = { online: new Set<() => void>(), offline: new Set<() => void>() };
  const store = createConnectivityStore({
    online: () => online,
    now: () => now,
    addEventListener: (type, listener) => listeners[type].add(listener),
    removeEventListener: (type, listener) => listeners[type].delete(listener),
  });
  const seen: boolean[] = [];
  const unsubscribe = store.subscribe((state) => seen.push(state.online));
  listeners.online.forEach((listener) => listener());
  online = false;
  now = 20;
  listeners.offline.forEach((listener) => listener());
  assert.deepEqual(seen, [true, false]);
  assert.equal(store.snapshot().changedAt, 20);
  unsubscribe();
  store.dispose();
  assert.equal(listeners.online.size + listeners.offline.size, 0);
});

test('versioned persistence fails closed on malformed or wrong-version state', () => {
  const storage = memoryStorage();
  const store = createVersionedJsonStore(storage, 'biblequest.v6');
  assert.equal(store.write('prefs', 1, { a: 1 }).ok, true);
  assert.deepEqual(store.read<{ a: number }>('prefs', 1), { ok: true, value: { a: 1 } });
  assert.deepEqual(store.read('prefs', 2), { ok: false, reason: 'version' });
  storage.setItem('biblequest.v6.bad', '{oops');
  assert.deepEqual(store.read('bad', 1), { ok: false, reason: 'malformed' });
});

test('badge adapter clamps counts and gracefully degrades', async () => {
  const calls: number[] = [];
  let clears = 0;
  const badge = createBadgeAdapter({
    async setAppBadge(count = 0) { calls.push(count); },
    async clearAppBadge() { clears += 1; },
  });
  assert.equal(await badge.set(1200), true);
  assert.deepEqual(calls, [999]);
  assert.equal(await badge.set(0), true);
  assert.equal(clears, 1);
  assert.equal(await createBadgeAdapter(null).set(4), false);
});

test('share adapter uses native share then clipboard fallback without throwing', async () => {
  const native = createShareAdapter({ share: async () => {} });
  assert.deepEqual(await native.share({ title: 'Verse', url: 'https://example.test' }), { ok: true, mode: 'native' });

  let copied = '';
  const fallback = createShareAdapter({
    share: async () => { throw new Error('not available'); },
    clipboard: { writeText: async (value) => { copied = value; } },
  });
  assert.deepEqual(await fallback.share({ title: 'Verse', text: 'Text', url: 'https://example.test' }), { ok: true, mode: 'clipboard' });
  assert.match(copied, /Verse\nText\nhttps:\/\/example\.test/);
});

test('manifest validation enforces relative scope and required icon classes', () => {
  const good = validateBibleQuestManifest({
    start_url: './',
    scope: './',
    display: 'standalone',
    icons: [
      { sizes: '192x192', purpose: 'any' },
      { sizes: '512x512', purpose: 'any' },
      { sizes: '512x512', purpose: 'maskable' },
    ],
  });
  assert.equal(good.valid, true);
  const bad = validateBibleQuestManifest({ start_url: '/', scope: '/', display: 'browser', icons: [] });
  assert.equal(bad.valid, false);
  assert.ok(bad.issues.length >= 6);
});

test('notification preferences are account-scoped and quiet hours handle midnight', () => {
  const storage = memoryStorage();
  const prefs = createNotificationPreferenceStore(storage);
  const defaults = prefs.load('user-a');
  assert.deepEqual(defaults, defaultNotificationPreferences());

  const saved = prefs.save('user-a', normalizeNotificationPreferences({
    masterEnabled: true,
    categories: { ...defaults.categories, streaks: false },
    quietHours: { enabled: true, start: '22:00', end: '07:00' },
  }));
  assert.equal(saved.categories.streaks, false);
  assert.equal(isQuietMinute(saved, 23 * 60), true);
  assert.equal(isQuietMinute(saved, 6 * 60 + 59), true);
  assert.equal(isQuietMinute(saved, 12 * 60), false);
  assert.equal(prefs.load('user-b').categories.streaks, true);
  assert.notDeepEqual(prefs.load('user-a'), prefs.load('user-b'));
});
