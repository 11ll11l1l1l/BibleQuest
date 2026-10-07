import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';

const readJson = path => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const items = [
  ...parseV7ContentBundle(readJson('../../data/v7/past-teachings/prayer-source-example.json')).items,
  ...parseV7ContentBundle(readJson('../../data/v7/past-teachings/launch-set-additional.json')).items
];
const summary = readJson('../../data/v7/past-teachings/launch-set-summary.json');

test('Lane A Past Teaching launch set is bounded and rights-clear', () => {
  assert.equal(items.length, 5);
  assert.equal(summary.launchCount, 5);
  assert.equal(new Set(items.map(item => item.id)).size, 5);
  assert.ok(items.every(item => item.type === 'past_teaching'));
  assert.ok(items.every(item => item.source.kind === 'first_party'));
  assert.ok(items.every(item => item.rights.status === 'verified'));
  assert.equal(items.filter(item => item.publicationState === 'published' && item.review.status === 'approved').length, 1);
  assert.equal(items.filter(item => item.publicationState === 'pending_review' && item.review.status === 'pending_review').length, 4);
  assert.equal(items.find(item => item.publicationState === 'published')?.review.reviewer, 'biblequest.v7.representative-policy-v1');
  assert.ok(items.every(item => !Object.hasOwn(item.source, 'uri')));
});

test('Past Teaching launch set carries stable checksums and no copied Scripture text requirement', () => {
  for (const item of items) {
    const digest = createHash('sha256')
      .update(`${item.sourceContent.title}\n${item.sourceContent.body}`, 'utf8')
      .digest('hex');
    assert.equal(item.source.checksum, `sha256:${digest}`, item.id);
    assert.ok(item.source.catalogId.startsWith('biblequest.v7.past-teaching.'));
    assert.ok(item.rights.allowedUses.includes('display'));
    assert.ok(item.sourceContent.body.includes('## '));
  }
  assert.equal(summary.policy.scriptureCitationMode, 'reference_only_no_verse_text');
  assert.equal(summary.releaseBoundary.allRightsClear, true);
  assert.equal(summary.releaseBoundary.allFirstParty, true);
  assert.equal(summary.releaseBoundary.noUnknownRights, true);
  assert.equal(summary.releaseBoundary.noExternalAdaptation, true);
  assert.equal(summary.policy.humanReviewRequiredForLaneA, false);
});
