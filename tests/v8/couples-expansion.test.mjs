import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COUPLES_CARDS, COUPLES_CATEGORIES} from '../../src/content/couples-family.js';
import {createCouplesFamilyService} from '../../src/app/couples-family.js';
import {BIBLE_BOOKS} from '../../src/core/bible.js';

const memory = () => {
  const data = new Map();
  return { read: (key, fallback) => structuredClone(data.get(key) ?? fallback), write: (key, value) => { data.set(key, structuredClone(value)); return structuredClone(value); } };
};

test('every expanded card is reachable without repeating a discussed card in its category', () => {
  assert.equal(COUPLES_CARDS.length, 80);
  assert.equal(new Set(COUPLES_CARDS.map(card => card.prompt.trim().toLowerCase())).size, 80);
  for (const category of COUPLES_CATEGORIES) {
    const service = createCouplesFamilyService({storage: memory(), rng: () => 0});
    const ids = new Set();
    for (let i = 0; i < 10; i++) {
      const card = service.pickCard({categoryId: category.id});
      assert.equal(card.cat, category.id);
      assert.equal(ids.has(card.id), false);
      ids.add(card.id);
      service.markDiscussed(card.id);
    }
    assert.deepEqual(ids, new Set(COUPLES_CARDS.filter(card => card.cat === category.id).map(card => card.id)));
  }
});

test('all 80 displayed references agree with Reader handoff; existing source coverage gap stays explicit', () => {
  const missing = new Set();
  for (const card of COUPLES_CARDS) {
    const match = card.ref.match(/^(.+) (\d+):(\d+)(?:[–-](\d+))?$/);
    assert.ok(match, card.id);
    const [, name, chapter, first, last = first] = match;
    const book = BIBLE_BOOKS.find(book => book.code === card.code);
    assert.equal(name === 'Psalm' ? 'Psalms' : name, book?.name, card.id);
    assert.equal(Number(chapter), card.chapter, card.id);
    const verses = JSON.parse(readFileSync(`data/packs/bible/${card.code}.json`, 'utf8'));
    for (let verse = Number(first); verse <= Number(last); verse++) {
      if (!verses.some(row => row.c === card.chapter && row.v === verse && row.t.trim())) missing.add(`${card.id}:${card.code}:${card.chapter}:${verse}`);
    }
  }
  assert.deepEqual(missing, new Set(['c29:PSA:127:1', 'c49:PSA:127:1']), 'No additional missing source text is allowed; existing gap is NOT an availability PASS.');
});

test('new card favorites, history and practice survive reload through the existing local owner', () => {
  const storage = memory();
  const service = createCouplesFamilyService({storage});
  for (const card of COUPLES_CARDS.slice(64)) {
    service.toggleFavorite(card.id);
    service.markDiscussed(card.id);
  }
  service.startPractice('c75');
  const reload = createCouplesFamilyService({storage});
  assert.equal(reload.snapshot().favorites.length, 16);
  assert.equal(reload.snapshot().history.length, 16);
  assert.equal(reload.activePractice().cardId, 'c75');
  assert.match(reload.activePractice().text, /no touch is required/);
});
