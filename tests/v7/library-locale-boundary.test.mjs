import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLibraryItem } from '../../src/features/library/contracts.js';

const translation = (locale, overrides = {}) => ({
  locale,
  reviewStatus: 'reviewed',
  translatedFromRevision: 'r1',
  translatedBy: 'translator-1',
  reviewedBy: 'reviewer-1',
  reviewedAt: '2026-10-05T00:00:00Z',
  content: { title: `Translation ${locale}`, body: 'Reviewed translation.' },
  ...overrides,
});

const publishedItem = overrides => ({
  id: 'devotional-locale-boundary',
  contentType: 'devotional',
  publishedRevisionId: 'r1',
  publicationState: 'published',
  title: 'Locale boundary',
  locale: 'EN-us',
  sourceLocale: 'EN-us',
  source: { kind: 'external', title: 'Source', uri: 'https://example.org/source' },
  sourceContent: { title: 'Locale boundary', body: 'Source text.' },
  rights: {
    status: 'verified',
    holder: 'Example rights holder',
    basis: 'Documented permission',
    attribution: 'Example rights holder',
    allowedUses: ['display'],
  },
  review: { status: 'approved', reviewer: 'editor-1', decidedAt: '2026-10-05T00:00:00Z' },
  taxonomyLinks: [],
  translations: [translation('JA-jp')],
  ...overrides,
});

test('published Library locales are canonicalized at the runtime boundary', () => {
  const normalized = normalizeLibraryItem(publishedItem());
  assert.equal(normalized.sourceLocale, 'en-US');
  assert.equal(normalized.locale, 'en-US');
  assert.equal(normalized.translations[0].locale, 'ja-JP');
});

test('invalid source and requested locales fail closed', () => {
  assert.throws(
    () => normalizeLibraryItem(publishedItem({ sourceLocale: 'not_a_locale' })),
    { code: 'BQ_LIBRARY_LOCALE' },
  );
  assert.throws(
    () => normalizeLibraryItem(publishedItem({ locale: 'not_a_locale' })),
    { code: 'BQ_LIBRARY_LOCALE' },
  );
});

test('translation locales must be valid and differ from the canonical source locale', () => {
  assert.throws(
    () => normalizeLibraryItem(publishedItem({ translations: [translation('not_a_locale')] })),
    { code: 'BQ_LIBRARY_TRANSLATION' },
  );
  assert.throws(
    () => normalizeLibraryItem(publishedItem({ sourceLocale: 'en', locale: 'en', translations: [translation('EN')] })),
    { code: 'BQ_LIBRARY_TRANSLATION' },
  );
});

test('canonically duplicate current translation locales are rejected', () => {
  assert.throws(
    () => normalizeLibraryItem(publishedItem({
      translations: [translation('JA-jp'), translation('ja-JP', { translatedBy: 'translator-2' })],
    })),
    { code: 'BQ_LIBRARY_TRANSLATION' },
  );
});
