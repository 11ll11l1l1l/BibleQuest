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
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
      standalone: false,
      maxTouchPoints: 5,
    }),
    'ios-a2hs',
  );
  assert.equal(
    detectPwaInstallGuidance({
      userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9)',
      standalone: false,
    }),
    null,
  );
});

test('PWA install service reports iOS Home Screen launches as installed', () => {
  const target = new EventTarget();
  const service = createPwaInstallService({
    eventTarget: target,
    displayMode: () => ({ matches: false }),
    standalone: true,
    guidance: null,
  });

  assert.deepEqual(service.getState(), {
    status: 'installed',
    canPrompt: false,
    guidance: null,
  });

  service.dispose();
});

test('PWA install service keeps iOS guidance authoritative over stray native prompt events', () => {
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
  assert.deepEqual(service.getState(), {
    status: 'unavailable',
    canPrompt: false,
    guidance: 'ios-a2hs',
  });

  target.dispatchEvent(new Event('appinstalled'));
  assert.equal(service.getState().status, 'installed');
  assert.equal(service.getState().guidance, null);

  service.dispose();
});
