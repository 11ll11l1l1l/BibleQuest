import assert from 'node:assert/strict';
import test from 'node:test';
import { createRouter, requestNavigation } from '../../src/app/router.js';
import { localization, t, getMissingLocaleKeys } from '../../src/app/localization.js';

test('shell navigation bridge preserves V7 context and inherited routes across history events', () => {
  const keys = ['window', 'location', 'history', 'CustomEvent'];
  const saved = new Map(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const handlers = new Map();
  const location = { href: 'https://example.test/#/home', hash: '#/home' };
  const update = url => { location.hash = url; location.href = `https://example.test/${url}`; };
  globalThis.location = location;
  globalThis.history = { pushState: (_state, _title, url) => update(url) };
  globalThis.CustomEvent = class { constructor(type, options) { this.type = type; this.detail = options.detail; } };
  globalThis.window = {
    addEventListener(type, fn) { handlers.set(type, fn); },
    dispatchEvent(event) { handlers.get(event.type)?.(event); }
  };
  try {
    const inherited = ['home', 'reader', 'assignments', 'calendar', 'learn', 'grow'];
    const added = ['library', 'library-item', 'one-to-one'];
    const resolved = [];
    const routes = Object.fromEntries([...inherited, ...added, 'not-found'].map(key => [key, () => {}]));
    const router = createRouter({ routes, onRoute: (route, _page, requested) => resolved.push({ route, requested }) });
    router.start();
    requestNavigation('library?query=faith%20%26%20hope&contentType=book&taxonomyId=topic%2Fhope');
    assert.equal(router.current(), 'library');
    const params = new URLSearchParams(location.hash.split('?')[1]);
    assert.equal(params.get('query'), 'faith & hope');
    assert.equal(params.get('taxonomyId'), 'topic/hope');
    const count = resolved.length;
    handlers.get('popstate')();
    handlers.get('hashchange')();
    assert.equal(resolved.length, count, 'duplicate history events must not remount the current page');
    for (const route of [...added, ...inherited]) {
      requestNavigation(route);
      assert.equal(resolved.at(-1).route, route);
    }
    update('#/library-item?id=item%2F1');
    handlers.get('popstate')();
    assert.equal(resolved.at(-1).route, 'library-item');
    assert.equal(new URLSearchParams(location.hash.split('?')[1]).get('id'), 'item/1');
    requestNavigation('unknown-route');
    assert.deepEqual(resolved.at(-1), { route: 'not-found', requested: 'unknown-route' });
    const beforeInvalid = resolved.length;
    window.dispatchEvent({ type: 'bq:navigation-request', detail: { route: 42 } });
    assert.equal(resolved.length, beforeInvalid);
  } finally {
    for (const [key, descriptor] of saved) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});

test('every registered V7 label resolves in supported locales with explicit missing-translation inventory', () => {
  const keys = localization.keyInventory.filter(key => key.startsWith('v7.'));
  assert.ok(keys.length > 0);
  assert.deepEqual(getMissingLocaleKeys('en'), []);
  for (const locale of localization.supportedLocales) {
    const missing = new Set(getMissingLocaleKeys(locale));
    for (const key of keys) {
      const rendered = t(key, { locale });
      assert.ok(rendered.trim(), `${locale}: ${key} must not be blank`);
      assert.notEqual(rendered, key, `${locale}: ${key} must not leak a raw key`);
      if (missing.has(key)) assert.equal(rendered, t(key, { locale: 'en' }), `${locale}: ${key} must use English fallback`);
    }
  }
});
