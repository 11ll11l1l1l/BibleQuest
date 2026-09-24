import assert from 'node:assert/strict';
import test from 'node:test';

import { createPwaInstallService, detectPwaInstallGuidance } from '../../src/app/pwa-install.js';

test('PWA install guidance identifies iOS Add to Home Screen fallback', () => {
  assert.equal(
    detectPwaInstallGuidance({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      standalone: false,
    }),
    'ios-a2hs',
  );
  assert.equal(
    detectPwaInstallGuidance({
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)',
      standalone: true,
    }),
    null,
  );
  assert.equal(
    detectPwaInstallGuidance({
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9)',
      standalone: false,
    }),
    null,
  );
});

test('PWA install service exposes iOS guidance only while native prompting is unavailable', () => {
  const target = new EventTarget();
  const service = createPwaInstallService({
    eventTarget: target,
    displayMode: () => ({ matches: false }),
    guidance: 'ios-a2hs',
  });

  assert.deepEqual(service.getState(), {
    status: 'unavailable',
    canPrompt: false,
    guidance: 'ios-a2hs',
  });

  const eligible = new Event('beforeinstallprompt');
  Object.assign(eligible, {
    prompt: async () => {},
    userChoice: Promise.resolve({ outcome: 'dismissed' }),
  });
  target.dispatchEvent(eligible);
  assert.equal(service.getState().status, 'available');
  assert.equal(service.getState().guidance, null);

  target.dispatchEvent(new Event('appinstalled'));
  assert.equal(service.getState().status, 'installed');
  assert.equal(service.getState().guidance, null);

  service.dispose();
});
