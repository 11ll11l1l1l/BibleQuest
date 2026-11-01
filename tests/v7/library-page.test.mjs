import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryPage } from '../../src/features/library/page.js';

class ElementStub {
  constructor(attributes = {}) {
    this.attributes = attributes; this.listeners = new Map(); this.value = '';
    this.focused = false; this.focusOptions = null;
  }
  setAttribute(key, value) { this.attributes[key] = value; }
  hasAttribute(key) { return Object.hasOwn(this.attributes, key); }
  getAttribute(key) { return this.attributes[key]; }
  closest() { return this; }
  focus(options) { this.focused = true; this.focusOptions = options; }
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  removeEventListener(name, fn) { if (this.listeners.get(name) === fn) this.listeners.delete(name); }
}

function fixture() {
  const nodes = Object.fromEntries([
    '[data-library-practices]', '[data-library-status]', '[data-library-results]', '[data-library-search]',
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
    let destination;
    const ui = createLibraryPage({ service: f.service, navigate: value => { destination = value; }, initialQuery: 'hope', initialContentType: 'devotional' });
    assert.match(ui.html, /data-library-status role="status" aria-live="polite" tabindex="-1"/);
    const dispose = ui.mount(f.root);
    assert.deepEqual(f.requests[0], { query: 'hope', contentType: 'devotional', taxonomyId: '', includeTaxonomy: true });
    assert.equal(f.nodes['[name="query"]'].value, 'hope');
    assert.equal(f.nodes['[data-library-results]'].attributes['aria-busy'], 'true');
    f.service.emit({ status: 'error', error: 'Unavailable' });
    const status = f.nodes['[data-library-status]'];
    assert.equal(status.attributes.role, 'alert');
    assert.equal(status.attributes['aria-live'], 'assertive');
    const retry = f.nodes['[data-library-retry]'];
    retry.setAttribute('data-library-retry', '');
    assert.equal(retry.hidden, false);
    f.nodes['[name="query"]'].value = 'unsent draft';
    f.page.listeners.get('click')({ target: retry });
    assert.deepEqual(f.requests[1], { query: 'hope', contentType: 'devotional', taxonomyId: '', includeTaxonomy: true });
    assert.equal(status.focused, true);
    assert.deepEqual(status.focusOptions, { preventScroll: true });
    assert.equal(status.attributes.role, 'status');
    assert.equal(status.attributes['aria-live'], 'polite');
    assert.equal(retry.hidden, true);

    f.nodes['[name="contentType"]'].value = 'book';
    f.nodes['[data-library-search]'].listeners.get('submit')({
      target: f.nodes['[data-library-search]'], preventDefault() {},
    });
    assert.deepEqual(destination, { routeKey: 'library', query: 'unsent draft', contentType: 'book', taxonomyId: '' });
    assert.equal(f.requests.length, 2, 'the destination mount owns the new read');
    dispose();
    assert.equal(f.isSubscribed(), false);
    assert.equal(f.page.listeners.size, 0);
    assert.equal(f.nodes['[data-library-search]'].listeners.size, 0);
    const restored = fixture();
    createLibraryPage({ service: restored.service, navigate() {}, initialQuery: destination.query,
      initialContentType: destination.contentType, initialTaxonomyId: destination.taxonomyId }).mount(restored.root);
    assert.deepEqual(restored.requests[0], { query: 'unsent draft', contentType: 'book', taxonomyId: '', includeTaxonomy: true });
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
    f.nodes['[data-library-search]'].listeners.get('submit')({
      target: f.nodes['[data-library-search]'], preventDefault() {},
    });
    assert.deepEqual(destination, { routeKey: 'library', query: '', contentType: '', taxonomyId: 'topic.hope' });
    f.page.listeners.get('click')({ target: new ElementStub({ 'data-library-item': 'item-1' }) });
    assert.equal(destination.returnTo.taxonomyId, 'topic.hope');
    f.nodes['[name="query"]'].value = 'draft';
    f.page.listeners.get('click')({ target: new ElementStub({ 'data-library-clear': '' }) });
    assert.deepEqual(destination, { routeKey: 'library', query: '', contentType: '', taxonomyId: '' });
    assert.equal(f.requests.length, 1, 'Clear navigates to the unfiltered route without an extra read');
  } finally { globalThis.Element = priorElement; }
});

