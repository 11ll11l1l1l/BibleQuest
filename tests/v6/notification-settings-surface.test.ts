import assert from 'node:assert/strict';
import test from 'node:test';

import {
  NOTIFICATION_CATEGORIES,
  createNotificationSettingsController,
} from '../../src/v6/notifications/index.ts';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
}

test('settings surface exposes stable accessible controls and disables dependent controls with master off', () => {
  const controller = createNotificationSettingsController(memoryStorage());
  let surface = controller.activate('member-a', 'en');
  assert.equal(surface.master.id, 'notification-master');
  assert.equal(surface.master.disabled, false);
  assert.ok(surface.master.ariaLabel.length > 0);
  assert.deepEqual(surface.categories.map((row) => row.id), NOTIFICATION_CATEGORIES.map((category) => `notification-category-${category}`));
  assert.equal(surface.categories.every((row) => row.ariaLabel.length > 0 && row.destination), true);

  surface = controller.setMaster(false);
  assert.equal(surface.master.checked, false);
  assert.equal(surface.categories.every((row) => row.disabled), true);
  assert.equal(surface.quietHours.disabled, true);
});

test('settings interactions persist category and normalized quiet-hour state per account', () => {
  const storage = memoryStorage();
  const controller = createNotificationSettingsController(storage);
  controller.activate('member-a', 'tl');
  let surface = controller.setCategory('streaks', false);
  assert.equal(surface.categories.find((row) => row.id.endsWith('streaks'))?.checked, false);

  surface = controller.setQuietHours(true, '21:30', '06:15');
  assert.deepEqual(
    { enabled: surface.quietHours.enabled, start: surface.quietHours.start, end: surface.quietHours.end },
    { enabled: true, start: '21:30', end: '06:15' },
  );

  const fresh = createNotificationSettingsController(storage).activate('member-a', 'tl');
  assert.equal(fresh.categories.find((row) => row.id.endsWith('streaks'))?.checked, false);
  assert.equal(fresh.quietHours.start, '21:30');
});

test('locale changes keep settings state while replacing visible and aria text', () => {
  const controller = createNotificationSettingsController(memoryStorage());
  const en = controller.activate('member-a', 'en');
  const ceb = controller.setLocale('ceb');
  assert.notEqual(en.title, ceb.title);
  assert.notEqual(en.master.ariaLabel, ceb.master.ariaLabel);
  assert.deepEqual(en.categories.map((row) => row.checked), ceb.categories.map((row) => row.checked));
});

test('account switch and sign-out do not carry private preference state across identities', () => {
  const controller = createNotificationSettingsController(memoryStorage());
  controller.activate('member-a');
  controller.setCategory('reading', false);
  const b = controller.switchAccount('member-b');
  assert.equal(b.categories.find((row) => row.id.endsWith('reading'))?.checked, true);
  controller.signOut();
  assert.throws(() => controller.setMaster(false), /active account/);
});
