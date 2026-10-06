import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { parseV7ContentBundle } from '../../src/v7/content/contract.js';
import {
  V7RepresentativeReviewDecisionError,
  validateRepresentativeReviewDecision,
  validateRepresentativeReviewDecisionLedger
} from '../../src/v7/content/representative-review-decisions.js';

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

const canonical = canonicalRepresentativeItems();
const canonicalById = new Map(canonical.map(item => [item.id, item]));
const packet = readJson('../../data/v7/curation/representative-library-review-packet.json');
const packetById = new Map(packet.items.map(item => [item.itemId, item]));
const ledger = readJson('../../data/v7/curation/representative-library-review-decisions.json');

function makeDecision(itemId, outcome = 'approved') {
  const item = canonicalById.get(itemId);
  const packetItem = packetById.get(itemId);
  const checks = packetItem.requiredChecks.map(id => ({ id, result: 'pass' }));
  if (outcome === 'rejected') checks[checks.length - 1] = { ...checks[checks.length - 1], result: 'fail', note: 'Authorized reviewer found this check unsatisfied.' };

  return {
    schemaVersion: 1,
    itemId,
    revision: item.revision,
    outcome,
    reviewer: 'authorized-reviewer-test-fixture',
    decidedAt: '2026-10-06T12:00:00Z',
    rightsStatusSnapshot: item.rights.status,
    evidenceRefs: [...packetItem.repositoryEvidenceRefs],
    checks,
    note: 'Synthetic contract-test decision only; not repository review evidence.'
  };
}

function assertDecisionError(fn, code) {
  assert.throws(fn, error => error instanceof V7RepresentativeReviewDecisionError && error.code === code);
}

test('A2 current review decision ledger remains empty and explicitly non-authorizing', () => {
  const normalized = validateRepresentativeReviewDecisionLedger(ledger, canonical, packet);

  assert.equal(normalized.status, 'awaiting_authorized_decisions');
  assert.deepEqual(normalized.decisions, []);
  assert.equal(normalized.boundary.doesNotApproveByPresence, true);
  assert.equal(normalized.boundary.doesNotPublishContent, true);
  assert.equal(normalized.boundary.doesNotChangeRights, true);
  assert.equal(normalized.boundary.authorizedReviewerRequired, true);
});

test('A2 decision contract accepts a complete approval only for a verified-rights current revision', () => {
  const itemId = 'books.pilgrims-progress';
  const normalized = validateRepresentativeReviewDecision(
    makeDecision(itemId),
    canonicalById.get(itemId),
    packetById.get(itemId)
  );

  assert.equal(normalized.itemId, itemId);
  assert.equal(normalized.outcome, 'approved');
  assert.equal(normalized.rightsStatusSnapshot, 'verified');
  assert.deepEqual(normalized.checks.map(check => check.id), packetById.get(itemId).requiredChecks);
  assert.ok(normalized.checks.every(check => check.result === 'pass'));
});

test('A2 decision contract rejects approval while Past Teaching rights remain unknown', () => {
  const itemId = 'teaching.prayer-abiding';
  assertDecisionError(
    () => validateRepresentativeReviewDecision(
      makeDecision(itemId),
      canonicalById.get(itemId),
      packetById.get(itemId)
    ),
    'rights_not_verified'
  );
});

test('A2 decision contract permits an evidence-backed rejection when a required check fails', () => {
  const itemId = 'teaching.prayer-abiding';
  const normalized = validateRepresentativeReviewDecision(
    makeDecision(itemId, 'rejected'),
    canonicalById.get(itemId),
    packetById.get(itemId)
  );

  assert.equal(normalized.outcome, 'rejected');
  assert.ok(normalized.checks.some(check => check.result === 'fail'));
});

test('A2 decision contract rejects incomplete checklists, stale revisions and dropped required evidence', () => {
  const itemId = 'devotional.spurgeon.january-02-am';
  const item = canonicalById.get(itemId);
  const packetItem = packetById.get(itemId);

  const incomplete = makeDecision(itemId);
  incomplete.checks.pop();
  assertDecisionError(() => validateRepresentativeReviewDecision(incomplete, item, packetItem), 'checks');

  const stale = makeDecision(itemId);
  stale.revision = 'stale-revision';
  assertDecisionError(() => validateRepresentativeReviewDecision(stale, item, packetItem), 'revision');

  const missingEvidence = makeDecision(itemId);
  missingEvidence.evidenceRefs.pop();
  assertDecisionError(() => validateRepresentativeReviewDecision(missingEvidence, item, packetItem), 'evidence_refs');
});

test('A2 decision ledger derives partial/complete status and rejects duplicate decisions', () => {
  const partial = {
    ...ledger,
    status: 'partial_authorized_decisions',
    decisions: [makeDecision('books.pilgrims-progress')]
  };
  assert.equal(validateRepresentativeReviewDecisionLedger(partial, canonical, packet).status, 'partial_authorized_decisions');

  const duplicate = {
    ...ledger,
    status: 'partial_authorized_decisions',
    decisions: [makeDecision('books.pilgrims-progress'), makeDecision('books.pilgrims-progress')]
  };
  assertDecisionError(() => validateRepresentativeReviewDecisionLedger(duplicate, canonical, packet), 'duplicate_decision');
});
