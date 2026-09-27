import assert from 'node:assert/strict';
import test from 'node:test';

import { presentReaderSearchResults, type ReaderSearchResult } from '../../src/v6/reader/index.ts';

const valid: ReaderSearchResult = {
  query: 'love',
  type: 'text',
  results: [
    {
      book: { code: 'JHN', name: 'John', chapters: 21 },
      chapter: 3,
      verse: 16,
      text: 'fixture Scripture text',
      reference: 'John 3:16',
    },
  ],
  skippedBooks: [],
};

test('Reader Search presentation is independently testable and DOM-free', () => {
  const presentation = presentReaderSearchResults(valid);
  assert.deepEqual(presentation, {
    heading: 'Search results',
    countLabel: '1 shown',
    emptyMessage: null,
    warning: null,
    items: [{ index: 0, reference: 'John 3:16', text: 'fixture Scripture text' }],
  });
});

test('Reader Search presentation preserves empty and partial-pack states', () => {
  const presentation = presentReaderSearchResults({
    ...valid,
    results: [],
    skippedBooks: [{ code: 'GEN', message: 'fixture unavailable' }],
  });
  assert.equal(presentation.countLabel, null);
  assert.equal(presentation.emptyMessage, 'No matches found.');
  assert.equal(presentation.warning, '1 book pack(s) were unavailable during this search.');
  assert.deepEqual(presentation.items, []);
});

test('Reader Search presentation fails closed on malformed Scripture hits', () => {
  assert.throws(
    () => presentReaderSearchResults({
      ...valid,
      results: [{ ...valid.results[0]!, text: '   ' }],
    }),
    /non-blank Scripture text/,
  );
  assert.throws(
    () => presentReaderSearchResults({
      ...valid,
      results: [{ ...valid.results[0]!, chapter: 0 }],
    }),
    /invalid Scripture location/,
  );
});

test('Reader Search presentation does not generate HTML or escape/alter provider text', () => {
  const presentation = presentReaderSearchResults({
    ...valid,
    results: [{ ...valid.results[0]!, text: '<em>exact provider text</em>' }],
  });
  assert.equal(presentation.items[0]?.text, '<em>exact provider text</em>');
});
