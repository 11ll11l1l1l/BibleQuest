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
const context = (): ReaderContext => ({
  available: true,
  reason: '',
  book,
  chapter: 3,
  verse: 16,
  reference: 'John 3:16',
  scripture: { chapter: 3, verse: 16, text: 'fixture Scripture text' },
  previous: { chapter: 3, verse: 15, text: 'previous fixture' },
  next: { chapter: 3, verse: 17, text: 'next fixture' },
  entries: [],
  source: 'fixture',
  license: 'fixture',
  note: '',
  external: [],
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
    loadContext: async (): Promise<ReaderContext> => context(),
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

test('rejects empty, overlapping, out-of-order, and impossible chapter payloads', async () => {
  const request = { translationId: 'bsb', bookCode: 'JHN', chapter: 3 } as const;
  const malformed: ReaderChapter[] = [
    { ...chapter(), verses: [] },
    { ...chapter(), verses: [
      { chapter: 3, verse: 15, verseEnd: 16, text: 'grouped fixture' },
      { chapter: 3, verse: 16, text: 'overlap fixture' },
    ] },
    { ...chapter(), verses: [
      { chapter: 3, verse: 17, text: 'later fixture' },
      { chapter: 3, verse: 16, text: 'out-of-order fixture' },
    ] },
    { ...chapter(), book: { ...book, chapters: 2 } },
  ];
  for (const payload of malformed) {
    const repository = new ScriptureRepository(provider({ loadChapter: async () => payload }));
    assert.deepEqual(
      await repository.loadChapter(request),
      { status: 'failed', reason: 'mismatched-content', retryable: true },
    );
  }
});

test('routes Context Lab through the repository and preserves exact requested passage', async () => {
  const seen: unknown[] = [];
  const repository = new ScriptureRepository(provider({
    loadContext: async (location) => { seen.push(location); return context(); },
  }));
  const result = await repository.loadContext({ translationId: 'jko', bookCode: 'JHN', chapter: 3, verse: 16 });
  assert.equal(result.status, 'ready');
  assert.deepEqual(seen, [{ translationId: 'jko', bookCode: 'JHN', chapter: 3, verse: 16 }]);
});

test('Context Lab fails closed before I/O and rejects mismatched or blank Scripture', async () => {
  let invalidCalls = 0;
  const invalid = new ScriptureRepository(provider({
    loadContext: async () => { invalidCalls += 1; return context(); },
  }));
  assert.deepEqual(
    await invalid.loadContext({ translationId: 'bsb', bookCode: '', chapter: 3, verse: 0 }),
    { status: 'failed', reason: 'invalid-location', retryable: false },
  );
  assert.equal(invalidCalls, 0);

  const mismatch = new ScriptureRepository(provider({
    loadContext: async () => ({ ...context(), book: { ...book, code: 'GEN', name: 'Genesis' } }),
  }));
  assert.deepEqual(
    await mismatch.loadContext({ translationId: 'tl', bookCode: 'JHN', chapter: 3, verse: 16 }),
    { status: 'failed', reason: 'mismatched-content', retryable: true },
  );

  const blank = new ScriptureRepository(provider({
    loadContext: async () => ({ ...context(), scripture: { chapter: 3, verse: 16, text: '   ' } }),
  }));
  assert.deepEqual(
    await blank.loadContext({ translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16 }),
    { status: 'failed', reason: 'mismatched-content', retryable: true },
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

test('search rejects malformed, impossible, blank, and over-limit provider hits', async () => {
  const query = 'love';
  const validHit = {
    book,
    chapter: 3,
    verse: 16,
    text: 'fixture Scripture text',
    reference: 'John 3:16',
  } as const;
  const malformed: ReaderSearchResult[] = [
    { query, type: 'text', results: [{ ...validHit, book: { ...book, chapters: 2 } }], skippedBooks: [] },
    { query, type: 'text', results: [{ ...validHit, verse: 0 }], skippedBooks: [] },
    { query, type: 'text', results: [{ ...validHit, verse: 17, verseEnd: 16 }], skippedBooks: [] },
    { query, type: 'text', results: [{ ...validHit, text: '   ' }], skippedBooks: [] },
    { query, type: 'text', results: [{ ...validHit, reference: '   ' }], skippedBooks: [] },
    { query, type: 'text', results: [validHit, { ...validHit, verse: 17, reference: 'John 3:17' }], skippedBooks: [] },
    { query, type: 'text', results: [], skippedBooks: [{ code: 'JHN', message: '   ' }] },
  ];
  for (const payload of malformed) {
    const repository = new ScriptureRepository(provider({ search: async () => payload }));
    assert.deepEqual(
      await repository.search('bsb', query, 1),
      { status: 'failed', reason: 'mismatched-content', retryable: true },
    );
  }
});

test('search provider failures are retryable and a later EN/TL/JA request can recover cleanly', async () => {
  for (const translationId of ['bsb', 'tl', 'jko'] as const) {
    let attempts = 0;
    const repository = new ScriptureRepository(provider({
      search: async (_translationId, query) => {
        attempts += 1;
        if (attempts === 1) throw new Error('temporary provider failure');
        return { query, type: 'text', results: [], skippedBooks: [] };
      },
    }));

    assert.deepEqual(
      await repository.search(translationId, 'grace', 10),
      { status: 'failed', reason: 'unavailable', retryable: true },
    );
    const recovered = await repository.search(translationId, 'grace', 10);
    assert.equal(recovered.status, 'ready');
    assert.equal(attempts, 2);
  }
});
