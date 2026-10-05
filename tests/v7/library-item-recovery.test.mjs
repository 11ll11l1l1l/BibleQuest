import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryItemPage } from '../../src/features/library/item-page.js';
import { localization } from '../../src/app/localization.js';

function fixture(id = 'original-item') {
  const nodes = Object.fromEntries(['[data-library-detail]', '[data-library-back]', '[data-library-item-retry]'].map(key => [key, {
    hidden: true, textContent: '', innerHTML: '', handlers: new Map(),
    addEventListener(name, fn) { this.handlers.set(name, fn); },
    removeEventListener(name, fn) { if (this.handlers.get(name) === fn) this.handlers.delete(name); },
  }]));
  let listener;
  const requests = [];
  const service = {
    subscribe(fn) { listener = fn; return () => { listener = null; }; },
    getItem(key) { requests.push(key); listener?.({ status: 'loading' }); return Promise.resolve(); },
  };
  const dispose = createLibraryItemPage({ service, id, onBack() {} }).mount({ querySelector: key => nodes[key] });
  return { nodes, requests, dispose, emit: state => listener?.(state), retry: () => nodes['[data-library-item-retry]'].handlers.get('click')?.() };
}

test('item failure and context reset offer same-item Retry; loading and unavailable states do not', () => {
  const f = fixture();
  const retry = f.nodes['[data-library-item-retry]'];
  assert.deepEqual(f.requests, ['original-item']);
  assert.equal(retry.hidden, true);
  f.emit({ status: 'error', error: 'private backend diagnostics' });
  assert.equal(retry.hidden, false);
  assert.equal(f.nodes['[data-library-detail]'].textContent, localization.t('v7.library.item.error'));
  f.retry(); f.retry();
  assert.deepEqual(f.requests, ['original-item', 'original-item']);
  f.emit({ status: 'idle' });
  assert.equal(retry.hidden, false);
  f.retry();
  assert.equal(f.requests.length, 3);
  f.emit({ status: 'not-found' });
  assert.equal(retry.hidden, true);
  f.retry();
  assert.equal(f.requests.length, 3);
  f.dispose();
  assert.equal(retry.handlers.size, 0);
  f.retry();
  assert.equal(f.requests.length, 3);
});

test('missing item ID never enables a retry or performs a read', () => {
  const f = fixture('');
  for (const status of ['error', 'idle', 'not-found']) {
    f.emit({ status }); f.retry();
    assert.equal(f.nodes['[data-library-item-retry]'].hidden, true);
  }
  assert.deepEqual(f.requests, []);
  f.dispose();
});

test('offline item failures use the localized connection recovery message', () => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { onLine: false } });
  try {
    const f = fixture();
    f.emit({ status: 'error' });
    assert.equal(f.nodes['[data-library-detail]'].textContent, localization.t('v7.library.offline'));
    assert.equal(f.nodes['[data-library-item-retry]'].hidden, false);
    f.dispose();
  } finally {
    if (prior) Object.defineProperty(globalThis, 'navigator', prior);
    else delete globalThis.navigator;
  }
});
