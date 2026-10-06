import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAutoPublishV7LibraryDecision,
  evaluateV7LibraryApproval,
  requiredV7LibraryApprovalCriteria
} from '../../src/v7/content/automated-approval-policy.js';

const EVALUATED_AT = '2026-10-07T00:00:00Z';

function item(type = 'book', patch = {}) {
  return {
    id: `${type}.fixture`,
    type,
    revision: 'r1',
    source: { kind: 'external' },
    rights: {
      status: 'verified',
      allowedUses: ['display']
    },
    ...patch
  };
}

function passingEvaluations(type = 'book', evaluator = 'policy-primary') {
  return requiredV7LibraryApprovalCriteria(type).map(criterion => ({
    id: criterion.id,
    result: 'pass',
    evaluator,
    evaluatedAt: EVALUATED_AT,
    evidenceRefs: [`evidence:${criterion.id}`]
  }));
}

function secondPass(patch = {}) {
  return {
    result: 'pass',
    revision: 'r1',
    evaluator: 'policy-adversarial',
    evaluatedAt: EVALUATED_AT,
    evidenceRefs: ['evidence:second-pass'],
    ...patch
  };
}

test('Lane B policy auto-approves only a complete evidence-backed independent pass', () => {
  const target = item('book');
  const decision = evaluateV7LibraryApproval({
    item: target,
    evaluations: passingEvaluations('book'),
    secondPass: secondPass(),
    decidedAt: EVALUATED_AT
  });

  assert.equal(decision.outcome, 'auto_approved');
  assert.equal(decision.reviewerType, 'automated_policy');
  assert.equal(decision.policyId, 'biblequest.v7.library-release');
  assert.equal(decision.policyVersion, '1.0.0');
  assert.equal(decision.criteria.every(row => row.result === 'pass' && row.evaluatedAt === EVALUATED_AT), true);
  assert.equal(decision.secondPass.ready, true);
  assert.equal(decision.auditable, true);
  assert.equal(canAutoPublishV7LibraryDecision(decision, target), true);
});

test('unknown or unverified rights are a hard rejection and can never auto-publish', () => {
  const target = item('book', { rights: { status: 'unknown', allowedUses: [] } });
  const decision = evaluateV7LibraryApproval({
    item: target,
    evaluations: passingEvaluations('book'),
    secondPass: secondPass()
  });

  assert.equal(decision.outcome, 'rejected');
  assert.ok(decision.rejectionReasons.includes('rights_not_verified'));
  assert.equal(canAutoPublishV7LibraryDecision(decision, target), false);
});

test('missing semantic evidence fails closed into the machine repair queue', () => {
  const target = item('book');
  const evaluations = passingEvaluations('book').filter(row => row.id !== 'editorial_coherence');
  const decision = evaluateV7LibraryApproval({
    item: target,
    evaluations,
    secondPass: secondPass()
  });

  assert.equal(decision.outcome, 'needs_repair');
  assert.ok(decision.repairReasons.includes('editorial_coherence'));
  assert.equal(canAutoPublishV7LibraryDecision(decision, target), false);
});

test('hard-critical but repairable failure blocks publication and enters machine repair', () => {
  const target = item('book');
  const evaluations = passingEvaluations('book').map(row => row.id === 'theological_fidelity'
    ? { ...row, result: 'fail', note: 'Regenerate or repair the conflicting treatment.' }
    : row);
  const decision = evaluateV7LibraryApproval({
    item: target,
    evaluations,
    secondPass: secondPass()
  });

  assert.equal(decision.outcome, 'needs_repair');
  assert.ok(decision.repairReasons.includes('theological_fidelity'));
  assert.equal(decision.criteria.find(row => row.id === 'theological_fidelity').hard, true);
  assert.equal(canAutoPublishV7LibraryDecision(decision, target), false);
});

test('terminal permitted-use failure is rejected rather than sent through content regeneration', () => {
  const target = item('book');
  const evaluations = passingEvaluations('book').map(row => row.id === 'permitted_use_rights'
    ? { ...row, result: 'fail', note: 'The intended hosted use is not permitted.' }
    : row);
  const decision = evaluateV7LibraryApproval({
    item: target,
    evaluations,
    secondPass: secondPass()
  });

  assert.equal(decision.outcome, 'rejected');
  assert.ok(decision.rejectionReasons.includes('permitted_use_rights'));
});

test('repairable criterion failure does not masquerade as approval or terminal rejection', () => {
  const target = item('book');
  const evaluations = passingEvaluations('book').map(row => row.id === 'editorial_coherence'
    ? { ...row, result: 'fail', note: 'Repair the fragmented paragraph before reevaluation.' }
    : row);
  const decision = evaluateV7LibraryApproval({
    item: target,
    evaluations,
    secondPass: secondPass()
  });

  assert.equal(decision.outcome, 'needs_repair');
  assert.deepEqual(decision.rejectionReasons, []);
  assert.ok(decision.repairReasons.includes('editorial_coherence'));
});

test('devotionals require complete multilingual translation quality gates', () => {
  const criteria = requiredV7LibraryApprovalCriteria('devotional').map(row => row.id);
  assert.ok(criteria.includes('translation_completeness'));
  assert.ok(criteria.includes('translation_semantic_fidelity'));
  assert.ok(criteria.includes('translation_naturalness'));

  const target = item('devotional');
  const decision = evaluateV7LibraryApproval({
    item: target,
    evaluations: passingEvaluations('devotional').map(row => row.id === 'translation_semantic_fidelity'
      ? { ...row, result: 'fail' }
      : row),
    secondPass: secondPass()
  });
  assert.equal(decision.outcome, 'needs_repair');
  assert.ok(decision.repairReasons.includes('translation_semantic_fidelity'));
});

test('second pass must bind the exact revision and be independent of primary evaluation', () => {
  const target = item('book');
  const stale = evaluateV7LibraryApproval({
    item: target,
    evaluations: passingEvaluations('book'),
    secondPass: secondPass({ revision: 'r0' })
  });
  assert.equal(stale.outcome, 'rejected');
  assert.ok(stale.rejectionReasons.includes('second_pass_revision_mismatch'));

  const sameEvaluator = evaluateV7LibraryApproval({
    item: target,
    evaluations: passingEvaluations('book', 'same-policy-run'),
    secondPass: secondPass({ evaluator: 'same-policy-run' })
  });
  assert.equal(sameEvaluator.outcome, 'needs_repair');
  assert.ok(sameEvaluator.repairReasons.includes('independent_second_pass_incomplete'));
});

test('evaluation timestamps are mandatory audit evidence', () => {
  const target = item('book');
  const evaluations = passingEvaluations('book');
  delete evaluations[0].evaluatedAt;
  assert.throws(
    () => evaluateV7LibraryApproval({ item: target, evaluations, secondPass: secondPass() }),
    /evaluatedAt must be a valid timestamp/
  );
});
