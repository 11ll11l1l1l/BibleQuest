import test from 'node:test';
import assert from 'node:assert/strict';
import { readerPage } from '../../src/features/reader/index.js';

// Exercise the actual route mount and delegated actions without a browser claim.
test('Ilocano controls require opt-in, survive chapter navigation, and never modify Scripture', async () => {
  const oldElement = globalThis.Element;
  const oldForm = globalThis.HTMLFormElement, oldFormData = globalThis.FormData;
  const submitButton = { disabled: false, textContent: '' };
  class Form { matches(selector) { return selector === '[data-reader-search]'; } querySelector() { return submitButton; } }
  globalThis.HTMLFormElement = Form;
  globalThis.FormData = class { get() { return 'public query'; } };
  class Target { constructor(selector) { this.selector = selector; } closest(selector) { return selector.split(', ').includes(this.selector) ? this : null; } }
  globalThis.Element = Target;
  const events = {};
  const host = { innerHTML: '', querySelector: () => null, querySelectorAll: () => [], addEventListener: (name, fn) => { events[name] = fn; }, removeEventListener: () => {} };
  const state = { translation: 'ilo', book: 'JHN', chapter: 1 };
  const book = { code: 'JHN', name: 'John', chapters: 21 };
  const text = 'Ti Sao <source> & teksto';
  let empty = false;
  const reader = {
    books: [book], translations: [{ id: 'ilo', label: 'Ilocano' }],
    getState: () => ({ ...state }), externalLinks: () => [], isRead: () => false,
    load: async () => ({ book, chapter: state.chapter, translation: { label: 'Ilocano', source: 'Provider', license: 'CC BY-SA', attribution: 'Source attribution' }, verses: [{ chapter: state.chapter, verse: 1, text }] }),
    move: n => { state.chapter += n; },
    markRead: () => ({ newlyRead: true, progress: { awardedXp: 5 } }),
    search: async () => ({ results: empty ? [] : [{ book, chapter: state.chapter, verse: 1, text, reference: 'John 1:1' }], skippedBooks: ['GEN'] }),
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
    assert.match(host.innerHTML, /Markaan a nabasa/);
    const mark = new Target('[data-reader-mark]');
    await events.click({ target: mark });
    assert.equal(mark.textContent, 'Namarkaan a nabasa');
    assert.equal(mark.disabled, true);
    await events.submit({ target: new Form(), preventDefault() {} });
    assert.match(host.innerHTML, /Dagiti resulta ti panagbiruk/);
    assert.match(host.innerHTML, /1 ti naipakita/);
    assert.match(host.innerHTML, /1 a pakete ti libro/);
    assert.match(host.innerHTML, /Ti Sao &lt;source&gt; &amp; teksto/);
    empty = true;
    await events.submit({ target: new Form(), preventDefault() {} });
    assert.match(host.innerHTML, /Awan ti nasarakan/);
    await events.click({ target: new Target('[data-reader-next]') });
    await settle();
    assert.equal(state.chapter, 2);
    assert.match(host.innerHTML, /Agbiruk iti daytoy a patarus/);
    await events.click({ target: new Target('[data-reader-interface-toggle]') });
    assert.match(host.innerHTML, /Search this translation/);
    assert.doesNotMatch(host.innerHTML, /Agbiruk iti daytoy a patarus/);
  } finally { cleanup?.(); globalThis.Element = oldElement; globalThis.HTMLFormElement = oldForm; globalThis.FormData = oldFormData; }
});
