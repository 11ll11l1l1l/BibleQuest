import assert from 'node:assert/strict';
import test from 'node:test';

import {
  normalizeReaderSearchRequest,
  searchReader,
  type ReaderSearchResult,
  type ReaderTranslationId,
  type ScriptureContentProvider,
} from '../../src/v6/reader/index.ts';

function result(query: string, reference: string): ReaderSearchResult {
  const isGenesis = reference.startsWith('Genesis');
  return {
    query,
    type: 'reference',
    results: [{
      book: isGenesis
        ? { code: 'GEN', name: 'Genesis', chapters: 50 }
        : { code: 'JHN', name: 'John', chapters: 21 },
      chapter: isGenesis ? 1 : 3,
      verse: isGenesis ? 1 : 16,
      text: 'fixture Scripture text',
      reference,
    }],
    skippedBooks: [],
  };
}

test('search normalizes whitespace and applies a bounded default limit', () => {
  assert.deepEqual(
    normalizeReaderSearchRequest({ translationId: 'bsb', query: '  Genesis 1:1  ' }),
    { translationId: 'bsb', query: 'Genesis 1:1', limit: 50 },
  );
});

test('search fails closed for blank input or invalid limits', () => {
  assert.equal(normalizeReaderSearchRequest({ translationId: 'tl', query: '   ' }), null);
  assert.equal(normalizeReaderSearchRequest({ translationId: 'jko', query: 'John 3:16', limit: 0 }), null);
  assert.equal(normalizeReaderSearchRequest({ translationId: 'bsb', query: 'Genesis 1:1', limit: 101 }), null);
});

test('search preserves EN/TL/JA translation selection for representative OT and NT requests', async () => {
  const calls: Array<{ translationId: ReaderTranslationId; query: string; limit?: number }> = [];
  const provider: ScriptureContentProvider = {
    async loadChapter() { throw new Error('not expected'); },
    async loadContext() { throw new Error('not expected'); },
    async search(translationId, query, limit) {
      calls.push({ translationId, query, limit });
      return result(query, query.startsWith('Genesis') ? 'Genesis 1:1' : 'John 3:16');
    },
  };

  await searchReader(provider, { translationId: 'bsb', query: 'Genesis 1:1', limit: 20 });
  await searchReader(provider, { translationId: 'tl', query: 'John 3:16', limit: 20 });
  await searchReader(provider, { translationId: 'jko', query: 'John 3:16', limit: 20 });

  assert.deepEqual(calls, [
    { translationId: 'bsb', query: 'Genesis 1:1', limit: 20 },
    { translationId: 'tl', query: 'John 3:16', limit: 20 },
    { translationId: 'jko', query: 'John 3:16', limit: 20 },
  ]);
});

test('invalid search performs zero provider reads rather than guessing a reference', async () => {
  let calls = 0;
  const provider: ScriptureContentProvider = {
    async loadChapter() { throw new Error('not expected'); },
    async loadContext() { throw new Error('not expected'); },
    async search() { calls += 1; throw new Error('not expected'); },
  };

  assert.equal(await searchReader(provider, { translationId: 'bsb', query: '   ' }), null);
  assert.equal(calls, 0);
});
