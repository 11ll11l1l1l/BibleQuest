import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

const curation = readJson('../../data/v7/curation/representative-library-curation.json');

const THEOLOGICAL_TIERS = new Set([
  'alliance_core',
  'compatible_evangelical',
  'historical_secondary',
  'review_required'
]);
const DIFFICULTIES = new Set(['accessible', 'intermediate', 'advanced']);
const FIT_LEVELS = new Set(['strong', 'moderate', 'limited']);
const EDITORIAL_PRIORITIES = new Set(['highest', 'high', 'medium', 'low']);
const SCRIPTURE_RELATIONSHIPS = new Set(['source_explicit', 'editorial_context']);

test('A2 curation covers exactly the current representative Library items', () => {
  const canonical = canonicalRepresentativeItems();
  const canonicalIds = canonical.map(item => item.id).sort();
  const curatedIds = curation.items.map(item => item.itemId).sort();

  assert.deepEqual(curatedIds, canonicalIds);
  assert.equal(new Set(curatedIds).size, curatedIds.length);
  assert.equal(curation.curationStatus, 'prepared_for_editorial_review');
  assert.equal(curation.boundary.doesNotApproveContent, true);
  assert.equal(curation.boundary.doesNotPublishContent, true);
  assert.equal(curation.boundary.doesNotChangeRights, true);
});

test('A2 curation snapshots canonical rights, review and publication states without changing them', () => {
  const canonicalById = new Map(canonicalRepresentativeItems().map(item => [item.id, item]));

  for (const item of curation.items) {
    const canonical = canonicalById.get(item.itemId);
    assert.ok(canonical, `missing canonical item ${item.itemId}`);
    assert.equal(item.contentType, canonical.type, `${item.itemId} content type drift`);
    assert.equal(item.rightsStatusSnapshot, canonical.rights.status, `${item.itemId} rights snapshot drift`);
    assert.equal(item.reviewStatusSnapshot, canonical.review.status, `${item.itemId} review snapshot drift`);
    assert.equal(item.publicationStateSnapshot, canonical.publicationState, `${item.itemId} publication snapshot drift`);
    assert.equal(Object.hasOwn(item, 'reviewer'), false, `${item.itemId} curation must not name an approving reviewer`);
    assert.equal(Object.hasOwn(item, 'decidedAt'), false, `${item.itemId} curation must not fabricate an approval decision`);
  }
});

test('A2 curation contains usable enrichment for discovery and discipleship planning', () => {
  for (const item of curation.items) {
    assert.ok(item.neutralSummary.length >= 80, `${item.itemId} needs a substantive neutral summary`);
    assert.ok(THEOLOGICAL_TIERS.has(item.theologicalFit.tier), `${item.itemId} theological tier is uncontrolled`);
    assert.ok(item.theologicalFit.rationale.length >= 40, `${item.itemId} theological rationale is too thin`);
    assert.ok(Array.isArray(item.topics) && item.topics.length >= 2, `${item.itemId} needs topics`);
    assert.ok(Array.isArray(item.collections) && item.collections.length >= 1, `${item.itemId} needs a collection`);
    assert.ok(Array.isArray(item.lifePathways) && item.lifePathways.length >= 1, `${item.itemId} needs a life pathway`);
    assert.ok(Array.isArray(item.audiences) && item.audiences.length >= 1, `${item.itemId} needs an audience`);
    assert.ok(DIFFICULTIES.has(item.difficulty), `${item.itemId} difficulty is uncontrolled`);
    assert.ok(item.readingTime && typeof item.readingTime.kind === 'string', `${item.itemId} needs reading-time metadata`);
    assert.ok(FIT_LEVELS.has(item.oneToOneFit.level), `${item.itemId} ONE 2 ONE fit is uncontrolled`);
    assert.ok(Array.isArray(item.oneToOneFit.stepFits) && item.oneToOneFit.stepFits.length >= 1, `${item.itemId} needs ONE 2 ONE step fits`);
    assert.ok(FIT_LEVELS.has(item.groupDiscussionFit.level), `${item.itemId} discussion fit is uncontrolled`);
    assert.ok(FIT_LEVELS.has(item.readingPlanFit.level), `${item.itemId} reading-plan fit is uncontrolled`);
    assert.ok(EDITORIAL_PRIORITIES.has(item.editorialPriority), `${item.itemId} editorial priority is uncontrolled`);
    assert.ok(item.sourceNotes.length >= 40, `${item.itemId} needs source/provenance notes`);
  }
});

test('A2 Scripture relationships are explicit editorial/source links, not copied Bible text', () => {
  for (const item of curation.items) {
    assert.ok(Array.isArray(item.scriptureLinks) && item.scriptureLinks.length >= 1, `${item.itemId} needs Scripture links`);
    for (const link of item.scriptureLinks) {
      assert.match(link.reference, /^[1-3]? ?[A-Za-z]+(?: [A-Za-z]+)* \d+:\d+(?:-\d+)?$/);
      assert.ok(SCRIPTURE_RELATIONSHIPS.has(link.relationship), `${item.itemId} Scripture relationship is uncontrolled`);
      assert.equal(Object.hasOwn(link, 'text'), false, `${item.itemId} must reference Scripture rather than copy verse text`);
      assert.ok(link.note.length >= 20, `${item.itemId} Scripture link needs a curation rationale`);
    }
  }
});
