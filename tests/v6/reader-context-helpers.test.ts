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

const john: ReaderChapter = {
  translationId: 'bsb',
  book: { code: 'JHN', name: 'John', chapters: 21 },
  chapter: 3,
  verses: [
    { chapter: 3, verse: 15, text: 'fixture fifteen' },
    { chapter: 3, verse: 16, text: 'fixture sixteen' },
    { chapter: 3, verse: 17, verseEnd: 18, text: 'fixture grouped seventeen to eighteen' },
  ],
};

const johnContext: ReaderContext = {
  available: true,
  reason: '',
  book: john.book,
  chapter: 3,
  verse: 16,
  reference: 'John 3:16',
  scripture: john.verses[1]!,
  previous: john.verses[0]!,
  next: john.verses[2]!,
  entries: [],
  source: 'fixture',
  license: 'fixture',
  note: 'fixture',
  external: [],
};

test('Verse Peek preserves exact translation/location and adjacent Scripture without provider I/O', () => {
  const peek = deriveVersePeek(john, 16);
  assert.ok(peek);
  assert.equal(peek.translationId, 'bsb');
  assert.equal(peek.bookCode, 'JHN');
  assert.equal(peek.chapter, 3);
  assert.equal(peek.verse, 16);
  assert.equal(peek.reference, 'John 3:16');
  assert.equal(peek.scripture.text, 'fixture sixteen');
  assert.equal(peek.previous?.verse, 15);
  assert.equal(peek.next?.verse, 17);
  assert.equal(peek.canOpenContextLab, true);
});

test('Verse Peek resolves a requested verse inside a grouped verse without inventing text', () => {
  const peek = deriveVersePeek(john, 18);
  assert.ok(peek);
  assert.equal(peek.verse, 18);
  assert.equal(peek.reference, 'John 3:17-18');
  assert.equal(peek.scripture.verse, 17);
  assert.equal(peek.scripture.verseEnd, 18);
  assert.equal(peek.scripture.text, 'fixture grouped seventeen to eighteen');
});

test('Verse Peek fails closed for missing, invalid, or blank Scripture', () => {
  assert.equal(deriveVersePeek(john, 0), null);
  assert.equal(deriveVersePeek(john, 99), null);
  assert.equal(
    deriveVersePeek({ ...john, verses: [{ chapter: 3, verse: 16, text: '   ' }] }, 16),
    null,
  );
});

test('Context Lab request preserves exact translation and verse and rejects incomplete locations', () => {
  assert.deepEqual(
    toContextLabRequest({ translationId: 'tl', bookCode: 'GEN', chapter: 1, verse: 1 }),
    { translationId: 'tl', bookCode: 'GEN', chapter: 1, verse: 1 },
  );
  assert.equal(toContextLabRequest({ translationId: 'jko', bookCode: '', chapter: 1, verse: 1 }), null);
  assert.equal(toContextLabRequest({ translationId: 'jko', bookCode: 'JHN', chapter: 3 }), null);
  assert.equal(toContextLabRequest({ translationId: 'jko', bookCode: 'JHN', chapter: 0, verse: 16 }), null);
});

test('Context Lab performs zero provider I/O for invalid locations', async () => {
  let calls = 0;
  const provider = {
    loadContext: async () => {
      calls += 1;
      throw new Error('must not be called');
    },
  } as unknown as ScriptureContentProvider;

  const result = await loadContextLab(provider, { translationId: 'bsb', bookCode: 'JHN', chapter: 3 });
  assert.equal(result, null);
  assert.equal(calls, 0);
});

test('Context Lab delegates one exact translation/location request without keyword substitution', async () => {
  const requests: unknown[] = [];
  const provider = {
    loadContext: async (request: unknown) => {
      requests.push(request);
      return johnContext;
    },
  } as unknown as ScriptureContentProvider;

  const result = await loadContextLab(provider, { translationId: 'jko', bookCode: 'JHN', chapter: 3, verse: 16 });
  assert.equal(result, johnContext);
  assert.deepEqual(requests, [{ translationId: 'jko', bookCode: 'JHN', chapter: 3, verse: 16 }]);
});

test('Context Lab rejects a provider payload from a different book, chapter, or verse', async () => {
  for (const context of [
    { ...johnContext, book: { code: 'GEN', name: 'Genesis', chapters: 50 } },
    { ...johnContext, chapter: 4, scripture: { ...johnContext.scripture, chapter: 4 } },
    { ...johnContext, verse: 17, scripture: john.verses[2]! },
  ]) {
    const provider = { loadContext: async () => context } as unknown as ScriptureContentProvider;
    assert.equal(
      await loadContextLab(provider, { translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16 }),
      null,
    );
  }
});

test('Context Lab rejects blank or out-of-range Scripture while preserving explicit unavailable state', async () => {
  const blankProvider = {
    loadContext: async () => ({ ...johnContext, scripture: { ...johnContext.scripture, text: '   ' } }),
  } as unknown as ScriptureContentProvider;
  assert.equal(
    await loadContextLab(blankProvider, { translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16 }),
    null,
  );

  const unavailable = { ...johnContext, available: false, reason: 'not-supported' };
  const unavailableProvider = { loadContext: async () => unavailable } as unknown as ScriptureContentProvider;
  assert.equal(
    await loadContextLab(unavailableProvider, { translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16 }),
    unavailable,
  );
});
