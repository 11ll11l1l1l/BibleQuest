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
    '[data-library-discovery]', '[data-library-retry]', '[data-library-more]',
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
