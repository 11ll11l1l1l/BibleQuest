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
    '[name="query"]', '[name="contentType"]', '[name="taxonomyId"]', '[data-library-retry]', '[data-library-more]',
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
    assert.deepEqual(f.requests[0], { query: 'hope', contentType: 'devotional', taxonomyId: '', includeTaxonomy: true });
    assert.equal(f.nodes['[name="query"]'].value, 'hope');
    assert.equal(f.nodes['[data-library-results]'].attributes['aria-busy'], 'true');
    f.service.emit({ status: 'error', error: 'Unavailable' });
    const retry = f.nodes['[data-library-retry]'];
    retry.setAttribute('data-library-retry', '');
    assert.equal(retry.hidden, false);
    f.nodes['[name="query"]'].value = 'unsent draft';
    f.page.listeners.get('click')({ target: retry });
    assert.deepEqual(f.requests[1], { query: 'hope', contentType: 'devotional', taxonomyId: '', includeTaxonomy: true });
    assert.equal(retry.hidden, true);

    f.nodes['[name="contentType"]'].value = 'book';
    f.nodes['[data-library-search]'].listeners.get('submit')({
      target: f.nodes['[data-library-search]'], preventDefault() {},
    });
    assert.deepEqual(f.requests[2], { query: 'unsent draft', contentType: 'book', taxonomyId: '' });
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
    assert.deepEqual(destination.returnTo, { routeKey: 'library', query: 'submitted', contentType: 'devotional', taxonomyId: '' });
    assert.ok(f.nodes['[data-library-results]'].innerHTML.includes('&lt;img'));
    assert.ok(!f.nodes['[data-library-results]'].innerHTML.includes('<img'));
    assert.equal(f.nodes['[data-library-results]'].attributes['aria-busy'], 'false');
  } finally { globalThis.Element = priorElement; }
});

test('taxonomy controls preserve filters for item return and Clear resets discovery', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    let destination;
    const ui = createLibraryPage({ service: f.service, navigate: value => { destination = value; }, initialTaxonomyId: 'topic.hope' });
    ui.mount(f.root);
    assert.equal(f.requests[0].taxonomyId, 'topic.hope');
    f.service.emit({ status: 'ready', taxonomyId: 'topic.hope', items: [], taxonomy: [
      { id: 'topic.hope', kind: 'topic', labels: { en: '<Hope>' } },
      { id: 'category.faith', kind: 'category', labels: { en: 'Faith' } },
      { id: 'tag.prayer', kind: 'tag', labels: { en: 'Prayer' } },
    ] });
    const term = f.nodes['[name="taxonomyId"]'];
    assert.equal(term.value, 'topic.hope');
    assert.match(term.innerHTML, /&lt;Hope&gt;/);
    assert.match(term.innerHTML, /optgroup label="Topic"/);
    f.page.listeners.get('click')({ target: new ElementStub({ 'data-library-item': 'item-1' }) });
    assert.equal(destination.returnTo.taxonomyId, 'topic.hope');
    f.nodes['[name="query"]'].value = 'draft';
    f.page.listeners.get('click')({ target: new ElementStub({ 'data-library-clear': '' }) });
    assert.deepEqual(f.requests.at(-1), { query: '', contentType: '', taxonomyId: '' });
  } finally { globalThis.Element = priorElement; }
});

test('Load more preserves visible results and is disabled while loading; context reset clears terms', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    let calls = 0;
    f.service.loadMore = () => { calls++; f.service.emit({ loadingMore: true }); };
    createLibraryPage({ service: f.service, navigate() {} }).mount(f.root);
    f.service.emit({ status: 'ready', nextCursor: '24', items: [
      { id: 'item-1', contentType: 'book', title: 'Fixture book', summary: '', locale: 'en' },
    ], taxonomyId: 'topic.hope', taxonomy: [{ id: 'topic.hope', kind: 'topic', labels: { en: 'Hope' } }] });
    const more = f.nodes['[data-library-more]'];
    more.setAttribute('data-library-more', '');
    assert.equal(more.hidden, false);
    f.page.listeners.get('click')({ target: more });
    f.page.listeners.get('click')({ target: more });
    assert.equal(calls, 1);
    assert.equal(more.disabled, true);
    assert.match(f.nodes['[data-library-results]'].innerHTML, /Fixture book/);
    f.nodes['[name="taxonomyId"]'].value = 'topic.hope';
    f.service.emit({ status: 'idle', items: [], taxonomy: [], taxonomyId: '', nextCursor: null, loadingMore: false });
    assert.equal(f.nodes['[name="taxonomyId"]'].value, '');
    assert.doesNotMatch(f.nodes['[name="taxonomyId"]'].innerHTML, /topic.hope/);
    assert.equal(more.hidden, true);
  } finally { globalThis.Element = priorElement; }
});
