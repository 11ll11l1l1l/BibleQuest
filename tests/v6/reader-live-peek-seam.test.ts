import assert from 'node:assert/strict';
import test from 'node:test';

import { createReaderService } from '../../src/app/reader.js';

const book = Object.freeze({ code: 'JHN', name: 'John', chapters: 21, index: 0 });

function createHarness(
  chapterFactory: () => unknown,
  searchFactory: (translationId: string, query: string, options?: unknown) => unknown = () => ({
    query: 'fixture',
    type: 'text',
    results: [],
    skippedBooks: [],
  }),
) {
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
      Object.freeze({
        id: 'tl',
        label: 'Tagalog',
        bundled: true,
        mode: 'bundled',
      }),
    ],
    getBook(code: string) {
      if (code !== 'JHN') throw new Error('unknown book');
      return book;
    },
    getTranslation(id: string) {
      const translation = this.translations.find((item) => item.id === id);
      if (!translation) throw new Error('unknown translation');
      return translation;
    },
    async loadChapter() {
      return chapterFactory();
    },
    async search(translationId: string, query: string, options?: unknown) {
      return searchFactory(translationId, query, options);
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

  await assert.rejects(reader.peek(16), /does not match the requested Reader passage/);
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


test('search-result navigation does not persist a target chapter until the requested verse is proven present', async () => {
  const { reader } = createHarness(() => ({
    book,
    chapter: 4,
    translation: { id: 'bsb' },
    verses: [{ chapter: 4, verse: 1, text: 'fixture one' }],
  }));

  assert.equal(reader.getState().chapter, 3);
  await assert.rejects(
    reader.openSearchResult({ book: { code: 'JHN' }, chapter: 4, verse: 16 }),
    /Search result verse is unavailable/,
  );
  assert.equal(reader.getState().chapter, 3);
});

test('search-result navigation persists only after exact translation and verse validation succeeds', async () => {
  const { reader } = createHarness(() => ({
    book,
    chapter: 4,
    translation: { id: 'bsb' },
    verses: [
      { chapter: 4, verse: 15, text: 'fixture fifteen' },
      { chapter: 4, verse: 16, text: 'fixture sixteen' },
    ],
  }));

  const opened = await reader.openSearchResult({ book: { code: 'JHN' }, chapter: 4, verse: 16 });
  assert.equal(opened.verse, 16);
  assert.equal(opened.chapter.chapter, 4);
  assert.equal(reader.getState().chapter, 4);
});

test('search-result navigation rejects cross-translation content without mutating Reader state', async () => {
  const { reader } = createHarness(() => ({
    book,
    chapter: 4,
    translation: { id: 'tl' },
    verses: [{ chapter: 4, verse: 16, text: 'wrong translation fixture' }],
  }));

  await assert.rejects(
    reader.openSearchResult({ book: { code: 'JHN' }, chapter: 4, verse: 16 }),
    /does not match the selected translation/,
  );
  assert.equal(reader.getState().chapter, 3);
});


test('Reader load rejects a provider response for the wrong book without changing state', async () => {
  const { reader } = createHarness(() => ({
    book: { code: 'GEN', name: 'Genesis', chapters: 50, index: 0 },
    chapter: 3,
    translation: { id: 'bsb' },
    verses: [{ chapter: 3, verse: 1, text: 'wrong book fixture' }],
  }));

  await assert.rejects(reader.load(), /does not match the requested Reader passage/);
  assert.deepEqual(reader.getState(), {
    translation: 'bsb',
    book: 'JHN',
    chapter: 3,
    read: {},
  });
});

test('Reader load rejects a late response after the passage changes', async () => {
  let resolveChapter: ((value: unknown) => void) | undefined;
  const gate = new Promise<unknown>((resolve) => {
    resolveChapter = resolve;
  });
  const { reader } = createHarness(() => gate);

  const pending = reader.load();
  reader.setChapter(4);
  resolveChapter?.({
    book,
    chapter: 3,
    translation: { id: 'bsb' },
    verses: [{ chapter: 3, verse: 16, text: 'late fixture' }],
  });

  await assert.rejects(pending, /passage changed while Scripture was loading/);
  assert.equal(reader.getState().chapter, 4);
});

test('Reader search rejects a late result after the selected translation changes', async () => {
  let resolveSearch: ((value: unknown) => void) | undefined;
  const gate = new Promise<unknown>((resolve) => {
    resolveSearch = resolve;
  });
  const { reader } = createHarness(
    () => ({
      book,
      chapter: 3,
      translation: { id: 'bsb' },
      verses: [{ chapter: 3, verse: 16, text: 'fixture' }],
    }),
    () => gate,
  );

  const pending = reader.search('love', { limit: 10 });
  reader.setTranslation('tl');
  resolveSearch?.({
    query: 'love',
    type: 'text',
    results: [],
    skippedBooks: [],
  });

  await assert.rejects(pending, /translation changed while Scripture search was running/);
  assert.equal(reader.getState().translation, 'tl');
});
