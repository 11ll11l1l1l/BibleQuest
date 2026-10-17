import test from 'node:test';
import assert from 'node:assert/strict';
import { createRouter } from '../../src/app/router.js';

test('quiet filter URL replacement preserves the mounted route and rejects route changes', () => {
  const originals = Object.fromEntries(['window', 'location', 'history'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const location = { hash: '#/library', href: 'https://example.test/#/library' };
  const listeners = new Map();
  const replaceCalls = [];
  Object.defineProperty(globalThis, 'location', { configurable: true, value: location });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { addEventListener: (name, handler) => listeners.set(name, handler) } });
  Object.defineProperty(globalThis, 'history', { configurable: true, value: {
    replaceState(_state, _title, hash) { replaceCalls.push(hash); location.hash = hash; location.href = 'https://example.test/' + hash; },
  } });
  try {
    let renders = 0;
    const router = createRouter({ routes: { library() {}, home() {} }, onRoute() { renders++; } });
    router.start();
    router.replace('library?query=hope&contentType=devotional');
    assert.equal(location.hash, '#/library?query=hope&contentType=devotional');
    assert.equal(renders, 1, 'typing must not remount the active page');
    assert.equal(replaceCalls.length, 1);
    assert.equal(router.current(), 'library');
    assert.throws(() => router.replace('home'), /current route/);
    assert.equal(replaceCalls.length, 1);
  } finally {
    for (const [key, descriptor] of Object.entries(originals)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
