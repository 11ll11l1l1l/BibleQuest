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

const item = overrides => ({
  id: 'devotional-1',
  contentType: LIBRARY_CONTENT_TYPES.devotional,
  publishedRevisionId: 'revision-1',
  publicationState: 'published',
  title: 'A steady hope',
  summary: 'A short reading.',
  locale: 'en',
  readingMinutes: 4,
  ...overrides,
});

test('Library registry exposes the three V7 types and rejects duplicate ids', () => {
  const registry = createLibraryContentTypeRegistry();
  assert.deepEqual(registry.list().map(type => type.id), ['book', 'devotional', 'past-teaching']);
  assert.throws(
    () => createLibraryContentTypeRegistry([{ id: 'book', label: 'Duplicate' }]),
    { code: 'BQ_LIBRARY_CONTENT_TYPE' },
  );
});

test('published item normalization keeps revision identity and builds the approved detail route', () => {
  const registry = createLibraryContentTypeRegistry();
  const normalized = normalizeLibraryItem(item(), registry);
  assert.equal(normalized.publishedRevisionId, 'revision-1');
  assert.equal(normalized.readingMinutes, 4);
  assert.equal(Object.isFrozen(normalized), true);
  assert.deepEqual(presentLibraryItem(normalized, registry).destination, {
    routeKey: 'library-item',
    resourceId: 'devotional-1',
  });
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
