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

test('reset clears scope data and invalidates pending list and detail responses', async () => {
  let completeList;
  let completeDetail;
  const service = createLibraryService({ repository: createLibraryRepository({
    listPublished: () => new Promise(resolve => { completeList = resolve; }),
    getPublishedById: () => new Promise(resolve => { completeDetail = resolve; }),
  }) });
  const pendingList = service.list({ query: 'prior scope' });
  const cleared = service.reset();
  assert.equal(cleared.status, 'idle');
  assert.equal(cleared.query, '');
  assert.deepEqual(cleared.items, []);
  completeList({ items: [item()], nextCursor: 'old-page' });
  await pendingList;
  assert.equal(service.getState(), cleared);

  const pendingDetail = service.getItem('devotional-1');
  const clearedAgain = service.reset();
  completeDetail(item());
  await pendingDetail;
  assert.equal(service.getState(), clearedAgain);
  assert.equal(service.getState().selectedItem, null);
});

test('new requests clear old results immediately and reset permits a fresh scope load', async () => {
  let rejectOld;
  const service = createLibraryService({ repository: createLibraryRepository({
    listPublished: options => options.query === 'old'
      ? new Promise((resolve, reject) => { rejectOld = reject; })
      : Promise.resolve({ items: [item()], nextCursor: 'page-2' }),
    getPublishedById: async () => item(),
  }) });
  await service.list();
  const detail = service.getItem('devotional-1');
  assert.deepEqual(service.getState().items, []);
  assert.equal(service.getState().nextCursor, null);
  await detail;

  const old = service.list({ query: 'old' });
  assert.equal(service.getState().selectedItem, null);
  service.reset();
  await service.list({ query: 'new' });
  rejectOld(new Error('old account denied'));
  await old;
  assert.equal(service.getState().status, 'ready');
  assert.equal(service.getState().query, 'new');
  assert.equal(service.getState().error, null);
});

test('cancelled list responses are discarded before accessing their content', async () => {
  let complete;
  const service = createLibraryService({ repository: {
    listPublished: () => new Promise(resolve => { complete = resolve; }),
    getPublishedById: async () => null,
  } });
  const pending = service.list();
  const cleared = service.reset();
  let accessed = false;
  complete({ get items() { accessed = true; throw new Error('stale payload'); } });
  await pending;
  assert.equal(accessed, false);
  assert.equal(service.getState(), cleared);
});

test('detail lookup refuses a published record belonging to another item', async () => {
  const service = createLibraryService({ repository: {
    listPublished: async () => ({ items: [], nextCursor: null }),
    getPublishedById: async () => item(),
  } });
  const state = await service.getItem('another-item');
  assert.equal(state.status, 'error');
  assert.equal(state.selectedItem, null);
  assert.deepEqual(state.items, []);
  assert.equal(state.error, 'Library returned a different item than requested.');
  assert.equal((await service.getItem('devotional-1')).selectedItem.id, 'devotional-1');
});

test('discovery keeps taxonomy across filtered pages and appends without duplicate items', async () => {
  const requests = [];
  let rejectMore = false;
  const service = createLibraryService({ repository: createLibraryRepository({
    async listPublished(options) {
      requests.push(options);
      if (!options.cursor) return { items: [item()], nextCursor: '24',
        taxonomy: [{ id: 'topic.hope', kind: 'topic', labels: { en: 'Hope' } }] };
      if (rejectMore) throw new Error('offline');
      return { items: [item(), item({ id: 'book-2', contentType: 'book' })], nextCursor: null };
    },
    getPublishedById: async () => null,
  }) });
  await service.list({ query: 'hope', taxonomyId: 'topic.hope', includeTaxonomy: true });
  assert.equal(service.getState().taxonomy[0].labels.en, 'Hope');
  rejectMore = true;
  await service.loadMore();
  assert.equal(service.getState().status, 'ready');
  assert.equal(service.getState().items.length, 1);
  assert.equal(service.getState().nextCursor, '24');
  assert.equal(service.getState().moreError, 'offline');
  rejectMore = false;
  await service.loadMore();
  assert.equal(service.getState().items.length, 2);
  assert.equal(service.getState().moreError, null);
  assert.equal(service.getState().nextCursor, null);
  assert.equal(requests.at(-1).taxonomyId, 'topic.hope');
  assert.equal(requests.at(-1).query, 'hope');
  assert.equal(service.getState().taxonomy.length, 1);
  const count = requests.length;
  await service.loadMore();
  assert.equal(requests.length, count);
});

test('scope reset discards late pagination and taxonomy data; double Load more opens one request', async () => {
  let resolveMore;
  let moreRequests = 0;
  const service = createLibraryService({ repository: createLibraryRepository({
    listPublished(options) {
      if (!options.cursor) return Promise.resolve({ items: [item()], nextCursor: '24',
        taxonomy: [{ id: 'topic.hope', kind: 'topic', labels: { en: 'Hope' } }] });
      moreRequests++;
      return new Promise(resolve => { resolveMore = resolve; });
    },
    getPublishedById: async () => null,
  }) });
  await service.list({ taxonomyId: 'topic.hope', includeTaxonomy: true });
  const more = service.loadMore();
  await service.loadMore();
  assert.equal(moreRequests, 1);
  assert.equal(service.getState().loadingMore, true);
  const cleared = service.reset();
  resolveMore({ items: [item({ id: 'private-old-item' })], nextCursor: null });
  await more;
  assert.equal(service.getState(), cleared);
  assert.deepEqual(cleared.taxonomy, []);
  assert.equal(cleared.taxonomyId, '');
  assert.equal(cleared.loadingMore, false);
});