test('Library detail return preserves search, type, taxonomy and both discovery dimensions', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    let destination;
    const selected = { emotions: ['anxious'], needs: ['peace'], topics: [], lifeSituations: [] };
    createLibraryPage({
      service: f.service,
      navigate: value => { destination = value; },
      discoverySearch: request => { f.requests.push(request); return f.service.list(request); },
      initialQuery: 'quiet hope', initialContentType: 'devotional', initialTaxonomyId: 'topic.prayer',
      initialDiscoveryQuery: selected,
    }).mount(f.root);
    assert.deepEqual(f.requests[0], {
      query: 'quiet hope', contentType: 'devotional', taxonomyId: 'topic.prayer', includeTaxonomy: true,
      emotions: ['anxious'], needs: ['peace'], topics: [], lifeSituations: [], locale: 'en',
    });
    f.service.emit({ status: 'ready', query: 'quiet hope', contentType: 'devotional', taxonomyId: 'topic.prayer', items: [
      { id: 'devotional-1', contentType: 'devotional', title: 'A quiet hope', summary: 'A short reflection.', locale: 'en' },
    ] });
    f.page.listeners.get('click')({ target: new ElementStub({ 'data-library-item': 'devotional-1' }) });
    assert.deepEqual(destination.returnTo, {
      routeKey: 'library', query: 'quiet hope', contentType: 'devotional', taxonomyId: 'topic.prayer',
      discoveryQuery: selected,
    });
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
    const status = f.nodes['[data-library-status]'];
    f.service.emit({ moreError: 'Unavailable' });
    assert.equal(status.attributes.role, 'alert');
    assert.equal(status.attributes['aria-live'], 'assertive');
    f.service.emit({ moreError: null });
    assert.equal(status.attributes.role, 'status');
    assert.equal(status.attributes['aria-live'], 'polite');
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

test('live filters debounce in place, retain results while loading and cancel pending search on disposal', async () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    const updates = [];
    let navigations = 0;
    const dispose = createLibraryPage({ service: f.service, navigate() { navigations++; },
      onFiltersChange: target => updates.push(target), initialContentType: 'devotional' }).mount(f.root);
    f.service.emit({ status: 'ready', items: [{ id: 'live-1', contentType: 'devotional', title: 'A real reading title', locale: 'en' }] });
    const visible = f.nodes['[data-library-results]'].innerHTML;
    const query = f.nodes['[name="query"]'];
    query.value = 'ho';
    f.nodes['[data-library-search]'].listeners.get('input')({ target: query });
    query.value = 'hope';
    f.nodes['[data-library-search]'].listeners.get('input')({ target: query });
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(f.requests.length, 2, 'rapid typing produces one new read');
    assert.equal(f.requests[1].query, 'hope');
    assert.equal(updates[0].query, 'hope');
    assert.equal(navigations, 0, 'filtering must not remount the route');
    assert.equal(f.nodes['[data-library-results]'].innerHTML, visible, 'loading keeps existing results visible');
    f.page.listeners.get('click')({ target: new ElementStub({ 'data-library-type': 'book' }) });
    assert.equal(f.requests.at(-1).contentType, 'book', 'type selection updates without submit');
    query.value = 'pending';
    f.nodes['[data-library-search]'].listeners.get('input')({ target: query });
    const count = f.requests.length;
    dispose();
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(f.requests.length, count, 'leaving the page cancels pending input');
  } finally { globalThis.Element = priorElement; }
});


test('Library practice launcher invokes the provided canonical route callback', () => {
  const f = fixture();
  let opened = 0;
  const page = createLibraryPage({ service: f.service, navigate() {}, onPractices() { opened += 1; } });
  assert.match(page.html, /data-library-practices lang="en"/);
  const dispose = page.mount(f.root);
  f.nodes['[data-library-practices]'].listeners.get('click')();
  assert.equal(opened, 1);
  dispose();
});

test('Library Couples collection opens only through its callback and removes its event on disposal', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    let opened = 0;
    const page = createLibraryPage({service: f.service, navigate() { throw new Error('No reading payload expected'); }, onCouples() { opened++; }});
    assert.match(page.html, /data-library-couples/);
    const dispose = page.mount(f.root);
    f.page.listeners.get('click')({target: new ElementStub({'data-library-couples': ''})});
    assert.equal(opened, 1);
    dispose();
    assert.equal(f.page.listeners.has('click'), false);
    assert.doesNotMatch(createLibraryPage({service: f.service, navigate() {}}).html, /data-library-couples/);
  } finally { globalThis.Element = priorElement; }
});
