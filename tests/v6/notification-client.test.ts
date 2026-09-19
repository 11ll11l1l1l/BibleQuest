import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SETTINGS_TEXT,
  createNotificationClientContext,
  createNotificationSettingsModel,
  defaultNotificationPreferences,
  notificationDestination,
} from '../../src/v6/notifications/index.ts';
import { isV6DeepLinkRoute } from '../../src/v6/routing/deep-link.ts';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
    dump: () => new Map(map),
  };
}

test('every notification category resolves to the integrated safe deep-link allowlist', () => {
  for (const category of NOTIFICATION_CATEGORIES) {
    assert.equal(isV6DeepLinkRoute(notificationDestination(category)), true);
  }
});

test('settings model exposes complete localized accessible labels without category drift', () => {
  const defaults = defaultNotificationPreferences();
  for (const locale of ['en', 'tl', 'ceb'] as const) {
    const model = createNotificationSettingsModel(defaults, locale);
    assert.equal(model.text, NOTIFICATION_SETTINGS_TEXT[locale]);
    assert.equal(model.categoryRows.length, NOTIFICATION_CATEGORIES.length);
    assert.deepEqual(model.categoryRows.map((row) => row.category), [...NOTIFICATION_CATEGORIES]);
    for (const row of model.categoryRows) {
      assert.ok(row.label.trim().length > 0);
      assert.equal(isV6DeepLinkRoute(row.destination), true);
    }
  }
});

test('notification client cleanup prevents account preference carry-over', () => {
  const storage = memoryStorage();
  const client = createNotificationClientContext(storage);
  const a = client.activate('user-a');
  client.save({ ...a, masterEnabled: false });
  assert.equal(client.preferences().masterEnabled, false);

  const b = client.switchAccount('user-b');
  assert.equal(b.masterEnabled, true);
  assert.equal(client.preferences().masterEnabled, true);
  assert.equal([...storage.dump().keys()].some((key) => key.endsWith('notification-prefs:user-a')), false);

  client.signOut();
  assert.equal([...storage.dump().keys()].some((key) => key.endsWith('notification-prefs:user-b')), false);
  assert.deepEqual(client.preferences(), defaultNotificationPreferences());
});

test('saving without an active account fails closed', () => {
  const client = createNotificationClientContext(memoryStorage());
  assert.throws(() => client.save(defaultNotificationPreferences()), /active account/);
});
