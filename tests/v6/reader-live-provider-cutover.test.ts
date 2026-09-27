import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { createReaderService } from '../../src/app/reader.js';

const book = Object.freeze({ code: 'JHN', name: 'John', chapters: 21, index: 0 });
const translation = Object.freeze({
  id: 'bsb',
  label: 'English · BSB',
  bundled: true,
  mode: 'bundled',
  source: 'fixture',
  license: 'fixture',
  attribution: 'fixture',
});

function harness() {
  const providerCalls: unknown[] = [];
  let stored = { translation: 'bsb', book: 'JHN', chapter: 3, read: {} };

  const bible = {
    books: [book],
    translations: [translation],
    getBook(code: string) {
      if (code !== 'JHN') throw new Error('unknown book');
      return book;
    },
    getTranslation(id: string) {
      if (id !== 'bsb') throw new Error('unknown translation');
      return translation;
    },
    loadChapter() { throw new Error('raw Bible loadChapter must not own live Reader content'); },
    search() { throw new Error('raw Bible search must not own live Reader content'); },
    lexicalContext() { throw new Error('raw Bible lexicalContext must not own live Reader content'); },
    externalLinks(code: string, chapter: number, verse?: number) {
      return [{ id: 'step', label: 'STEP', href: `https://example.test/${code}/${chapter}/${verse ?? ''}` }];
    },
  };

  const scriptureProvider = {
    async loadChapter(location: { translationId: string; bookCode: string; chapter: number }) {
      providerCalls.push(['loadChapter', location]);
      return {
        translationId: location.translationId,
        book,
        chapter: location.chapter,
        verses: [{ chapter: location.chapter, verse: 16, text: 'fixture Scripture' }],
      };
    },
    async search(translationId: string, query: string, limit?: number) {
      providerCalls.push(['search', translationId, query, limit]);
      return {
        query,
        type: 'text',
        results: [{
          book,
          chapter: 3,
          verse: 16,
          text: 'fixture Scripture',
          reference: 'John 3:16',
        }],
        skippedBooks: [],
      };
    },
    async loadContext(location: { translationId: string; bookCode: string; chapter: number; verse: number }) {
      providerCalls.push(['loadContext', location]);
      return {
        available: false,
        reason: 'fixture unavailable',
        book,
        chapter: location.chapter,
        verse: location.verse,
        reference: 'John 3:16',
        scripture: { chapter: location.chapter, verse: location.verse, text: 'fixture Scripture' },
        previous: null,
        next: null,
        entries: [],
        source: 'fixture',
        license: 'fixture',
        note: 'fixture',
        external: [],
      };
    },
  };

  const storage = {
    read() { return stored; },
    write(_key: string, value: typeof stored) { stored = value; },
  };
  const progress = {
    getState() { return { events: {} }; },
    record() { throw new Error('not expected'); },
  };

  return {
    reader: createReaderService({ bible, storage, progress, scriptureProvider }),
    providerCalls,
  };
}

test('live Reader chapter content loads only through ScriptureContentProvider', async () => {
  const { reader, providerCalls } = harness();
  const chapter = await reader.load();

  assert.equal(chapter.translation.id, 'bsb');
  assert.equal(chapter.translationId, 'bsb');
  assert.equal(chapter.book.code, 'JHN');
  assert.deepEqual(providerCalls, [[
    'loadChapter',
    { translationId: 'bsb', bookCode: 'JHN', chapter: 3 },
  ]]);
});

test('live Reader Search and Verse Peek stay behind the provider content seam', async () => {
  const { reader, providerCalls } = harness();

  const search = await reader.search('love', { limit: 12 });
  assert.equal(search.results[0]?.reference, 'John 3:16');

  const peek = await reader.peek(16);
  assert.equal(peek.text, 'fixture Scripture');

  assert.deepEqual(providerCalls.slice(0, 2), [
    ['search', 'bsb', 'love', 12],
    ['loadChapter', { translationId: 'bsb', bookCode: 'JHN', chapter: 3 }],
  ]);
});

test('Context Lab chapter and lexical reads use the provider rather than raw Bible transport', async () => {
  const { reader, providerCalls } = harness();

  const chapter = await reader.contextChapter('JHN', 3);
  assert.equal(chapter.translation.id, 'bsb');

  const context = await reader.lexicalContext({ code: 'JHN', chapter: 3, verse: 16 });
  assert.equal(context.reason, 'fixture unavailable');

  assert.deepEqual(providerCalls, [
    ['loadChapter', { translationId: 'bsb', bookCode: 'JHN', chapter: 3 }],
    ['loadContext', { translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16 }],
  ]);
});

test('Reader service source no longer performs raw Bible Scripture content reads', () => {
  const source = readFileSync(new URL('../../src/app/reader.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /await bible\.loadChapter/);
  assert.doesNotMatch(source, /await bible\.search/);
  assert.doesNotMatch(source, /return bible\.lexicalContext/);
  assert.match(source, /createLegacyBibleScriptureProvider/);
  assert.match(source, /scripture\.loadChapter/);
  assert.match(source, /scripture\.search/);
  assert.match(source, /scripture\.loadContext/);
});
