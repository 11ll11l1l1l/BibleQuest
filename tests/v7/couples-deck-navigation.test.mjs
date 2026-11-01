import test from 'node:test';
import assert from 'node:assert/strict';
import { couplesFamilyPage } from '../../src/features/couples-family/index.js';
import { createCouplesFamilyService } from '../../src/app/couples-family.js';
import { localization } from '../../src/app/localization.js';

// Controller harness: exercises rendered controls with the real local service;
// browser layout/device acceptance remains separate.
function setup(existing = new Map()) {
  const storage = { read: (key, fallback) => structuredClone(existing.get(key) ?? fallback), write: (key, value) => { existing.set(key, structuredClone(value)); return value; } };
  const couples = createCouplesFamilyService({ storage, rng: () => 0 });
  let html = '', buttons = [], reader;
  const parse = markup => [...markup.matchAll(/<button\b([^>]*)>/g)].map(match => {
    const attrs = Object.fromEntries([...match[1].matchAll(/(data-[\w-]+)="([^"]*)"|(data-[\w-]+)(?=[\s>]|$)/g)].map(row => [row[1] || row[3], row[2] || '']));
    const events = new Map();
    return { attrs, dataset: Object.fromEntries(Object.entries(attrs).map(([key, value]) => [key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value])), addEventListener: (name, fn) => events.set(name, fn), click: () => events.get('click')?.() };
  });
  const matches = (button, selector) => {
    const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    return match && Object.hasOwn(button.attrs, match[1]) && (match[2] === undefined || button.attrs[match[1]] === match[2]);
  };
  const view = {
    set innerHTML(value) { html = value; buttons = parse(value); }, get innerHTML() { return html; },
    querySelectorAll: selector => buttons.filter(button => matches(button, selector)),
    querySelector: selector => selector === '.bq-couples-hero' ? { insertAdjacentHTML: (_, value) => { html += value; buttons.push(...parse(value)); } } : buttons.find(button => matches(button, selector)),
  };
  const dispose = couplesFamilyPage({ couples, onReader: card => { reader = card; } }).mount({ querySelector: () => view });
  const click = selector => { const node = view.querySelector(selector); assert.ok(node, selector); node.click(); };
  const current = () => html.match(/data-couples-card-id="([^"]+)"/)?.[1];
  return { couples, existing, click, current, dispose, html: () => html, reader: () => reader };
}

test('category stays selected after save, another card and discussed; Reader gets the current card', () => {
  const page = setup();
  page.click('[data-couples-category="communication"]');
  for (const action of ['[data-couples-favorite]', '[data-couples-next]', '[data-couples-discussed]']) {
    page.click(action);
    assert.equal(page.couples.getCard(page.current()).cat, 'communication');
  }
  assert.equal(page.couples.snapshot().history.length, 1);
  page.click('[data-couples-reader]');
  assert.equal(page.reader().id, page.current());
});

test('family track and both themed decks retain their category pools', () => {
  for (const [selector, categories] of [
    ['[data-couples-track="family"]', ['family','christ','stewardship','gratitude']],
    ['[data-couples-mode="god"]', ['christ','mission']],
    ['[data-couples-mode="date"]', ['gratitude','intimacy','mission']],
  ]) {
    const page = setup(); page.click(selector);
    for (let count=0;count<20;count++) { page.click('[data-couples-discussed]'); assert.ok(categories.includes(page.couples.getCard(page.current()).cat)); }
  }
});

test('saved view handles empty, reopen after reload, saved-only cycling and removal', () => {
  const page = setup(); page.click('[data-couples-mode="saved"]');
  assert.match(page.html(), /No saved cards yet/);
  page.couples.toggleFavorite('c05'); page.couples.toggleFavorite('c17');
  const reload = setup(page.existing);
  reload.click('[data-couples-mode="saved"]');
  reload.click('[data-couples-saved-card="c05"]');
  reload.click('[data-couples-next]'); assert.equal(reload.current(), 'c17');
  reload.click('[data-couples-discussed]'); assert.equal(reload.current(), 'c05');
  reload.click('[data-couples-favorite]'); assert.equal(reload.current(), undefined);
  assert.doesNotMatch(reload.html(), /data-couples-saved-card="c05"/);
  reload.click('[data-couples-saved-card="c17"]');
  reload.click('[data-couples-reader]'); assert.equal(reload.reader().id, 'c17');
  reload.click('[data-couples-favorite]'); assert.match(reload.html(), /No saved cards yet/);
  assert.deepEqual(reload.couples.snapshot().favorites, []);
  assert.equal(page.existing.size, 1, 'reuse the single local state owner');
});

test('saved labels render in Tagalog and Cebuano without altering the card source', () => {
  const previousStorage = globalThis.localStorage;
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  try {
    for (const [locale, title] of [['tl','Mga naka-save na card'],['ceb','Mga gi-save nga card']]) {
      localization.setLocale(locale);
      const page = setup(); page.couples.toggleFavorite('c05');
      page.click('[data-couples-mode="saved"]'); assert.ok(page.html().includes(title));
      page.click('[data-couples-saved-card="c05"]'); assert.ok(page.html().includes(page.couples.getCard('c05').prompt));
    }
  } finally { localization.setLocale('en'); globalThis.localStorage = previousStorage; }
});
