import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLibraryItem } from '../../src/features/library/contracts.js';

const publishedItem = source => ({
  id: 'devotional-source-boundary',
  contentType: 'devotional',
  publishedRevisionId: 'r1',
  publicationState: 'published',
  title: 'Source boundary',
  locale: 'en',
  sourceLocale: 'en',
  source,
  sourceContent: { title: 'Source boundary', body: 'Source text.' },
  rights: {
    status: 'verified',
    holder: 'Example rights holder',
    basis: 'Documented permission',
    attribution: 'Example rights holder',
    allowedUses: ['display'],
  },
  review: { status: 'approved', reviewer: 'editor-1', decidedAt: '2026-10-05T00:00:00Z' },
  taxonomyLinks: [],
  translations: [],
});

const source = overrides => ({
  kind: 'external',
  title: 'Example source',
  uri: 'https://example.org/source',
  ...overrides,
});

test('published Library records accept supported non-fixture source kinds', () => {
  for (const kind of ['first_party', 'external', 'licensed']) {
    assert.doesNotThrow(() => normalizeLibraryItem(publishedItem(source({ kind }))));
  }
  assert.doesNotThrow(() => normalizeLibraryItem(publishedItem(source({ uri: undefined, catalogId: 'catalog.source.1' }))));
});

test('published Library records reject fixture and unsupported source kinds', () => {
  for (const kind of ['fixture', 'original', '', 'unknown']) {
    assert.throws(
      () => normalizeLibraryItem(publishedItem(source({ kind }))),
      { code: 'BQ_LIBRARY_PROVENANCE' },
    );
  }
});

test('published Library source URIs fail closed unless they are absolute HTTPS URLs', () => {
  for (const uri of ['http://example.org/source', 'javascript:alert(1)', '/relative/source', 'not-a-url', '   ']) {
    assert.throws(
      () => normalizeLibraryItem(publishedItem(source({ uri }))),
      { code: 'BQ_LIBRARY_PROVENANCE' },
    );
  }
  assert.doesNotThrow(() => normalizeLibraryItem(publishedItem(source({ uri: null, catalogId: 'catalog.source.1' }))));
  assert.doesNotThrow(() => normalizeLibraryItem(publishedItem(source({ uri: '', catalogId: 'catalog.source.1' }))));
});

test('malformed supplied catalog identifiers do not satisfy source identity', () => {
  for (const catalogId of ['   ', {}, 42]) {
    assert.throws(
      () => normalizeLibraryItem(publishedItem(source({ uri: undefined, catalogId }))),
      { code: 'BQ_LIBRARY_PROVENANCE' },
    );
  }
});
