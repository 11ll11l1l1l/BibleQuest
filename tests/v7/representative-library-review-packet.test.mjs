import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, import.meta.url), 'utf8'));
}

function canonicalRepresentativeItems() {
  const bundles = [
    readJson('../../data/v7/books/representative-catalog.json'),
    readJson('../../content/v7/devotionals/spurgeon-samples.json'),
    readJson('../../data/v7/past-teachings/prayer-source-example.json')
  ];
  return bundles.flatMap(bundle => parseV7ContentBundle(bundle).items);
}

const packet = readJson('../../data/v7/curation/representative-library-review-packet.json');

const CHECKS_BY_TYPE = {
  book: [
    'source_identity',
    'attribution',
    'rights_basis',
    'permitted_use',
    'theological_editorial_fit',
    'audience_suitability',
    'publication_suitability'
  ],
  devotional: [
    'source_identity',
    'attribution',
    'rights_basis',
    'permitted_use',
    'excerpt_accuracy',
    'scripture_context',
    'theological_editorial_fit',
    'audience_suitability',
    'publication_suitability'
  ],
  past_teaching: [
    'source_identity',
    'attribution',
    'rights_basis',
    'faithful_meaning',
    'scripture_reference_accuracy',
    'theological_editorial_fit',
    'audience_suitability',
    'publication_suitability'
  ]
};

const BLOCKERS = new Set(['rights_clearance_pending', 'editorial_review_pending']);

test('A2 review packet covers exactly the representative Library content', () => {
  const canonicalIds = canonicalRepresentativeItems().map(item => item.id).sort();
  const packetIds = packet.items.map(item => item.itemId).sort();

  assert.deepEqual(packetIds, canonicalIds);
  assert.equal(new Set(packetIds).size, packetIds.length);
  assert.equal(packet.status, 'automated_review_complete');
  assert.equal(packet.boundary.contentReviewStillRequired, false);
  assert.equal(packet.boundary.unknownRightsBlockPublication, true);
  assert.equal(packet.boundary.doesNotApproveContent, true);
  assert.equal(packet.boundary.doesNotPublishContent, true);
  assert.equal(packet.boundary.doesNotChangeRights, true);
  assert.equal(packet.boundary.doesNotNameReviewer, true);
});

test('A2 review packet snapshots canonical states and derives only current blockers', () => {
  const canonicalById = new Map(canonicalRepresentativeItems().map(item => [item.id, item]));

  for (const item of packet.items) {
    const canonical = canonicalById.get(item.itemId);
    assert.ok(canonical, `missing canonical item ${item.itemId}`);
    assert.equal(item.contentType, canonical.type, `${item.itemId} content type drift`);
    assert.equal(item.revisionSnapshot, canonical.revision, `${item.itemId} revision drift`);
    assert.equal(item.rightsStatusSnapshot, canonical.rights.status, `${item.itemId} rights drift`);
    assert.equal(item.reviewStatusSnapshot, canonical.review.status, `${item.itemId} review drift`);
    assert.equal(item.publicationStateSnapshot, canonical.publicationState, `${item.itemId} publication drift`);

    const expectedBlockers = [];
    if (canonical.rights.status !== 'verified') expectedBlockers.push('rights_clearance_pending');
    if (canonical.review.status !== 'approved') expectedBlockers.push('editorial_review_pending');
    assert.deepEqual(item.openBlockers, expectedBlockers, `${item.itemId} blocker drift`);
    assert.equal(new Set(item.openBlockers).size, item.openBlockers.length, `${item.itemId} duplicate blockers`);
    for (const blocker of item.openBlockers) {
      assert.ok(BLOCKERS.has(blocker), `${item.itemId} has uncontrolled blocker ${blocker}`);
    }

    assert.equal(Object.hasOwn(item, 'reviewer'), false, `${item.itemId} must not name a reviewer`);
    assert.equal(Object.hasOwn(item, 'decidedAt'), false, `${item.itemId} must not fabricate a decision timestamp`);
  }
});

test('A2 review packet requires the content-type checks from the accepted V7 content contract', () => {
  for (const item of packet.items) {
    assert.deepEqual(item.requiredChecks, CHECKS_BY_TYPE[item.contentType], `${item.itemId} review checklist drift`);
    assert.equal(new Set(item.requiredChecks).size, item.requiredChecks.length, `${item.itemId} duplicate review checks`);
    assert.ok(item.reviewNote.length >= 80, `${item.itemId} needs an actionable reviewer note`);
  }
});

test('A2 review packet repository evidence references stay resolvable', () => {
  for (const item of packet.items) {
    assert.ok(Array.isArray(item.repositoryEvidenceRefs) && item.repositoryEvidenceRefs.length >= 2, `${item.itemId} needs repository evidence refs`);
    assert.equal(new Set(item.repositoryEvidenceRefs).size, item.repositoryEvidenceRefs.length, `${item.itemId} duplicate evidence refs`);
    for (const ref of item.repositoryEvidenceRefs) {
      const url = new URL(`../../${ref}`, import.meta.url);
      assert.equal(existsSync(url), true, `${item.itemId} missing repository evidence ${ref}`);
    }
  }
});
