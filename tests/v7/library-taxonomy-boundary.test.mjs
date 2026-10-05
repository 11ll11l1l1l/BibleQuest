import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLibraryItem } from '../../src/features/library/contracts.js';

const publishedItem = taxonomyLinks => ({
  id: 'devotional-taxonomy-boundary',
  contentType: 'devotional',
  publishedRevisionId: 'r1',
  publicationState: 'published',
  title: 'Taxonomy boundary',
  locale: 'en',
  sourceLocale: 'en',
  source: { kind: 'external', title: 'Source', uri: 'https://example.org/source' },
  sourceContent: { title: 'Taxonomy boundary', body: 'Source text.' },
  rights: {
    status: 'verified',
    holder: 'Example rights holder',
    basis: 'Documented permission',
    attribution: 'Example rights holder',
    allowedUses: ['display'],
  },
  review: { status: 'approved', reviewer: 'editor-1', decidedAt: '2026-10-05T00:00:00Z' },
  taxonomyLinks,
  translations: [],
});

test('published Library taxonomy links are normalized into deterministic kind/order order', () => {
  const normalized = normalizeLibraryItem(publishedItem([
    { id: 'topic.hope', kind: 'topic', order: 1, labels: { en: 'Hope' } },
    { id: 'category.life', kind: 'category', order: 0, labels: { en: 'Life' } },
    { id: 'topic.prayer', kind: 'topic', order: 0, labels: { en: 'Prayer' } },
  ]));
  assert.deepEqual(normalized.taxonomyLinks.map(link => link.id), [
    'category.life', 'topic.prayer', 'topic.hope',
  ]);
  assert.equal(normalized.taxonomyLinks[0].labels.en, 'Life');
});

test('taxonomy link ids and kinds must match the V7 controlled-link shape', () => {
  for (const link of [
    { id: 'Topic.Hope', kind: 'topic', order: 0 },
    { id: 'topic hope', kind: 'topic', order: 0 },
    { id: 'topic.hope', kind: 'section', order: 0 },
    { id: '', kind: 'topic', order: 0 },
  ]) {
    assert.throws(() => normalizeLibraryItem(publishedItem([link])), { code: 'BQ_LIBRARY_TAXONOMY' });
  }
});

test('taxonomy link order must be a non-negative integer', () => {
  for (const order of [-1, 0.5, '0', null]) {
    assert.throws(
      () => normalizeLibraryItem(publishedItem([{ id: 'topic.hope', kind: 'topic', order }])),
      { code: 'BQ_LIBRARY_TAXONOMY' },
    );
  }
});

test('taxonomy links reject duplicate ids and duplicate positions within a kind', () => {
  assert.throws(() => normalizeLibraryItem(publishedItem([
    { id: 'topic.hope', kind: 'topic', order: 0 },
    { id: 'topic.hope', kind: 'topic', order: 1 },
  ])), { code: 'BQ_LIBRARY_TAXONOMY' });
  assert.throws(() => normalizeLibraryItem(publishedItem([
    { id: 'topic.hope', kind: 'topic', order: 0 },
    { id: 'topic.prayer', kind: 'topic', order: 0 },
  ])), { code: 'BQ_LIBRARY_TAXONOMY' });
});

test('taxonomy ids are trimmed consistently with the import contract', () => {
  const normalized = normalizeLibraryItem(publishedItem([
    { id: '  topic.hope  ', kind: 'topic', order: 0 },
  ]));
  assert.equal(normalized.taxonomyLinks[0].id, 'topic.hope');
});
