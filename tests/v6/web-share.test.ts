import assert from 'node:assert/strict';
import test from 'node:test';

import { createWebShareService } from '../../src/app/web-share.js';

const locationRef = {
  href: 'https://example.test/app/#/more',
  origin: 'https://example.test',
  pathname: '/app/',
};

test('Web Share uses the native share sheet with a route-neutral app URL', async () => {
  let shared = null;
  const service = createWebShareService({
    navigatorRef: {
      share: async payload => { shared = payload; },
    },
    locationRef,
  });

  assert.deepEqual(service.payload, {
    title: 'BibleQuest',
    text: 'Open BibleQuest',
    url: 'https://example.test/app/',
  });
  assert.deepEqual(await service.share(), { outcome: 'shared', method: 'native' });
  assert.deepEqual(shared, service.payload);
});

test('Web Share cancellation does not fall back to clipboard', async () => {
  let copied = '';
  const error = new Error('cancelled');
  error.name = 'AbortError';
  const service = createWebShareService({
    navigatorRef: {
      share: async () => { throw error; },
      clipboard: { writeText: async value => { copied = value; } },
    },
    locationRef,
  });

  assert.deepEqual(await service.share(), { outcome: 'cancelled', method: 'native' });
  assert.equal(copied, '');
});

test('Web Share falls back to clipboard when native sharing is unavailable or fails', async () => {
  const copied = [];
  const clipboard = { writeText: async value => { copied.push(value); } };

  const unavailableNative = createWebShareService({
    navigatorRef: { clipboard },
    locationRef,
  });
  assert.deepEqual(await unavailableNative.share(), { outcome: 'copied', method: 'clipboard' });

  const failedNative = createWebShareService({
    navigatorRef: {
      share: async () => { throw new Error('native share unavailable'); },
      clipboard,
    },
    locationRef,
  });
  assert.deepEqual(await failedNative.share(), { outcome: 'copied', method: 'clipboard' });
  assert.deepEqual(copied, ['https://example.test/app/', 'https://example.test/app/']);
});

test('Web Share fails closed when no share or clipboard capability is available', async () => {
  const service = createWebShareService({ navigatorRef: {}, locationRef });
  assert.deepEqual(await service.share(), { outcome: 'unavailable', method: 'none' });
});
