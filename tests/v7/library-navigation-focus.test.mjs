import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryPage } from '../../src/features/library/page.js';
import { createLibraryItemPage } from '../../src/features/library/item-page.js';

class ElementStub {
  constructor(attributes = {}) {
    this.attributes = attributes;
    this.listeners = new Map();
    this.handlers = new Map();
    this.value = '';
    this.innerHTML = '';
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.focused = false;
    this.focusOptions = null;
  }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name]; }
  hasAttribute(name) { return Object.hasOwn(this.attributes, name); }
  closest() { return this; }
  focus(options) { this.focused = true; this.focusOptions = options; }
  addEventListener(name, fn) { this.listeners.set(name, fn); this.handlers.set(name, fn); }
  removeEventListener(name, fn) {
    if (this.listeners.get(name) === fn) this.listeners.delete(name);
    if (this.handlers.get(name) === fn) this.handlers.delete(name);
  }
}

test('Library detail route focuses the persistent status region before starting its read', () => {
  const host = new ElementStub();
  const back = new ElementStub();
  const retry = new ElementStub();
  retry.hidden = true;
  const nodes = {
    '[data-library-detail]': host,
    '[data-library-back]': back,
    '[data-library-item-retry]': retry,
  };
  let listener;
  const requests = [];
  const service = {
    subscribe(fn) { listener = fn; return () => { listener = null; }; },
    getItem(id) { requests.push(id); listener?.({ status: 'loading' }); return Promise.resolve(); },
  };
  const dispose = createLibraryItemPage({ service, id: 'item-1', onBack() {} })
    .mount({ querySelector: selector => nodes[selector] });

  assert.deepEqual(requests, ['item-1']);
  assert.equal(host.focused, true);
  assert.deepEqual(host.focusOptions, { preventScroll: true });
  assert.equal(host.getAttribute('role'), 'status');
  assert.equal(host.getAttribute('aria-live'), 'polite');
  dispose();
});

test('final Library pagination completion moves focus to the persistent status when More disappears', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const nodes = Object.fromEntries([
      '[data-library-status]', '[data-library-results]', '[data-library-search]',
      '[name="query"]', '[name="contentType"]', '[name="taxonomyId"]',
      '[data-library-retry]', '[data-library-more]',
    ].map(selector => [selector, new ElementStub()]));
    const page = new ElementStub();
    page.querySelector = selector => nodes[selector];
    const root = { querySelector: () => page };
    let state = { status: 'idle', items: [], query: '', contentType: '', taxonomy: [] };
    let listener;
    let loadMoreCalls = 0;
    const service = {
      getState: () => state,
      subscribe(fn) { listener = fn; return () => { listener = null; }; },
      emit(next) { state = { ...state, ...next }; listener?.(state); },
      list(options) {
        this.emit({ status: 'loading', items: [], ...options });
        return Promise.resolve(state);
      },
      loadMore() {
        loadMoreCalls += 1;
        this.emit({ loadingMore: true });
        return Promise.resolve(state);
      },
    };

    const dispose = createLibraryPage({ service, navigate() {} }).mount(root);
    service.emit({ status: 'ready', items: [], nextCursor: 'page-2', loadingMore: false });
    const more = nodes['[data-library-more]'];
    more.setAttribute('data-library-more', '');
    assert.equal(more.hidden, false);

    page.listeners.get('click')({ target: more });
    assert.equal(loadMoreCalls, 1);
    assert.equal(more.disabled, true);
    assert.equal(nodes['[data-library-status]'].focused, false);

    service.emit({ status: 'ready', items: [], nextCursor: null, loadingMore: false });
    assert.equal(more.hidden, true);
    assert.equal(nodes['[data-library-status]'].focused, true);
    assert.deepEqual(nodes['[data-library-status]'].focusOptions, { preventScroll: true });
    dispose();
  } finally {
    globalThis.Element = priorElement;
  }
});

test('pagination keeps focus on More when another page remains available', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const nodes = Object.fromEntries([
      '[data-library-status]', '[data-library-results]', '[data-library-search]',
      '[name="query"]', '[name="contentType"]', '[name="taxonomyId"]',
      '[data-library-retry]', '[data-library-more]',
    ].map(selector => [selector, new ElementStub()]));
    const page = new ElementStub();
    page.querySelector = selector => nodes[selector];
    let state = { status: 'idle', items: [], query: '', contentType: '', taxonomy: [] };
    let listener;
    const service = {
      getState: () => state,
      subscribe(fn) { listener = fn; return () => { listener = null; }; },
      emit(next) { state = { ...state, ...next }; listener?.(state); },
      list(options) { this.emit({ status: 'loading', items: [], ...options }); return Promise.resolve(state); },
      loadMore() { this.emit({ loadingMore: true }); return Promise.resolve(state); },
    };
    const dispose = createLibraryPage({ service, navigate() {} }).mount({ querySelector: () => page });
    service.emit({ status: 'ready', items: [], nextCursor: 'page-2', loadingMore: false });
    const more = nodes['[data-library-more]'];
    more.setAttribute('data-library-more', '');
    page.listeners.get('click')({ target: more });
    service.emit({ status: 'ready', items: [], nextCursor: 'page-3', loadingMore: false });

    assert.equal(more.hidden, false);
    assert.equal(nodes['[data-library-status]'].focused, false);
    dispose();
  } finally {
    globalThis.Element = priorElement;
  }
});
