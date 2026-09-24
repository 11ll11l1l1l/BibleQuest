import assert from 'node:assert/strict';
import test from 'node:test';

import { createReaderService } from '../../src/app/reader.js';

const book = Object.freeze({ code: 'JHN', name: 'John', chapters: 21, index: 0 });

function createHarness(chapterFactory: () => unknown) {
  const externalCalls: unknown[] = [];
  let stored = {
    translation: 'bsb',
    book: 'JHN',
    chapter: 3,
    read: {},
  };

  const bible = {
    books: [book],
    translations: [
      Object.freeze({
        id: 'bsb',
        label: 'BSB',
        bundled: true,
        mode: 'bundled',
      }),
    ],
    getBook(code: string) {
      if (code !== 'JHN') throw new Error('unknown book');
      return book;
    },
    getTranslation(id: string) {
      if (id !== 'bsb') throw new Error('unknown translation');
      return this.translations[0];
    },
    async loadChapter() {
      return chapterFactory();
    },
    externalLinks(code: string, chapter: number, verse: number) {
      externalCalls.push([code, chapter, verse]);
      return Object.freeze([{ id: 'step', label: 'STEP', href: 'https://example.test/' }]);
    },
  };

  const storage = {
    read() {
      return stored;
    },
    write(_key: string, value: typeof stored) {
      stored = value;
    },
  };

  const progress = {
    getState() {
      return { events: {} };
    },
    record() {
      throw new Error('not expected');
    },
  };

  return {
    reader: createReaderService({ bible, storage, progress }),
    externalCalls,
  };
}

test('live Reader Verse Peek uses the V6 projection and rejects verse rows from another chapter', async () => {
  const { reader, externalCalls } = createHarness(() => ({
    book,
    chapter: 3,
    translation: { id: 'bsb' },
    verses: [{ chapter: 4, verse: 16, text: 'wrong chapter fixture' }],
  }));

  await assert.rejects(reader.peek(16), /Verse is unavailable/);
  assert.deepEqual(externalCalls, []);
});

test('live Reader Verse Peek rejects a provider response for a different translation', async () => {
  const { reader, externalCalls } = createHarness(() => ({
    book,
    chapter: 3,
    translation: { id: 'tl' },
    verses: [{ chapter: 3, verse: 16, text: 'wrong translation fixture' }],
  }));

  await assert.rejects(reader.peek(16), /does not match the selected translation/);
  assert.deepEqual(externalCalls, []);
});

test('live Reader Verse Peek preserves the existing public result shape for valid grouped verses', async () => {
  const { reader, externalCalls } = createHarness(() => ({
    book,
    chapter: 3,
    translation: { id: 'bsb' },
    verses: [
      { chapter: 3, verse: 15, text: 'fixture fifteen' },
      { chapter: 3, verse: 16, verseEnd: 17, text: 'fixture sixteen through seventeen' },
    ],
  }));

  const peek = await reader.peek(17);
  assert.equal(peek.chapter, 3);
  assert.equal(peek.verse, 16);
  assert.equal(peek.verseEnd, 17);
  assert.equal(peek.text, 'fixture sixteen through seventeen');
  assert.equal(peek.reference, 'John 3:16-17');
  assert.equal(Array.isArray(peek.links), true);
  assert.deepEqual(externalCalls, [['JHN', 3, 17]]);
});
