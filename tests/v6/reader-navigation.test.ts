import assert from 'node:assert/strict';
import test from 'node:test';
import {
  moveReaderChapter,
  normalizeReaderLocation,
  switchReaderTranslation,
} from '../../src/v6/reader/navigation.ts';
import type { ReaderBookRef } from '../../src/v6/reader/contracts.ts';

const john: ReaderBookRef = Object.freeze({ code: 'JHN', name: 'John', chapters: 21 });
const catalog = new Map([[john.code, john]]);

test('Reader navigation normalizes book codes and rejects invalid chapters/verses', () => {
  assert.deepEqual(normalizeReaderLocation({ translationId: 'bsb', bookCode: 'jhn', chapter: 3, verse: 16 }, catalog), {
    translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 16,
  });
  assert.throws(() => normalizeReaderLocation({ translationId: 'bsb', bookCode: 'JHN', chapter: 22 }, catalog), /Invalid chapter/);
  assert.throws(() => normalizeReaderLocation({ translationId: 'bsb', bookCode: 'JHN', chapter: 3, verse: 0 }, catalog), /Invalid verse/);
});

test('translation switching preserves reference and never substitutes another translation', () => {
  const location = { translationId: 'bsb' as const, bookCode: 'JHN', chapter: 3, verse: 16 };
  assert.deepEqual(switchReaderTranslation(location, 'tl', catalog), {
    translationId: 'tl', bookCode: 'JHN', chapter: 3, verse: 16,
  });
  assert.deepEqual(switchReaderTranslation(location, 'jko', catalog), {
    translationId: 'jko', bookCode: 'JHN', chapter: 3, verse: 16,
  });
});

test('chapter movement is bounded and clears a verse anchor', () => {
  assert.deepEqual(moveReaderChapter({ translationId: 'tl', bookCode: 'JHN', chapter: 3, verse: 16 }, 1, catalog), {
    translationId: 'tl', bookCode: 'JHN', chapter: 4,
  });
  assert.equal(moveReaderChapter({ translationId: 'tl', bookCode: 'JHN', chapter: 1 }, -1, catalog), null);
  assert.equal(moveReaderChapter({ translationId: 'tl', bookCode: 'JHN', chapter: 21 }, 1, catalog), null);
});
