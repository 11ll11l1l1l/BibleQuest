import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryPage } from '../../src/features/library/page.js';

class ElementStub {
  constructor(attributes = {}) {
    this.attributes = attributes;
    this.listeners = new Map();
    this.value = '';
    this.hidden = false;
    this.innerHTML = '';
  }
  setAttribute(key, value) { this.attributes[key] = value; }
  hasAttribute(key) { return Object.hasOwn(this.attributes, key); }
  getAttribute(key) { return this.attributes[key]; }
  closest() { return this; }
  addEventListener(name, fn) { this.listeners.set(name, fn); }
  removeEventListener(name, fn) { if (this.listeners.get(name) === fn) this.listeners.delete(name); }
  querySelectorAll() { return []; }
  focus() {}
}

function fixture() {
  const selectors = [
    '[data-library-status]', '[data-library-results]', '[data-library-search]',
    '[name="query"]', '[name="contentType"]', '[name="taxonomyId"]',
    '[data-library-discovery]', '[data-library-emotion-discovery-host]', '[data-library-discovery-empty-host]',
    '[data-library-retry]', '[data-library-more]',
  ];
  const nodes = Object.fromEntries(selectors.map(selector => [selector, new ElementStub()]));
  const page = new ElementStub();
  page.querySelector = selector => nodes[selector];
  const root = { querySelector: () => page };
  let state = { status: 'idle', items: [], query: '', contentType: '', taxonomyId: '', taxonomy: [] };
  let listener;
  const requests = [];
  const service = {
    getState: () => state,
    subscribe(fn) { listener = fn; return () => { listener = null; }; },
    list(options) {
      requests.push(options);
      state = { ...state, status: 'loading', ...options };
      listener?.(state);
      return Promise.resolve(state);
    },
    emit(next) {
      state = { ...state, ...next };
      listener?.(state);
    },
  };
  return { root, page, nodes, service, requests };
}

test('emotion and need shortcuts expose canonical taxonomy and route through taxonomyId', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    let destination;
    createLibraryPage({ service: f.service, navigate: value => { destination = value; } }).mount(f.root);
    assert.equal(f.requests.length, 1);

    f.service.emit({
      status: 'ready',
      items: [],
      taxonomy: [
        { id: 'topic.worry', kind: 'topic', labels: { en: 'Worry' } },
        { id: 'topic.hope', kind: 'topic', labels: { en: 'Hope' } },
        { id: 'topic.prayer', kind: 'topic', labels: { en: 'Prayer' } },
        { id: 'category.books', kind: 'category', labels: { en: 'Books' } },
      ],
    });

    const discovery = f.nodes['[data-library-discovery]'];
    assert.equal(discovery.hidden, false);
    assert.match(discovery.innerHTML, /data-library-discovery-term="topic.worry"/);
    assert.match(discovery.innerHTML, /data-library-discovery-intent="emotion"/);
    assert.match(discovery.innerHTML, /data-library-discovery-term="topic.prayer"/);
    assert.match(discovery.innerHTML, /data-library-discovery-intent="need"/);
    assert.doesNotMatch(discovery.innerHTML, /category.books/);

    const chip = new ElementStub({
      'data-library-discovery-term': 'topic.worry',
      'data-library-discovery-intent': 'emotion',
    });
    f.page.listeners.get('click')({ target: chip });

    assert.equal(f.nodes['[name="taxonomyId"]'].value, 'topic.worry');
    assert.deepEqual(destination, {
      routeKey: 'library',
      query: '',
      contentType: '',
      taxonomyId: 'topic.worry',
    });
    assert.equal(f.requests.length, 1, 'route destination owns the filtered read');
  } finally {
    globalThis.Element = priorElement;
  }
});


