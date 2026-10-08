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
  assert.equal(decision.criteria.every(row => row.result === 'pass' && row.evaluatedAt === new Date(EVALUATED_AT).toISOString()), true);
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

function reviewedVisualAsset(patch = {}) {
  return {
    id: 'devotional-cover',
    source: { uri: 'https://example.com/cover.png' },
    provenance: { evidenceRefs: ['evidence:asset-generation'] },
    rights: { status: 'verified', allowedUses: ['display'], evidenceRefs: ['evidence:asset-license'] },
    altText: 'A sunrise over the hills',
    fallback: 'theme-gradient',
    ...patch
  };
}

test('attached visual assets must carry independent source and permitted-use evidence', () => {
  const valid = item('devotional', { visualAssets: [reviewedVisualAsset()] });
  const approved = evaluateV7LibraryApproval({
    item: valid, evaluations: passingEvaluations('devotional'), secondPass: secondPass()
  });
  assert.equal(approved.outcome, 'auto_approved');
  assert.equal(canAutoPublishV7LibraryDecision(approved, valid), true);

  const missingRights = item('devotional', { visualAssets: [reviewedVisualAsset({ rights: { status: 'unknown', allowedUses: ['display'] } })] });
  const rejected = evaluateV7LibraryApproval({
    item: missingRights, evaluations: passingEvaluations('devotional'), secondPass: secondPass()
  });
  assert.equal(rejected.outcome, 'rejected');
  assert.ok(rejected.rejectionReasons.includes('visual_asset_0_rights_unverified'));
  assert.equal(canAutoPublishV7LibraryDecision(rejected, missingRights), false);

  const unknownSource = item('devotional', { visualAssets: [reviewedVisualAsset({ provenance: { evidenceRefs: [] } })] });
  const unproven = evaluateV7LibraryApproval({
    item: unknownSource, evaluations: passingEvaluations('devotional'), secondPass: secondPass()
  });
  assert.equal(unproven.outcome, 'rejected');
  assert.ok(unproven.rejectionReasons.includes('visual_asset_0_provenance_unverified'));
});

test('missing visual alt text or fallback enters automated repair rather than publication', () => {
  for (const [field, reason] of [['altText', 'visual_asset_0_alt_missing'], ['fallback', 'visual_asset_0_fallback_missing']]) {
    const target = item('devotional', { visualAssets: [reviewedVisualAsset({ [field]: '' })] });
    const decision = evaluateV7LibraryApproval({
      item: target, evaluations: passingEvaluations('devotional'), secondPass: secondPass()
    });
    assert.equal(decision.outcome, 'needs_repair');
    assert.ok(decision.repairReasons.includes(reason));
    assert.equal(canAutoPublishV7LibraryDecision(decision, target), false);
  }
});

test('an approved decision cannot publish an attached visual asset whose rights change', () => {
  const original = item('book', { visualAssets: [reviewedVisualAsset()] });
  const approval = evaluateV7LibraryApproval({
    item: original, evaluations: passingEvaluations('book'), secondPass: secondPass()
  });
  const changed = item('book', { visualAssets: [reviewedVisualAsset({ rights: { status: 'unknown', allowedUses: [] } })] });
  assert.equal(canAutoPublishV7LibraryDecision(approval, changed), false);
});
