import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ScriptureRepository,
  type ReaderChapter,
  type ReaderContext,
  type ReaderLocation,
  type ReaderSearchResult,
  type ReaderTranslationId,
  type ScriptureContentProvider,
} from '../../src/v6/reader/index.ts';

const book = { code: 'JHN', name: 'John', chapters: 21 } as const;
const chapter = (translationId: ReaderTranslationId = 'bsb'): ReaderChapter => ({
  translationId,
  book,
  chapter: 3,
  verses: [{ chapter: 3, verse: 16, text: 'fixture Scripture text' }],
});

function provider(overrides: Partial<ScriptureContentProvider> = {}): ScriptureContentProvider {
  return {
    loadChapter: async (location: ReaderLocation) => chapter(location.translationId),
    search: async (_translationId: ReaderTranslationId, query: string): Promise<ReaderSearchResult> => ({
      query,
      type: 'text',
      results: [],
      skippedBooks: [],
    }),
    loadContext: async (): Promise<ReaderContext> => { throw new Error('not used'); },
    ...overrides,
  };
}

test('preserves exact EN/TL/JA translation and chapter identity behind the repository seam', async () => {
  for (const translationId of ['bsb', 'tl', 'jko'] as const) {
    const repository = new ScriptureRepository(provider());
    const result = await repository.loadChapter({ translationId, bookCode: 'JHN', chapter: 3 });
    assert.equal(result.status, 'ready');
    if (result.status === 'ready') {
      assert.equal(result.value.translationId, translationId);
      assert.equal(result.value.book.code, 'JHN');
      assert.equal(result.value.chapter, 3);
    }
  }
});

test('invalid locations fail closed before provider I/O', async () => {
  let calls = 0;
  const repository = new ScriptureRepository(provider({
    loadChapter: async () => { calls += 1; return chapter(); },
  }));
  const result = await repository.loadChapter({ translationId: 'bsb', bookCode: '', chapter: 0 });
  assert.deepEqual(result, { status: 'failed', reason: 'invalid-location', retryable: false });
  assert.equal(calls, 0);
});

test('rejects wrong translation, passage, blank Scripture, and provider failure', async () => {
  const wrongTranslation = new ScriptureRepository(provider({ loadChapter: async () => chapter('tl') }));
  assert.deepEqual(
    await wrongTranslation.loadChapter({ translationId: 'bsb', bookCode: 'JHN', chapter: 3 }),
    { status: 'failed', reason: 'mismatched-content', retryable: true },
  );

  const blank = new ScriptureRepository(provider({
    loadChapter: async () => ({ ...chapter(), verses: [{ chapter: 3, verse: 16, text: '   ' }] }),
  }));
  assert.deepEqual(
    await blank.loadChapter({ translationId: 'bsb', bookCode: 'JHN', chapter: 3 }),
    { status: 'failed', reason: 'mismatched-content', retryable: true },
  );

  const unavailable = new ScriptureRepository(provider({ loadChapter: async () => { throw new Error('offline'); } }));
  assert.deepEqual(
    await unavailable.loadChapter({ translationId: 'jko', bookCode: 'JHN', chapter: 3 }),
    { status: 'failed', reason: 'unavailable', retryable: true },
  );
});

test('normalizes search input and rejects mismatched provider query or invalid limits', async () => {
  const seen: unknown[] = [];
  const repository = new ScriptureRepository(provider({
    search: async (translationId, query, limit) => {
      seen.push([translationId, query, limit]);
      return { query, type: 'text', results: [], skippedBooks: [] };
    },
  }));
  const ready = await repository.search('tl', '  pag ibig   Diyos ', 25);
  assert.equal(ready.status, 'ready');
  assert.deepEqual(seen, [['tl', 'pag ibig Diyos', 25]]);

  const mismatch = new ScriptureRepository(provider({
    search: async () => ({ query: 'different query', type: 'text', results: [], skippedBooks: [] }),
  }));
  assert.deepEqual(
    await mismatch.search('jko', '神 愛', 10),
    { status: 'failed', reason: 'mismatched-content', retryable: true },
  );

  let invalidCalls = 0;
  const invalid = new ScriptureRepository(provider({ search: async () => { invalidCalls += 1; throw new Error('must not run'); } }));
  assert.deepEqual(await invalid.search('bsb', '   ', 0), { status: 'failed', reason: 'invalid-location', retryable: false });
  assert.equal(invalidCalls, 0);
});
