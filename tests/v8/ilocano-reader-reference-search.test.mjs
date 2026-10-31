import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BIBLE_BOOKS, createBibleDataService, parseBibleReference } from '../../src/core/bible.js';
import { ILOCANO_BOOK_TITLES } from '../../src/core/ilocano-book-titles.js';

test('all official Ilocano book titles resolve to canonical Bible reference codes', () => {
  assert.equal(BIBLE_BOOKS.length, 66);
  for (const book of BIBLE_BOOKS) {
    const title = ILOCANO_BOOK_TITLES[book.code];
    assert.ok(title, `Missing source label for ${book.code}`);
    const result = parseBibleReference(`${title} 1:1`);
    assert.equal(result?.book.code, book.code, `${title} must resolve to ${book.code}`);
    assert.equal(result.chapter, 1);
    assert.equal(result.verseStart, 1);
  }
  assert.equal(parseBibleReference('Juan 3:16')?.book.code, 'JHN');
  assert.equal(parseBibleReference('Dagiti Salmo 23:1')?.book.code, 'PSA');
  assert.equal(parseBibleReference('I Samuel 1:1')?.book.code, '1SA');
  assert.equal(parseBibleReference('II Samuel 1:1')?.book.code, '2SA');
  assert.equal(parseBibleReference('1 taga-Corinto 13:4')?.book.code, '1CO');
  assert.equal(parseBibleReference('Paltiing 21:4')?.book.code, 'REV');
});

test('validated Ilocano aliases preserve English references and enforce existing bounds', () => {
  const english = parseBibleReference('John 3:16');
  const ilocano = parseBibleReference('Juan 3:16');
  assert.deepEqual(ilocano, english);
  assert.equal(parseBibleReference('Juan 22:1'), null);
  assert.equal(parseBibleReference('Juan 3:0'), null);
  assert.equal(parseBibleReference('Dagiti Salmo 151:1'), null);
  assert.equal(parseBibleReference('Paltiing 1:10-3'), null);
  assert.equal(parseBibleReference('__proto__ 1:1'), null);
  assert.equal(parseBibleReference('Juan 3:16<script>'), null);
});

test('real Ilocano reference search returns source verse text via the existing content provider', async () => {
  const pack = JSON.parse(await readFile(new URL('../../data/packs/ilocano/JHN.json', import.meta.url), 'utf8'));
  const source = pack.find(row => row.c === 3 && row.v === 16);
  assert.ok(source && typeof source.t === 'string');
  const requested = [];
  const bible = createBibleDataService({
    fetcher: async path => {
      requested.push(path);
      assert.match(path, /ilocano\/JHN\.json$/);
      return {ok: true, json: async () => pack};
    },
    packStore: { read: async () => null, write: async () => false },
  });
  const result = await bible.search('ilo', 'Juan 3:16', { limit: 4 });
  assert.equal(result.type, 'reference');
  assert.equal(result.results.length, 1);
  assert.equal(result.results[0].book.code, 'JHN');
  assert.equal(result.results[0].text, source.t);
  assert.equal(result.results[0].reference, 'John 3:16', 'canonical references remain stable');
  assert.equal(requested.length, 1, 'reference search must not scan all 66 packs');
});
