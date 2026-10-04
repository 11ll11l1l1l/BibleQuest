import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryPage } from '../../src/features/library/page.js';

class ElementStub {
  constructor(attributes = {}) { this.attributes = attributes; this.listeners = new Map(); this.value = ''; }
  setAttribute(key, value) { this.attributes[key] = value; }
  hasAttribute(key) { return Object.hasOwn(this.attributes, key); }
  getAttribute(key) { return this.attributes[key]; }
  closest() { return this; }
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  removeEventListener(name, fn) { if (this.listeners.get(name) === fn) this.listeners.delete(name); }
}

function fixture() {
  const nodes = Object.fromEntries([
    '[data-library-status]', '[data-library-results]', '[data-library-search]',
    '[name="query"]', '[name="contentType"]', '[data-library-retry]',
  ].map(key => [key, new ElementStub()]));
  const page = new ElementStub();
  page.querySelector = key => nodes[key];
  const root = { querySelector: () => page };
  let state = { status: 'idle', items: [], query: '', contentType: '' };
  let listener;
  const requests = [];
  const service = {
    getState: () => state,
    subscribe(fn) { listener = fn; return () => { listener = null; }; },
    emit(next) { state = { ...state, ...next }; listener?.(state); },
    list(options) {
      requests.push(options);
      this.emit({ status: 'loading', items: [], ...options });
      return Promise.resolve(state);
    },
  };
  return { page, root, nodes, service, requests, isSubscribed: () => Boolean(listener) };
}

test('browse restore and Retry preserve the submitted request rather than draft fields', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    const ui = createLibraryPage({ service: f.service, navigate() {}, initialQuery: 'hope', initialContentType: 'devotional' });
    const dispose = ui.mount(f.root);
    assert.deepEqual(f.requests[0], { query: 'hope', contentType: 'devotional' });
    assert.equal(f.nodes['[name="query"]'].value, 'hope');
    assert.equal(f.nodes['[data-library-results]'].attributes['aria-busy'], 'true');
    f.service.emit({ status: 'error', error: 'Unavailable' });
    const retry = f.nodes['[data-library-retry]'];
    retry.setAttribute('data-library-retry', '');
    assert.equal(retry.hidden, false);
    f.nodes['[name="query"]'].value = 'unsent draft';
    f.page.listeners.get('click')({ target: retry });
    assert.deepEqual(f.requests[1], { query: 'hope', contentType: 'devotional' });
    assert.equal(retry.hidden, true);

    f.nodes['[name="contentType"]'].value = 'book';
    f.nodes['[data-library-search]'].listeners.get('submit')({
      target: f.nodes['[data-library-search]'], preventDefault() {},
    });
    assert.deepEqual(f.requests[2], { query: 'unsent draft', contentType: 'book' });
    dispose();
    assert.equal(f.isSubscribed(), false);
    assert.equal(f.page.listeners.size, 0);
    assert.equal(f.nodes['[data-library-search]'].listeners.size, 0);
  } finally { globalThis.Element = priorElement; }
});

test('item return destination uses displayed results and escapes untrusted content', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    let destination;
    createLibraryPage({ service: f.service, navigate: value => { destination = value; } }).mount(f.root);
    f.service.emit({ status: 'ready', query: 'submitted', contentType: 'devotional',
      items: [{ id: 'item-1', contentType: 'devotional', title: '<img src=x onerror=alert(1)>', summary: 'Hope', locale: 'en' }] });
    f.nodes['[name="query"]'].value = 'unsent draft';
    f.page.listeners.get('click')({ target: new ElementStub({ 'data-library-item': 'item-1' }) });
    assert.deepEqual(destination.returnTo, { routeKey: 'library', query: 'submitted', contentType: 'devotional' });
    assert.ok(f.nodes['[data-library-results]'].innerHTML.includes('&lt;img'));
    assert.ok(!f.nodes['[data-library-results]'].innerHTML.includes('<img'));
    assert.equal(f.nodes['[data-library-results]'].attributes['aria-busy'], 'false');
  } finally { globalThis.Element = priorElement; }
});
