import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLibraryItem } from '../../src/features/library/contracts.js';
import { createLibrarySupabaseRepository } from '../../src/features/library/supabase-adapter.js';
import { createLibraryService } from '../../src/features/library/service.js';

function domainItem(allowedUses) {
  return {
    id: 'devotional-rights-1',
    contentType: 'devotional',
    publishedRevisionId: 'revision-1',
    publicationState: 'published',
    title: 'Rights integrity',
    summary: 'A short reading.',
    locale: 'en',
    sourceLocale: 'en',
    source: { kind: 'external', title: 'Source', uri: 'https://example.org/rights-integrity' },
    sourceContent: { title: 'Rights integrity', body: 'Source text.' },
    rights: {
      status: 'verified',
      holder: 'Example author',
      basis: 'Written permission',
      attribution: 'Example author',
      allowedUses,
    },
    review: { status: 'approved', reviewer: 'editor-1', decidedAt: '2026-10-05T00:00:00Z' },
    taxonomyLinks: [],
    translations: [],
  };
}

function databaseRow(allowedUses) {
  return {
    id: 'devotional-rights-1',
    content_type: 'devotional',
    current_revision_id: 'revision-1',
    publication_state: 'published',
    updated_at: '2026-10-05T00:00:00Z',
    revision: {
      id: 'revision-1',
      item_id: 'devotional-rights-1',
      revision_number: 1,
      source_locale: 'en',
      title: 'Rights integrity',
      summary: 'A short reading.',
      body: { blocks: [{ type: 'paragraph', text: 'Source text.' }] },
      reading_minutes: 2,
      source_kind: 'external',
      source_title: 'Source',
      source_uri: 'https://example.org/rights-integrity',
      source_catalog_id: null,
      source_revision: '2026-10',
      source_date: null,
      source_checksum: 'sha256:abc',
      creator: 'Example author',
      originating_organization: 'Example ministry',
      rights_status: 'verified',
      rights_holder: 'Example author',
      rights_basis: 'Written permission',
      attribution: 'Example author',
      allowed_uses: allowedUses,
      publication_state: 'published',
      review_status: 'approved',
      reviewer_id: 'editor-1',
      reviewed_at: '2026-10-05T00:00:00Z',
      revision_history: [],
      derivatives: [],
      translations: [],
      taxonomy_links: [],
    },
  };
}

function clientFor(row) {
  return {
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        neq() { return this; },
        ilike() { return this; },
        order() { return this; },
        range() { return this; },
        maybeSingle: async () => ({ data: row, error: null }),
        then(resolve, reject) { return Promise.resolve({ data: [row], error: null }).then(resolve, reject); },
      };
    },
  };
}

test('published Library rights require at least one explicit nonblank permitted use', () => {
  for (const allowedUses of [[], [''], ['  '], [null]]) {
    assert.throws(() => normalizeLibraryItem(domainItem(allowedUses)), { code: 'BQ_LIBRARY_RIGHTS' });
  }

  for (const allowedUses of [['display'], ['external_link'], ['display metadata', 'link to source']]) {
    const normalized = normalizeLibraryItem(domainItem(allowedUses));
    assert.deepEqual(normalized.rights.allowedUses, allowedUses);
    assert.equal(Object.isFrozen(normalized.rights.allowedUses), true);
  }
});

test('database rows with empty verified permitted uses fail closed in Library list and detail state', async () => {
  const invalid = databaseRow([]);
  const service = createLibraryService({
    repository: createLibrarySupabaseRepository(clientFor(invalid)),
  });

  const listed = await service.list();
  assert.equal(listed.status, 'error');
  assert.deepEqual(listed.items, []);

  const detail = await service.getItem(invalid.id);
  assert.equal(detail.status, 'error');
  assert.equal(detail.selectedItem, null);

  const validRow = databaseRow(['external_link']);
  const valid = createLibraryService({
    repository: createLibrarySupabaseRepository(clientFor(validRow)),
  });
  assert.equal((await valid.list()).status, 'ready');
  assert.deepEqual((await valid.getItem(validRow.id)).selectedItem.rights.allowedUses, ['external_link']);
});
