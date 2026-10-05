import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryService } from '../../src/features/library/service.js';

const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done; }); return { promise, resolve }; };

test('stalled browse read exits loading at its deadline and ignores a late result after Retry', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const slow = deferred();
  let calls = 0;
  const service = createLibraryService({ repository: {
    listPublished: () => ++calls === 1 ? slow.promise : Promise.resolve({ items: [], nextCursor: null }),
    getPublishedById: async () => null,
  } });
  const first = service.list({ query: 'hope', contentType: 'book' });
  await flush();
  assert.equal(service.getState().status, 'loading');
  t.mock.timers.tick(9999); await flush();
  assert.equal(service.getState().status, 'loading');
  t.mock.timers.tick(1); await flush();
  assert.equal(service.getState().status, 'error');
  await first;
  assert.equal(service.getState().query, 'hope');
  assert.equal(service.getState().contentType, 'book');
  await service.list({ query: 'hope', contentType: 'book' });
  assert.equal(service.getState().status, 'empty');
  slow.resolve({ items: [{ id: 'late-private-item' }] }); await flush();
  assert.equal(service.getState().status, 'empty');
  assert.deepEqual(service.getState().items, []);
});

test('stalled item read exposes recovery and a successful retry clears its deadline', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const service = createLibraryService({ repository: {
    listPublished: async () => ({ items: [] }),
    getPublishedById: () => ++calls === 1 ? new Promise(() => {}) : Promise.resolve(null),
  } });
  const first = service.getItem('item-1');
  await flush(); t.mock.timers.tick(10000); await flush();
  assert.equal(service.getState().status, 'error');
  await first;
  await service.getItem('item-1');
  assert.equal(service.getState().status, 'not-found');
  t.mock.timers.tick(20000); await flush();
  assert.equal(service.getState().status, 'not-found');
});

test('context reset settles an outstanding read without restoring its data or later error', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const slow = deferred();
  const service = createLibraryService({ repository: {
    listPublished: () => slow.promise, getPublishedById: async () => null,
  } });
  let settled = false;
  const read = service.list().then(() => { settled = true; });
  await flush(); service.reset(); await flush();
  assert.equal(settled, true);
  await read;
  assert.equal(service.getState().status, 'idle');
  t.mock.timers.tick(10000); await flush();
  slow.resolve({ items: [{ id: 'old-context-item' }] }); await flush();
  assert.equal(service.getState().status, 'idle');
  assert.deepEqual(service.getState().items, []);
});

test('pagination deadline preserves existing results and cursor for a same-page Retry', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const published = {
    id: 'book-1', contentType: 'book', publishedRevisionId: 'revision-1',
    publicationState: 'published', title: 'Book', sourceLocale: 'en', locale: 'en',
    source: { kind: 'external', title: 'Source', uri: 'https://example.org/book' },
    sourceContent: { title: 'Book' },
    taxonomyLinks: [], translations: [],
    rights: { status: 'verified', holder: 'Author', basis: 'Permission', attribution: 'Author', allowedUses: ['external_link'] },
    review: { status: 'approved', reviewer: 'editor', decidedAt: '2026-10-04T00:00:00Z' },
  };
  const slow = deferred();
  let calls = 0;
  const service = createLibraryService({ repository: {
    listPublished: () => ++calls === 1 ? Promise.resolve({ items: [published], nextCursor: 'page-2' })
      : calls === 2 ? slow.promise : Promise.resolve({ items: [], nextCursor: null }),
    getPublishedById: async () => null,
  } });
  await service.list();
  const read = service.loadMore();
  await flush(); t.mock.timers.tick(10000); await flush();
  assert.equal(service.getState().status, 'ready');
  assert.equal(service.getState().loadingMore, false);
  assert.equal(service.getState().nextCursor, 'page-2');
  assert.ok(service.getState().moreError);
  assert.deepEqual(service.getState().items.map(item => item.id), ['book-1']);
  await read;
  await service.loadMore();
  assert.equal(service.getState().moreError, null);
  assert.equal(service.getState().nextCursor, null);
  slow.resolve({ items: [{ id: 'late-page' }] }); await flush();
  assert.deepEqual(service.getState().items.map(item => item.id), ['book-1']);
});

test('a superseding read promptly settles the old request and keeps the new result', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const slow = deferred();
  const service = createLibraryService({ repository: {
    listPublished: ({ query }) => query === 'old' ? slow.promise : Promise.resolve({ items: [] }),
    getPublishedById: async () => null,
  } });
  let settled = false;
  const old = service.list({ query: 'old' }).then(() => { settled = true; });
  await service.list({ query: 'new' }); await flush();
  assert.equal(settled, true);
  await old;
  t.mock.timers.tick(10000); await flush();
  assert.equal(service.getState().query, 'new');
  assert.equal(service.getState().status, 'empty');
});
