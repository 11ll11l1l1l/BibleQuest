import test from 'node:test';
import assert from 'node:assert/strict';
import { createLibraryService } from '../../src/features/library/service.js';

function item(id) {
  return {
    id,
    contentType: 'devotional',
    publishedRevisionId: `revision-${id}`,
    publicationState: 'published',
    title: `Devotional ${id}`,
    summary: '',
    locale: 'en',
    sourceLocale: 'en',
    readingMinutes: 2,
    source: { kind: 'external', title: 'Source', uri: 'https://example.org/source', creator: 'Author' },
    sourceContent: { title: 'Source' },
    rights: { status: 'verified', holder: 'Holder', basis: 'Public domain', attribution: '', allowedUses: ['display'] },
    review: { status: 'approved', reviewer: 'reviewer', decidedAt: '2026-10-06T00:00:00Z' },
    taxonomyLinks: [],
    translations: [],
    revisionHistory: [],
    derivatives: [],
  };
}

test('service passes the frozen A1 discovery shape and preserves it through pagination', async () => {
  const calls = [];
  const repository = {
    async listPublished(options) {
      calls.push(options);
      return calls.length === 1
        ? { items: [item('one')], nextCursor: '1' }
        : { items: [item('two')], nextCursor: null };
    },
    async getPublishedById() { return null; },
  };
  const service = createLibraryService({ repository });

  const first = await service.list({
    emotions: ['worried'],
    needs: ['peace'],
    topics: ['prayer'],
    lifeSituations: ['work_stress'],
    locale: 'ilo-PH',
    limit: 1,
  });
  assert.equal(first.status, 'ready');
  assert.deepEqual(first.discoveryQuery, {
    emotions: ['anxious'],
    needs: ['peace'],
    topics: ['prayer'],
    lifeSituations: ['work_stress'],
    locale: 'ilo',
  });
  assert.deepEqual(calls[0].emotions, ['anxious']);
  assert.deepEqual(calls[0].needs, ['peace']);
  assert.equal(calls[0].locale, 'ilo');

  const second = await service.loadMore();
  assert.equal(second.items.length, 2);
  assert.deepEqual(calls[1].emotions, ['anxious']);
  assert.deepEqual(calls[1].needs, ['peace']);
  assert.deepEqual(calls[1].topics, ['prayer']);
  assert.deepEqual(calls[1].lifeSituations, ['work_stress']);
  assert.equal(calls[1].locale, 'ilo');
  assert.equal(calls[1].cursor, '1');
});
