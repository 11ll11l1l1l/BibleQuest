import test from 'node:test';
import assert from 'node:assert/strict';
import { readerPage } from '../../src/features/reader/index.js';

// Exercise the actual route mount and delegated actions without a browser claim.
test('Ilocano controls require opt-in, survive chapter navigation, and never modify Scripture', async () => {
  const oldElement = globalThis.Element;
  class Target { constructor(selector) { this.selector = selector; } closest(selector) { return selector.split(', ').includes(this.selector) ? this : null; } }
  globalThis.Element = Target;
  const events = {};
  const host = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], addEventListener: (name, fn) => { events[name] = fn; }, removeEventListener: () => {} };
  const state = { translation: 'ilo', book: 'JHN', chapter: 1 };
  const book = { code: 'JHN', name: 'John', chapters: 21 };
  const text = 'Ti Sao <source> & teksto';
  const reader = {
    books: [book], translations: [{ id: 'ilo', label: 'Ilocano' }],
    getState: () => ({ ...state }), externalLinks: () => [], isRead: () => false,
    load: async () => ({ book, chapter: state.chapter, translation: { label: 'Ilocano', source: 'Provider', license: 'CC BY-SA', attribution: 'Source attribution' }, verses: [{ chapter: state.chapter, verse: 1, text }] }),
    move: n => { state.chapter += n; },
  };
  let cleanup;
  const settle = () => new Promise(resolve => setImmediate(resolve));
  try {
    cleanup = readerPage({ reader }).mount({ querySelector: selector => selector === '[data-reader-page]' ? host : null });
    await settle();
    assert.match(host.innerHTML, /Search this translation/);
    await events.click({ target: new Target('[data-reader-interface-toggle]') });
    assert.match(host.innerHTML, /Agbiruk iti daytoy a patarus/);
    assert.match(host.innerHTML, /Ti Sao &lt;source&gt; &amp; teksto/);
    assert.match(host.innerHTML, /Source attribution/);
    await events.click({ target: new Target('[data-reader-next]') });
    await settle();
    assert.equal(state.chapter, 2);
    assert.match(host.innerHTML, /Agbiruk iti daytoy a patarus/);
    await events.click({ target: new Target('[data-reader-interface-toggle]') });
    assert.match(host.innerHTML, /Search this translation/);
    assert.doesNotMatch(host.innerHTML, /Agbiruk iti daytoy a patarus/);
  } finally { cleanup?.(); globalThis.Element = oldElement; }
});
