import assert from 'node:assert/strict';
import test from 'node:test';

import { createPlatformStatusViewModel, platformStatusCopy } from '../../src/v6/platform/status-surface.ts';

const webCaps = { standalone: false, ios: false, serviceWorker: true };

test('connectivity status is accessible, localized, and preserves transition time', () => {
  for (const locale of ['en', 'tl', 'ceb'] as const) {
    const copy = platformStatusCopy(locale);
    const offline = createPlatformStatusViewModel(locale, { online: false, changedAt: 42 }, webCaps, false);
    assert.equal(offline.connectivity.online, false);
    assert.equal(offline.connectivity.label, copy.offline);
    assert.equal(offline.connectivity.role, 'status');
    assert.equal(offline.connectivity.ariaLive, 'polite');
    assert.equal(offline.connectivity.changedAt, 42);
    assert.ok(offline.connectivity.label.length > 0);
  }
});

test('install prompt is the only directly actionable install experience', () => {
  const prompt = createPlatformStatusViewModel('en', { online: true, changedAt: 1 }, webCaps, true);
  assert.equal(prompt.install.experience, 'prompt');
  assert.equal(prompt.install.actionable, true);
  assert.equal(prompt.install.actionLabel, 'Install app');
  assert.equal(prompt.install.instructionsRequired, false);

  const installed = createPlatformStatusViewModel('en', { online: true, changedAt: 1 }, { ...webCaps, standalone: true }, true);
  assert.equal(installed.install.experience, 'installed');
  assert.equal(installed.install.actionable, false);
  assert.equal(installed.install.actionLabel, null);
});

test('iOS and manual installation expose instructions without pretending a prompt exists', () => {
  const ios = createPlatformStatusViewModel('tl', { online: true, changedAt: 1 }, { standalone: false, ios: true, serviceWorker: true }, false);
  assert.equal(ios.install.experience, 'ios-a2hs');
  assert.equal(ios.install.actionable, false);
  assert.equal(ios.install.instructionsRequired, true);
  assert.match(ios.install.label, /Home Screen/);

  const manual = createPlatformStatusViewModel('ceb', { online: true, changedAt: 1 }, webCaps, false);
  assert.equal(manual.install.experience, 'manual');
  assert.equal(manual.install.actionable, false);
  assert.equal(manual.install.instructionsRequired, true);
});

test('unsupported browsers degrade to non-actionable localized status', () => {
  for (const locale of ['en', 'tl', 'ceb'] as const) {
    const model = createPlatformStatusViewModel(locale, { online: true, changedAt: 1 }, { standalone: false, ios: false, serviceWorker: false }, false);
    assert.equal(model.install.experience, 'unsupported');
    assert.equal(model.install.actionable, false);
    assert.equal(model.install.actionLabel, null);
    assert.equal(model.install.instructionsRequired, false);
    assert.ok(model.install.label.length > 0);
  }
});
