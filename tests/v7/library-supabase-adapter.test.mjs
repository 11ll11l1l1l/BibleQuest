import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibrarySupabaseAdapter, createLibrarySupabaseRepository } from '../../src/features/library/supabase-adapter.js';
import { createLibraryService } from '../../src/features/library/service.js';

const makeRow = (id = 'item-1', revisionId = 'revision-1') => ({
  id,
  content_type: 'devotional',
  current_revision_id: revisionId,
  publication_state: 'published',
  updated_at: '2026-10-04T00:00:00Z',
  revision: {
    id: revisionId,
    item_id: id,
    revision_number: 1,
    source_locale: 'en',
    title: 'Hope for today',
    summary: 'A short reading about hope.',
    body: { blocks: [{ type: 'paragraph', text: 'A reading.' }] },
    reading_minutes: 4,
    source_kind: 'external',
    source_title: 'Original devotional',
    source_uri: 'https://example.org/hope',
    source_catalog_id: null,
    source_revision: '2026-10',
    source_date: null,
    source_checksum: 'sha256:abc',
    creator: 'Example author',
    originating_organization: 'Example ministry',
    rights_status: 'verified',
    rights_holder: 'Example author',
    rights_basis: 'Written permission',
    attribution: 'By Example author',
    allowed_uses: ['display'],
    publication_state: 'published',
    review_status: 'approved',
    reviewer_id: 'editor-1',
    reviewed_at: '2026-10-04T00:00:00Z',
    revision_history: ['revision-0'],
    derivatives: [],
    translations: [{
      id: 'translation-1',
      locale: 'ja',
      title: '今日の希望',
      summary: '希望について。',
      body: { blocks: [{ type: 'paragraph', text: '翻訳' }] },
      translated_from_revision_id: revisionId,
      translator: 'translator-1',
      review_status: 'reviewed',
      reviewer_id: 'reviewer-1',
      reviewed_at: '2026-10-04T00:00:00Z',
    }],
    taxonomy_links: [{
      display_order: 0,
      taxonomy: { id: 'topic.hope', kind: 'topic', labels: { en: 'Hope', ja: '希望' } },
    }],
  },
});

function makeClient({ rows = [], detail = null, error = null } = {}) {
  const calls = [];
  const client = {
    from(table) {
      const call = { table, filters: [], orders: [], selections: [], ranges: [] };
      calls.push(call);
      const query = {
        select(columns) { call.selections.push(columns); return this; },
        eq(column, value) { call.filters.push(['eq', column, value]); return this; },
        neq(column, value) { call.filters.push(['neq', column, value]); return this; },
        ilike(column, value) { call.filters.push(['ilike', column, value]); return this; },
        order(column, options) { call.orders.push([column, options]); return this; },
        range(start, end) { call.ranges.push([start, end]); return this; },
        maybeSingle: async () => ({ data: detail, error }),
        then(resolve, reject) { return Promise.resolve({ data: rows, error }).then(resolve, reject); },
      };
      return query;
    },
  };
  return { client, calls };
}

test('published list maps provenance, rights, reviewed translations, and taxonomy with bounded pagination', async () => {
  const { client, calls } = makeClient({ rows: [makeRow(), makeRow('item-2', 'revision-2')] });
  const repository = createLibrarySupabaseRepository(client);
  const result = await repository.listPublished({ query: 'hope%_*', contentType: 'devotional', limit: 1, cursor: '4' });

  assert.equal(result.items.length, 1);
  assert.equal(result.nextCursor, '5');
  assert.equal(result.items[0].sourceContent.body.blocks[0].text, 'A reading.');
  assert.equal(result.items[0].rights.status, 'verified');
  assert.equal(result.items[0].review.reviewer, 'editor-1');
  assert.equal(result.items[0].taxonomyLinks[0].labels.ja, '希望');
  assert.equal(result.items[0].translations[0].content.title, '今日の希望');
  assert.deepEqual(calls[0].ranges, [[4, 5]]);
  assert.ok(calls[0].filters.some(([kind, column, value]) =>
    kind === 'eq' && column === 'revision.review_status' && value === 'approved'));
  assert.ok(calls[0].filters.some(([kind, column, value]) =>
    kind === 'ilike' && column === 'revision.title' && value === '%hope\\%\\_\\*%'));
  assert.ok(!calls[0].selections[0].includes(',body,'));
});

test('detail loads full content and returns null when missing', async () => {
  const { client, calls } = makeClient({ detail: makeRow() });
  const item = await createLibrarySupabaseAdapter(client).getPublishedById('item-1');
  assert.equal(item.source.kind, 'external');
  assert.ok(calls[0].selections[0].includes(',body,'));
  assert.equal(calls[0].filters.at(-1)[1], 'id');
  assert.equal(await createLibrarySupabaseAdapter(makeClient().client).getPublishedById('missing'), null);
});

test('stale translations are omitted and inconsistent current revisions fail closed', async () => {
  const stale = makeRow();
  stale.revision.translations[0].translated_from_revision_id = 'older-revision';
  const service = createLibraryService({ repository: createLibrarySupabaseRepository(makeClient({ rows: [stale] }).client) });
  const state = await service.list();
  assert.equal(state.status, 'ready');
  assert.deepEqual(state.items[0].translations, []);

  const broken = makeRow();
  broken.current_revision_id = 'different-revision';
  const invalidService = createLibraryService({ repository: createLibrarySupabaseRepository(makeClient({ rows: [broken] }).client) });
  assert.equal((await invalidService.list()).status, 'error');
});

test('database errors stay visible and invalid cursors fail before opening the client', async () => {
  const expected = new Error('permission denied');
  const errored = createLibrarySupabaseAdapter(makeClient({ error: expected }).client);
  await assert.rejects(errored.listPublished(), error => error === expected);

  let opened = 0;
  const adapter = createLibrarySupabaseAdapter(async () => {
    opened += 1;
    return makeClient().client;
  });
  await assert.rejects(adapter.listPublished({ cursor: '-1' }), { code: 'BQ_LIBRARY_CURSOR' });
  assert.equal(opened, 0);
});
