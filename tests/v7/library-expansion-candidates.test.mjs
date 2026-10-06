import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));

test('A2 expansion candidates stay outside the five-item representative decision scope', () => {
  const books = parseV7ContentBundle(readJson('../../data/v7/books/library-expansion-candidates.json')).items;
  const devotionals = parseV7ContentBundle(readJson('../../content/v7/devotionals/spurgeon-expansion-01.json')).items;
  const enrichment = readJson('../../data/v7/curation/library-expansion-enrichment.json');
  const packet = readJson('../../data/v7/curation/representative-library-review-packet.json');

  assert.equal(books.length, 6);
  assert.equal(devotionals.length, 4);
  assert.equal(enrichment.items.length, 10);

  const expansionIds = new Set([...books, ...devotionals].map(item => item.id));
  assert.deepEqual(new Set(enrichment.items.map(item => item.contentId)), expansionIds);
  assert.ok(packet.items.every(item => !expansionIds.has(item.itemId)));

  for (const item of [...books, ...devotionals]) {
    assert.equal(item.publicationState, 'pending_review');
    assert.equal(item.review.status, 'pending_review');
  }
  for (const item of books) {
    assert.equal(item.source.kind, 'external');
    assert.deepEqual(item.rights.allowedUses, ['external_link']);
    assert.equal(item.sourceContent.body, undefined);
  }
});

test('A2 expansion enrichment remains advisory and cannot grant publication', () => {
  const enrichment = readJson('../../data/v7/curation/library-expansion-enrichment.json');
  assert.equal(enrichment.advisoryOnly, true);
  assert.equal(enrichment.publicationApprovalGranted, false);
  assert.equal(enrichment.scope, 'v7_library_expansion_candidates');
  assert.equal(new Set(enrichment.items.map(item => item.contentId)).size, enrichment.items.length);
});
