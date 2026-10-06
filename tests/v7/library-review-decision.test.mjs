import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateV7LibraryApproval, requiredV7LibraryApprovalCriteria } from '../../src/v7/content/automated-approval-policy.js';
import {
  createV7LibraryHumanOverride,
  normalizeV7AutomatedPolicyDecision,
  validateV7LibraryReviewDecision
} from '../../src/v7/content/library-review-decision.js';

const NOW = '2026-10-07T01:00:00Z';

function target() {
  return {
    id: 'book.test',
    type: 'book',
    revision: 'r1',
    source: { kind: 'external' },
    rights: { status: 'verified', allowedUses: ['display'] }
  };
}

function automated() {
  return evaluateV7LibraryApproval({
    item: target(),
    decidedAt: NOW,
    evaluations: requiredV7LibraryApprovalCriteria('book').map(row => ({
      id: row.id,
      result: 'pass',
      evaluator: 'primary-policy-run',
      evaluatedAt: NOW,
      evidenceRefs: [`evidence:${row.id}`]
    })),
    secondPass: {
      result: 'pass',
      revision: 'r1',
      evaluator: 'independent-policy-run',
      evaluatedAt: NOW,
      evidenceRefs: ['evidence:adversarial']
    }
  });
}

test('Lane B persists automated decisions without inventing a human reviewer', () => {
  const normalized = normalizeV7AutomatedPolicyDecision(automated());

  assert.equal(normalized.reviewerType, 'automated_policy');
  assert.equal(normalized.outcome, 'auto_approved');
  assert.equal(normalized.policyId, 'biblequest.v7.library-release');
  assert.equal(normalized.policyVersion, '1.0.0');
  assert.equal('reviewerId' in normalized, false);
  assert.ok(normalized.evidenceRefs.includes('evidence:adversarial'));
  assert.equal(normalized.secondPass.result, 'pass');
  assert.equal(normalized.secondPass.revision, 'r1');
  assert.equal(normalized.secondPass.evaluator, 'independent-policy-run');
  assert.ok(normalized.criteria.length > 10);
});

test('human post-release override is explicit and cannot claim policy identity', () => {
  const override = createV7LibraryHumanOverride({
    itemId: 'book.test',
    revision: 'r1',
    contentType: 'book',
    outcome: 'request_changes',
    reviewerId: 'user-123',
    decidedAt: NOW,
    evidenceRefs: ['audit:note'],
    note: 'Source attribution needs correction.'
  });

  assert.equal(override.reviewerType, 'human');
  assert.equal(override.outcome, 'request_changes');
  assert.equal(override.reviewerId, 'user-123');
  assert.equal('policyId' in override, false);

  assert.throws(() => validateV7LibraryReviewDecision({
    ...override,
    policyId: 'fake-policy'
  }), /must not claim automated policy identity/);
});

test('automated decisions fail validation without policy identity or criterion evidence', () => {
  const decision = normalizeV7AutomatedPolicyDecision(automated());

  assert.throws(() => validateV7LibraryReviewDecision({
    ...decision,
    policyVersion: ''
  }), /policyVersion is required/);

  const criteria = decision.criteria.map((row, index) => index === 0 ? { ...row, evidenceRefs: [] } : row);
  assert.throws(() => validateV7LibraryReviewDecision({
    ...decision,
    criteria
  }), /must contain evidence/);
});

test('review decision remains exact-revision bound', () => {
  const decision = normalizeV7AutomatedPolicyDecision(automated());
  assert.equal(decision.itemId, 'book.test');
  assert.equal(decision.revision, 'r1');
  assert.equal(decision.decidedAt, NOW);
});


test('auto-approved persistence rejects stale or non-independent second-pass evidence', () => {
  const decision = normalizeV7AutomatedPolicyDecision(automated());

  assert.throws(() => validateV7LibraryReviewDecision({
    ...decision,
    secondPass: { ...decision.secondPass, revision: 'r0' }
  }), /secondPass revision parity/);

  assert.throws(() => validateV7LibraryReviewDecision({
    ...decision,
    secondPass: { ...decision.secondPass, evaluator: decision.criteria[0].evaluator }
  }), /independent secondPass evaluator/);
});
