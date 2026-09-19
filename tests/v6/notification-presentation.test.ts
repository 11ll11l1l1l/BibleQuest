import assert from 'node:assert/strict';
import test from 'node:test';

import { createNotificationSettingsController } from '../../src/v6/notifications/settings-surface.ts';
import { presentNotificationSettings, presentPlatformStatus, validateNotificationPresentation } from '../../src/v6/notifications/presentation.ts';
import { createPlatformStatusViewModel } from '../../src/v6/platform/status-surface.ts';

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => { map.set(key, value); },
    removeItem: (key: string) => { map.delete(key); },
  };
}

const capabilities = { standalone: false, ios: false, serviceWorker: true } as const;

test('notification presentation provides stable region/title/help relationships and unique controls', () => {
  const controller = createNotificationSettingsController(memoryStorage());
  const presentation = presentNotificationSettings(controller.activate('member-a', 'en'));
  assert.equal(presentation.landmark, 'region');
  assert.equal(presentation.ariaLabelledBy, presentation.title.id);
  assert.equal(presentation.quietHours.descriptionId, 'notification-quiet-hours-help');
  assert.deepEqual(validateNotificationPresentation(presentation), []);
});

test('master-off state remains visible while dependent notification controls are disabled', () => {
  const controller = createNotificationSettingsController(memoryStorage());
  controller.activate('member-a', 'tl');
  const presentation = presentNotificationSettings(controller.setMaster(false));
  assert.equal(presentation.master.checked, false);
  assert.equal(presentation.master.disabled, false);
  assert.equal(presentation.categories.every((item) => item.disabled), true);
  assert.equal(presentation.quietHours.disabled, true);
  assert.deepEqual(validateNotificationPresentation(presentation), []);
});

test('EN TL and Cebuano presentations preserve control identity and localized accessible copy', () => {
  const controller = createNotificationSettingsController(memoryStorage());
  const en = presentNotificationSettings(controller.activate('member-a', 'en'));
  const tl = presentNotificationSettings(controller.setLocale('tl'));
  const ceb = presentNotificationSettings(controller.setLocale('ceb'));
  assert.deepEqual(en.categories.map((item) => item.id), tl.categories.map((item) => item.id));
  assert.deepEqual(en.categories.map((item) => item.id), ceb.categories.map((item) => item.id));
  assert.notEqual(en.title.text, tl.title.text);
  assert.notEqual(en.master.ariaLabel, ceb.master.ariaLabel);
  assert.deepEqual(validateNotificationPresentation(tl), []);
  assert.deepEqual(validateNotificationPresentation(ceb), []);
});

test('platform presentation exposes a polite connectivity live region and only truthful install action', () => {
  const offline = presentPlatformStatus(createPlatformStatusViewModel('ceb', { online: false, changedAt: 42 }, capabilities, false));
  assert.equal(offline.connectivity.role, 'status');
  assert.equal(offline.connectivity.ariaLive, 'polite');
  assert.equal(offline.connectivity.online, false);
  assert.equal(offline.install.actionable, false);
  assert.equal(offline.install.actionLabel, null);

  const prompt = presentPlatformStatus(createPlatformStatusViewModel('en', { online: true, changedAt: 43 }, capabilities, true));
  assert.equal(prompt.install.actionable, true);
  assert.ok(prompt.install.actionLabel);
});
