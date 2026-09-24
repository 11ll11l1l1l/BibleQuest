import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createLegacyBibleScriptureProvider,
  type LegacyBibleDataService,
  type ReaderContext,
  type ReaderSearchResult,
} from '../../src/v6/reader/index.ts';

const book = { code: 'JHN', name: 'John', chapters: 21 } as const;

function context(): ReaderContext {
  return {
    available: true,
    reason: '',
    book,
    chapter: 3,
    verse: 16,
    reference: 'John 3:16',
    scripture: { chapter: 3, verse: 16, text: 'fixture Scripture' },
    previous: null,
    next: null,
    entries: [],
    source: 'fixture',
    license: 'fixture',
    note: '',
    external: [],
  };
}

test('legacy provider preserves exact EN/TL/JA chapter delegation and legacy metadata', async () => {
  for (const translationId of ['bsb', 'tl', 'jko'] as const) {
    const calls: unknown[] = [];
    const bible: LegacyBibleDataService = {
      async loadChapter(id, code, chapter) {
        calls.push(['loadChapter', id, code, chapter]);
        return {
          book,
          chapter,
          translation: { id, label: `fixture-${id}`, mode: 'fixture' },
          verses: [{ chapter, verse: 16, text: `fixture-${id}` }],
          legacyMarker: 'preserved',
        };
      },
      async search() { throw new Error('not expected'); },
      async lexicalContext() { throw new Error('not expected'); },
    };
    const provider = createLegacyBibleScriptureProvider(bible);
    const loaded = await provider.loadChapter({ translationId, bookCode: 'JHN', chapter: 3 });

    assert.deepEqual(calls, [['loadChapter', translationId, 'JHN', 3]]);
    assert.equal(loaded.translationId, translationId);
    assert.equal((loaded as typeof loaded & { translation: { id: string } }).translation.id, translationId);
    assert.equal((loaded as typeof loaded & { legacyMarker: string }).legacyMarker, 'preserved');
    assert.equal(loaded.verses[0]?.text, `fixture-${translationId}`);
  }
});

test('legacy provider maps repository search limit to the existing Bible service options object', async () => {
  const calls: unknown[] = [];
  const expected: ReaderSearchResult = {
    query: 'John 3:16',
    type: 'reference',
    results: [{
      book,
      chapter: 3,
      verse: 16,
      text: 'fixture Scripture',
      reference: 'John 3:16',
    }],
    skippedBooks: [],
  };
  const bible: LegacyBibleDataService = {
    async loadChapter() { throw new Error('not expected'); },
    async search(id, query, options) {
      calls.push(['search', id, query, options]);
      return expected;
    },
    async lexicalContext() { throw new Error('not expected'); },
  };
  const provider = createLegacyBibleScriptureProvider(bible);

  assert.equal(await provider.search('tl', 'John 3:16', 25), expected);
  assert.deepEqual(calls, [['search', 'tl', 'John 3:16', { limit: 25 }]]);
});

test('legacy provider delegates Context Lab only when the caller explicitly requests its BSB Scripture source', async () => {
  const calls: unknown[] = [];
  const expected = context();
  const bible: LegacyBibleDataService = {
    async loadChapter() { throw new Error('not expected'); },
    async search() { throw new Error('not expected'); },
    async lexicalContext(code, chapter, verse) {
      calls.push(['lexicalContext', code, chapter, verse]);
      return expected;
    },
  };
  const provider = createLegacyBibleScriptureProvider(bible);

  assert.equal(
    await provider.loadContext({ translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16 }),
    expected,
  );
  assert.deepEqual(calls, [['lexicalContext', 'JHN', 3, 16]]);

  await assert.rejects(
    provider.loadContext({ translationId: 'jko', bookCode: 'JHN', chapter: 3, verse: 16 }),
    /Context Lab Scripture is BSB-only/,
  );
  assert.deepEqual(calls, [['lexicalContext', 'JHN', 3, 16]]);
});

test('legacy provider does not rewrite existing Bible service failure messages', async () => {
  const bible: LegacyBibleDataService = {
    async loadChapter() { throw new Error('Japanese live source unavailable'); },
    async search() { throw new Error('Search by Bible reference instead.'); },
    async lexicalContext() { throw new Error('Original-language context is unavailable.'); },
  };
  const provider = createLegacyBibleScriptureProvider(bible);

  await assert.rejects(
    provider.loadChapter({ translationId: 'jko', bookCode: 'JHN', chapter: 3 }),
    /Japanese live source unavailable/,
  );
  await assert.rejects(
    provider.search('jko', 'love', 10),
    /Search by Bible reference instead/,
  );
  await assert.rejects(
    provider.loadContext({ translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16 }),
    /Original-language context is unavailable/,
  );
});
