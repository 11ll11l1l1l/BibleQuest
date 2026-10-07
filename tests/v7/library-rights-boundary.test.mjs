import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLibraryItem } from '../../src/features/library/contracts.js';

const publishedItem = rights => ({
  id: 'devotional-rights-boundary',
  contentType: 'devotional',
  publishedRevisionId: 'r1',
  publicationState: 'published',
  title: 'Rights boundary',
  locale: 'en',
  sourceLocale: 'en',
  source: { kind: 'external', title: 'Source', uri: 'https://example.org/source' },
  sourceContent: { title: 'Rights boundary', body: 'Source text.' },
  rights,
  review: { status: 'approved', reviewer: 'editor-1', decidedAt: '2026-10-05T00:00:00Z' },
  taxonomyLinks: [],
  translations: [],
});

const verifiedRights = allowedUses => ({
  status: 'verified',
  holder: 'Example rights holder',
  basis: 'Documented permission',
  attribution: 'Example rights holder',
  allowedUses,
});

test('published Library records require at least one permitted use', () => {
  assert.throws(
    () => normalizeLibraryItem(publishedItem(verifiedRights([]))),
    { code: 'BQ_LIBRARY_RIGHTS' },
  );
  assert.doesNotThrow(
    () => normalizeLibraryItem(publishedItem(verifiedRights(['display']))),
  );
});
