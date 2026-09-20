import assert from 'node:assert/strict';
import test from 'node:test';

import {
  deriveVersePeek,
  loadContextLab,
  toContextLabRequest,
  type ReaderChapter,
  type ReaderContext,
  type ScriptureContentProvider,
} from '../../src/v6/reader/index.ts';

const chapter: ReaderChapter = {
  translationId: 'tl',
  book: { code: 'JHN', name: 'Juan', chapters: 21 },
  chapter: 3,
  verses: [
    { chapter: 3, verse: 15, text: 'sample fifteen' },
    { chapter: 3, verse: 16, text: 'sample sixteen' },
    { chapter: 3, verse: 17, verseEnd: 18, text: 'sample seventeen through eighteen' },
  ],
};

test('Verse Peek preserves translation/reference and adjacent verse context', () => {
  const peek = deriveVersePeek(chapter, 16);
  assert.ok(peek);
  assert.equal(peek.translationId, 'tl');
  assert.equal(peek.bookCode, 'JHN');
  assert.equal(peek.reference, 'Juan 3:16');
  assert.equal(peek.scripture.text, 'sample sixteen');
  assert.equal(peek.previous?.verse, 15);
  assert.equal(peek.next?.verse, 17);
  assert.equal(peek.canOpenContextLab, true);
});

test('Verse Peek resolves a requested verse inside an explicit verse range', () => {
  const peek = deriveVersePeek(chapter, 18);
  assert.ok(peek);
  assert.equal(peek.verse, 18);
  assert.equal(peek.reference, 'Juan 3:17-18');
  assert.equal(peek.scripture.verse, 17);
  assert.equal(peek.scripture.verseEnd, 18);
});

test('Verse Peek fails closed for invalid, absent, or blank Scripture', () => {
  assert.equal(deriveVersePeek(chapter, 0), null);
  assert.equal(deriveVersePeek(chapter, 99), null);
  assert.equal(deriveVersePeek({ ...chapter, verses: [{ chapter: 3, verse: 16, text: '   ' }] }, 16), null);
});

test('Context Lab request preserves exact EN/TL/JA translation and reference', () => {
  for (const translationId of ['bsb', 'tl', 'jko'] as const) {
    assert.deepEqual(
      toContextLabRequest({ translationId, bookCode: 'JHN', chapter: 3, verse: 16 }),
      { translationId, bookCode: 'JHN', chapter: 3, verse: 16 },
    );
  }
});

test('Context Lab fails closed rather than guessing a missing verse or book', () => {
  assert.equal(toContextLabRequest({ translationId: 'bsb', bookCode: 'JHN', chapter: 3 }), null);
  assert.equal(toContextLabRequest({ translationId: 'bsb', bookCode: '', chapter: 3, verse: 16 }), null);
  assert.equal(toContextLabRequest({ translationId: 'bsb', bookCode: 'JHN', chapter: -1, verse: 16 }), null);
});

test('Context Lab bridge delegates one exact read-only request to the provider', async () => {
  const calls: unknown[] = [];
  const expected = {
    available: true,
    reason: '',
    book: { code: 'JHN', name: 'John', chapters: 21 },
    chapter: 3,
    verse: 16,
    reference: 'John 3:16',
    scripture: { chapter: 3, verse: 16, text: 'sample' },
    previous: null,
    next: null,
    entries: [],
    source: 'test fixture',
    license: 'test-only',
    note: '',
    external: [],
  } satisfies ReaderContext;

  const provider: ScriptureContentProvider = {
    async loadChapter() { throw new Error('not expected'); },
    async search() { throw new Error('not expected'); },
    async loadContext(request) {
      calls.push(request);
      return expected;
    },
  };

  const result = await loadContextLab(provider, {
    translationId: 'jko',
    bookCode: 'JHN',
    chapter: 3,
    verse: 16,
  });

  assert.equal(result, expected);
  assert.deepEqual(calls, [{ translationId: 'jko', bookCode: 'JHN', chapter: 3, verse: 16 }]);
});

test('Context Lab bridge performs no provider read for invalid input', async () => {
  let calls = 0;
  const provider: ScriptureContentProvider = {
    async loadChapter() { throw new Error('not expected'); },
    async search() { throw new Error('not expected'); },
    async loadContext() { calls += 1; throw new Error('not expected'); },
  };

  const result = await loadContextLab(provider, {
    translationId: 'tl',
    bookCode: 'JHN',
    chapter: 3,
  });

  assert.equal(result, null);
  assert.equal(calls, 0);
});
