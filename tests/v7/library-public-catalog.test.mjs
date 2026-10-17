import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildV7PublicLibraryCatalog, verifyExternalBookReleaseReview } from '../../scripts/v7-generate-public-library-catalog.mjs';
import { createLibraryStaticRepository } from '../../src/features/library/static-adapter.js';

test('V7 exact-SHA public catalog contains the approved launch corpus', async () => {
  const catalog = await buildV7PublicLibraryCatalog({ candidateSha: 'a'.repeat(40), generatedAt: '2026-10-17T00:00:00Z' });
  assert.deepEqual(catalog.counts, {
    items: 309,
    devotionals: 300,
    books: 8,
    pastTeachings: 1,
  });
  assert.equal(catalog.items.filter(item => item.contentType === 'devotional').every(item => item.translations.length === 3), true);
  assert.equal(catalog.taxonomy.some(row => row.id === 'emotion.anxiety_worry'), true);
  assert.equal(catalog.taxonomy.some(row => row.id === 'need.peace'), true);
});

test('signed-out static Library can search, filter discovery aliases, and use reviewed translations', async () => {
  const catalog = await buildV7PublicLibraryCatalog({ candidateSha: 'b'.repeat(40), generatedAt: '2026-10-17T00:00:00Z' });
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

// Catches wall-clock data leaking into independently rebuilt deployment bytes.
test('same source commit produces byte-identical public catalogs across wall clocks', async t => {
  const candidateSha = execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
  t.mock.timers.enable({apis:['Date'],now:Date.parse('2026-10-17T01:00:00Z')});
  const first = await buildV7PublicLibraryCatalog({candidateSha});
  t.mock.timers.setTime(Date.parse('2026-10-18T03:00:00Z'));
  const second = await buildV7PublicLibraryCatalog({candidateSha});
  assert.equal(JSON.stringify(first), JSON.stringify(second));
  assert.ok(first.items.every(item => Number.isFinite(Date.parse(item.updatedAt))));
});

test('external-link book review rejects changed source, rights and revision', () => {
  const bundle=JSON.parse(readFileSync(new URL('../../data/v7/books/library-expansion-candidates.json',import.meta.url)));
  const packet=JSON.parse(readFileSync(new URL('../../data/v7/curation/launch-books-release-review-20261017.json',import.meta.url)));
  for(const item of bundle.items) verifyExternalBookReleaseReview(item,packet);
  for(const change of [item=>{item.source.uri='https://example.com/file.epub'},item=>{item.rights.allowedUses.push('display')},item=>{item.revision='unreviewed'},item=>{item.sourceContent.body='Unreviewed hosted prose'}]) {
    const item=structuredClone(bundle.items[0]);change(item);
    assert.throws(()=>verifyExternalBookReleaseReview(item,packet),/missing or stale/);
  }
});
