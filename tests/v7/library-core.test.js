import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LIBRARY_CONTENT_TYPES,
  createLibraryContentTypeRegistry,
  normalizeLibraryItem,
  presentLibraryItem,
} from '../../src/features/library/contracts.js';
import { createLibraryRepository } from '../../src/features/library/repository.js';
import { createLibraryService } from '../../src/features/library/service.js';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';

const item = overrides => ({
  id: 'devotional-1',
  contentType: LIBRARY_CONTENT_TYPES.devotional,
  publishedRevisionId: 'revision-1',
  publicationState: 'published',
  title: 'A steady hope',
  summary: 'A short reading.',
  locale: 'en',
  sourceLocale: 'en',
  source: { kind: 'external', title: 'Source', uri: 'https://example.org/devotional' },
  sourceContent: { title: 'A steady hope', body: 'Source language text.' },
  rights: { status: 'verified', holder: 'Example author', basis: 'Written permission', attribution: 'Example author', allowedUses: ['display'] },
  review: { status: 'approved', reviewer: 'editor-1', decidedAt: '2026-10-04T00:00:00Z' },
  taxonomyLinks: [{ id: 'topic.hope', kind: 'topic', order: 0 }],
  translations: [{
    locale: 'ja',
    reviewStatus: 'reviewed',
    translatedFromRevision: 'revision-1',
    translatedBy: 'translator-1',
    reviewedBy: 'reviewer-1',
    reviewedAt: '2026-10-04T00:00:00Z',
    content: { title: '希望', body: 'Reviewed translation.' },
  }],
  readingMinutes: 4,
  ...overrides,
});

test('Library registry exposes the three V7 types and rejects duplicate ids', () => {
  const registry = createLibraryContentTypeRegistry();
  assert.deepEqual(registry.list().map(type => type.id), ['book', 'devotional', 'past_teaching']);
  assert.throws(
    () => createLibraryContentTypeRegistry([{ id: 'book', label: 'Duplicate' }]),
    { code: 'BQ_LIBRARY_CONTENT_TYPE' },
  );
});

test('published item normalization preserves provenance, taxonomy, and reviewed translations', () => {
  const registry = createLibraryContentTypeRegistry();
  const normalized = normalizeLibraryItem(item(), registry);
  assert.equal(normalized.publishedRevisionId, 'revision-1');
  assert.equal(normalized.readingMinutes, 4);
  assert.equal(normalized.source.uri, 'https://example.org/devotional');
  assert.equal(normalized.taxonomyLinks[0].id, 'topic.hope');
  assert.equal(normalized.translations[0].content.title, '希望');
  assert.equal(Object.isFrozen(normalized.translations[0].content), true);
  assert.deepEqual(presentLibraryItem(normalized, registry).destination, {
    routeKey: 'library-item',
    resourceId: 'devotional-1',
  });
});

test('P1-D import records adapt to the Library domain without losing content metadata', () => {
  const parsed = parseV7ContentBundle({
    schemaVersion: 1,
    taxonomy: [{ id: 'topic.hope', kind: 'topic', labels: { en: 'Hope' } }],
    items: [{
      id: 'teaching-hope',
      type: 'past_teaching',
      revision: 'r1',
      sourceLocale: 'en',
      publicationState: 'published',
      source: { kind: 'external', title: 'Original teaching', uri: 'https://example.org/teaching' },
      sourceContent: { title: 'Hope in hardship', body: 'An approved teaching article.' },
      rights: { status: 'verified', holder: 'Example author', basis: 'Permission', attribution: 'Example author', allowedUses: ['display'] },
      review: { status: 'approved', reviewer: 'editor-1', decidedAt: '2026-10-04T00:00:00Z' },
      revisionHistory: [],
      taxonomyLinks: [{ id: 'topic.hope', kind: 'topic', order: 0 }],
      translations: [],
    }],
  });
  const source = parsed.items[0];
  const libraryItem = normalizeLibraryItem({
    id: source.id,
    contentType: source.type,
    publishedRevisionId: source.revision,
    publicationState: source.publicationState,
    title: source.sourceContent.title,
    summary: source.sourceContent.body,
    locale: source.sourceLocale,
    sourceLocale: source.sourceLocale,
    source: source.source,
    sourceContent: source.sourceContent,
    rights: source.rights,
    review: source.review,
    taxonomyLinks: source.taxonomyLinks,
    translations: source.translations,
    revisionHistory: source.revisionHistory,
    derivatives: source.derivatives,
  });
  assert.equal(libraryItem.contentType, 'past_teaching');
  assert.equal(libraryItem.sourceContent.body, 'An approved teaching article.');
  assert.equal(libraryItem.taxonomyLinks[0].id, 'topic.hope');
});

test('unpublished and unregistered records cannot cross the repository boundary', () => {
  const registry = createLibraryContentTypeRegistry();
  assert.throws(() => normalizeLibraryItem(item({ publicationState: 'draft' }), registry), {
    code: 'BQ_LIBRARY_PUBLICATION',
  });
  assert.throws(() => normalizeLibraryItem(item({ contentType: 'unknown' }), registry), {
    code: 'BQ_LIBRARY_ITEM',
  });
});

test('publication rejects unverified rights and stale or unreviewed translations', () => {
  const registry = createLibraryContentTypeRegistry();
  assert.throws(() => normalizeLibraryItem(item({ rights: { status: 'unknown' } }), registry), {
    code: 'BQ_LIBRARY_RIGHTS',
  });
  assert.throws(() => normalizeLibraryItem(item({
    translations: [{ locale: 'ja', reviewStatus: 'reviewed', translatedFromRevision: 'old-revision', content: { title: '古い' } }],
  }), registry), { code: 'BQ_LIBRARY_TRANSLATION' });
  assert.throws(() => normalizeLibraryItem(item({
    translations: [{ ...item().translations[0], reviewedBy: '' }],
  }), registry), { code: 'BQ_LIBRARY_TRANSLATION' });
});

test('service bounds search and page size, ignores stale responses, and supports item lookup', async () => {
  let resolveSlow;
  let slowOptions;
  const adapter = {
    listPublished: options => {
      if (options.query === 'slow') {
        slowOptions = options;
        return new Promise(resolve => { resolveSlow = resolve; });
      }
      return Promise.resolve({ items: [item()], nextCursor: null });
    },
    getPublishedById: async id => id === 'devotional-1' ? item() : null,
  };
  const repository = createLibraryRepository(adapter);
  const service = createLibraryService({ repository });
  const slow = service.list({ query: 'slow', limit: 500 });
  await service.list({ query: `  ${'x'.repeat(130)}  `, limit: 100 });
  resolveSlow({ items: [], nextCursor: null });
  await slow;
  assert.equal(slowOptions.limit, 60);
  assert.equal(service.getState().query.length, 120);
  assert.equal(service.getState().status, 'ready');
  assert.equal(service.getState().items.length, 1);
  assert.equal(await service.getItem('devotional-1').then(state => state.selectedItem.id), 'devotional-1');
  assert.equal((await service.getItem('missing')).status, 'not-found');
});

test('service keeps repository failure visible as an error state', async () => {
  const repository = createLibraryRepository({
    listPublished: async () => { throw new Error('temporarily unavailable'); },
    getPublishedById: async () => null,
  });
  const service = createLibraryService({ repository });
  const state = await service.list();
  assert.equal(state.status, 'error');
  assert.equal(state.error, 'temporarily unavailable');
});