test('full emotion discovery stays gated until a persistent executor is injected, then hands A3 the exact query shape', () => {
  const priorElement = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const disabled = fixture();
    createLibraryPage({
      service: disabled.service,
      navigate() {},
      initialDiscoveryQuery: { emotions: ['worried'], needs: ['peace'] },
    }).mount(disabled.root);
    assert.equal(disabled.nodes['[data-library-emotion-discovery-host]'].hidden, true);
    assert.deepEqual(disabled.requests[0], {
      query: '', contentType: '', taxonomyId: '', includeTaxonomy: true,
    });

    const f = fixture();
    const discoveryRequests = [];
    let destination;
    const discoverySearch = options => {
      discoveryRequests.push(options);
      return f.service.list(options);
    };
    createLibraryPage({
      service: f.service,
      navigate: value => { destination = value; },
      discoverySearch,
      initialDiscoveryQuery: { emotions: ['worried'], needs: ['peace'] },
    }).mount(f.root);

    const host = f.nodes['[data-library-emotion-discovery-host]'];
    assert.equal(host.hidden, false);
    assert.match(host.innerHTML, /data-library-discovery-id="anxious" aria-pressed="true"/);
    assert.match(host.innerHTML, /data-library-discovery-id="peace" aria-pressed="true"/);
    assert.deepEqual(discoveryRequests[0], {
      query: '',
      contentType: '',
      taxonomyId: '',
      includeTaxonomy: true,
      emotions: ['anxious'],
      needs: ['peace'],
      topics: [],
      lifeSituations: [],
      locale: 'en',
    });

    f.service.emit({ status: 'empty', items: [] });
    const empty = f.nodes['[data-library-discovery-empty-host]'];
    assert.equal(empty.hidden, false);
    assert.match(empty.innerHTML, /No published devotionals match all of these selections yet\./);
    assert.match(empty.innerHTML, /data-library-discovery-suggestion/);

    const chip = new ElementStub({
      'data-library-discovery-kind': 'need',
      'data-library-discovery-id': 'hope',
    });
    f.page.listeners.get('click')({ target: chip });
    assert.deepEqual(destination, {
      routeKey: 'library',
      query: '',
      contentType: '',
      taxonomyId: '',
      discoveryQuery: {
        emotions: ['anxious'],
        needs: ['hope', 'peace'],
        topics: [],
        lifeSituations: [],
      },
    });
    assert.equal(discoveryRequests.length, 1, 'the destination mount owns the updated persistent read');
  } finally {
    globalThis.Element = priorElement;
  }
});

test('filtered public route survives transient authenticated context reset during a locale reload', () => {
  const previous = globalThis.Element;
  globalThis.Element = ElementStub;
  try {
    const f = fixture();
    let contextReady = false;
    let notifyContext = () => {};
    const navigations = [];
    f.service.reset = () => f.service.emit({
      status: 'idle', items: [], query: '', contentType: '', taxonomyId: '', taxonomy: [],
    });
    createLibraryPage({
      service: f.service,
      navigate: destination => navigations.push(destination),
      discoverySearch: options => f.service.list(options),
      isContextReady: () => contextReady,
      subscribeContext: callback => { notifyContext = callback; return () => {}; },
      initialQuery: 'concern',
      initialContentType: 'devotional',
      initialDiscoveryQuery: { emotions: ['anxious'] },
    }).mount(f.root);

    assert.equal(f.requests.length, 0, 'no protected-context read is fired during bootstrap');
    assert.equal(f.nodes['[name="query"]'].value, 'concern');
    assert.equal(f.nodes['[name="contentType"]'].value, 'devotional');

    contextReady = true;
    notifyContext();
    assert.equal(f.requests.length, 1);
    assert.deepEqual(f.requests[0], {
      query: 'concern', contentType: 'devotional', taxonomyId: '',
      includeTaxonomy: true, emotions: ['anxious'], needs: [],
      topics: [], lifeSituations: [], locale: 'en',
    });
    assert.deepEqual(navigations, []);
  } finally {
    globalThis.Element = previous;
  }
});
