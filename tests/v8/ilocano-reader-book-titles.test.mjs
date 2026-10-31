import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BIBLE_BOOKS } from '../../src/core/bible.js';
import { ILOCANO_BOOK_TITLES, ilocanoReaderBookName, ilocanoReaderBookOptions } from '../../src/features/reader/ilocano-book-titles.js';

test('Ilocano Bible book names cover every canonical book in source order without substitutions', () => {
  const codes = BIBLE_BOOKS.map(book => book.code);
  assert.equal(codes.length, 66);
  assert.deepEqual(Object.keys(ILOCANO_BOOK_TITLES).sort(), [...codes].sort());
  for (const code of codes) assert.ok(typeof ilocanoReaderBookName(code) === 'string' && ilocanoReaderBookName(code).trim());
  assert.equal(ilocanoReaderBookName('PSA'), 'Dagiti Salmo');
  assert.equal(ilocanoReaderBookName('JDG'), 'Uk-ukom');
  assert.equal(ilocanoReaderBookName('MAT'), 'Mateo');
  assert.equal(ilocanoReaderBookName('JHN'), 'Juan');
  assert.equal(ilocanoReaderBookName('ACT'), 'Dagiti Aramid');
  assert.equal(ilocanoReaderBookName('REV'), 'Paltiing');
});

test('Ilocano book labels never change canonical identity, saved references, or shared metadata', () => {
  const original = BIBLE_BOOKS.map(book => ({ ...book }));
  const copy = ilocanoReaderBookOptions(BIBLE_BOOKS);
  assert.equal(copy.length, 66);
  for (let i = 0; i < copy.length; i++) {
    assert.equal(copy[i].displayName, ILOCANO_BOOK_TITLES[BIBLE_BOOKS[i].code]);
    assert.equal(copy[i].name, BIBLE_BOOKS[i].name);
    assert.equal(copy[i].code, BIBLE_BOOKS[i].code);
    assert.equal(copy[i].chapters, BIBLE_BOOKS[i].chapters);
    assert.equal(copy[i].index, BIBLE_BOOKS[i].index);
    assert.notEqual(copy[i], BIBLE_BOOKS[i]);
  }
  assert.deepEqual(BIBLE_BOOKS.map(book => ({ ...book })), original);
  assert.equal(ilocanoReaderBookName('UNKNOWN', 'Unknown'), 'Unknown');
  assert.equal(ilocanoReaderBookName('__proto__', 'Unrecognized book'), 'Unrecognized book');
});

test('Reader shows source-language names only for selected Ilocano translation, not its shared chapter model', async () => {
  const page = await readFile(new URL('../../src/features/reader/index.js', import.meta.url), 'utf8');
  assert.match(page, /state\.translation === 'ilo'/);
  assert.match(page, /ilocanoReaderBookOptions\(reader\.books\)/);
  assert.match(page, /ilocanoReaderBookName\(chapter\.book\.code, chapter\.book\.name\)/);
  assert.match(page, /readerChapterHeading\(\{ name: bookLabel \}, chapter\.chapter\)/);
  assert.match(page, /renderReaderChapterPresentation\(displayedPresentation/);
  assert.match(page, /options\(bookChoices, state\.book, 'code', ilocano \? 'displayName' : 'name'\)/);
  assert.match(page, /reader\.setBook\(target\.value, 1\)/);
});
