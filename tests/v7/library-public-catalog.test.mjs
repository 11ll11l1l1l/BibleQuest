import test from 'node:test';
import assert from 'node:assert/strict';
import { buildV7PublicLibraryCatalog } from '../../scripts/v7-generate-public-library-catalog.mjs';
import { createLibraryStaticRepository } from '../../src/features/library/static-adapter.js';

test('V7 exact-SHA public catalog contains the approved launch corpus', async () => {
  const catalog = await buildV7PublicLibraryCatalog({ candidateSha: 'a'.repeat(40) });
  assert.deepEqual(catalog.counts, {
    items: 303,
    devotionals: 300,
    books: 2,
    pastTeachings: 1,
  });
  assert.equal(catalog.items.filter(item => item.contentType === 'devotional').every(item => item.translations.length === 3), true);
  assert.equal(catalog.taxonomy.some(row => row.id === 'emotion.anxiety_worry'), true);
  assert.equal(catalog.taxonomy.some(row => row.id === 'need.peace'), true);
});

test('signed-out static Library can search, filter discovery aliases, and use reviewed translations', async () => {
  const catalog = await buildV7PublicLibraryCatalog({ candidateSha: 'b'.repeat(40) });
  const priorFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify(catalog), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
  try {
    const repository = createLibraryStaticRepository();

    const search = await repository.listPublished({ query: 'concern', contentType: 'devotional', limit: 24 });
    assert.equal(search.items.some(item => item.id === 'devotional.biblequest.anxiety_worry.01'), true);

    const anxious = await repository.listPublished({ emotions: ['anxious'], contentType: 'devotional', limit: 60 });
    assert.equal(anxious.items.length > 0, true);
    assert.equal(anxious.items.every(item => item.taxonomyLinks.some(link => link.id === 'emotion.anxiety_worry')), true);

    const tagalog = await repository.listPublished({ query: 'concern', contentType: 'devotional', locale: 'tl', limit: 24 });
    const translated = tagalog.items.find(item => item.id === 'devotional.biblequest.anxiety_worry.01');
    assert.ok(translated);
    assert.equal(translated.locale, 'fil');
    assert.notEqual(translated.title, 'One concern at a time');
  } finally {
    globalThis.fetch = priorFetch;
  }
});
