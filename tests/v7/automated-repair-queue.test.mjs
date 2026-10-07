import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildV7LibraryMachineWorkQueue,
  evaluateV7LibraryBatch,
  V7_LIBRARY_MINIMUM_RELEASE_DEVOTIONALS
} from '../../src/v7/content/automated-repair-queue.js';
import { requiredV7LibraryApprovalCriteria } from '../../src/v7/content/automated-approval-policy.js';

const NOW = '2026-10-07T02:00:00Z';

function item(id, type = 'devotional', patch = {}) {
  return {
    id,
    type,
    revision: 'r1',
    source: { kind: 'external' },
    rights: { status: 'verified', allowedUses: ['display'] },
    ...patch
  };
}

function passes(type, evaluator = 'primary') {
  return requiredV7LibraryApprovalCriteria(type).map(row => ({
    id: row.id,
    result: 'pass',
    evaluator,
    evaluatedAt: NOW,
    evidenceRefs: [`evidence:${row.id}`]
  }));
}

function secondPass(revision = 'r1') {
  return {
    result: 'pass',
    revision,
    evaluator: 'adversarial',
    evaluatedAt: NOW,
    evidenceRefs: ['evidence:adversarial']
  };
}

test('needs_repair produces machine actions instead of a human blocker', () => {
  const target = item('devotional.repair');
  const evaluations = passes('devotional').map(row => row.id === 'translation_semantic_fidelity'
    ? { ...row, result: 'fail' }
    : row);

  const batch = evaluateV7LibraryBatch({
    items: [target],
    evaluationsByItem: { [target.id]: evaluations },
    secondPassByItem: { [target.id]: secondPass() },
    decidedAt: NOW,
    minimumDevotionals: 1
  });

  assert.equal(batch.decisions[0].outcome, 'needs_repair');
  assert.equal(batch.machineWork.work[0].kind, 'repair');
  assert.ok(batch.machineWork.work[0].actions.includes('regenerate_low_confidence_translations'));
  assert.equal(batch.machineWork.work[0].retryPolicy, 'repair_then_full_policy_reevaluation');
});

test('terminal rights rejection routes to automatic replacement', () => {
  const decision = {
    itemId: 'devotional.rights',
    revision: 'r1',
    contentType: 'devotional',
    outcome: 'rejected',
    rejectionReasons: ['rights_not_verified'],
    repairReasons: []
  };
  const queue = buildV7LibraryMachineWorkQueue([decision], { minimumDevotionals: 1 });

  const replacement = queue.work.find(row => row.kind === 'replace');
  assert.equal(replacement.replacementReason, 'rights_or_permitted_use');
  assert.deepEqual(replacement.actions, ['exclude_from_release', 'select_rights_clear_replacement']);
});

test('approved devotional floor automatically emits backfill work until >=150', () => {
  const decisions = Array.from({ length: 147 }, (_, index) => ({
    itemId: `devotional.${index}`,
    revision: 'r1',
    contentType: 'devotional',
    outcome: 'auto_approved'
  }));
  const queue = buildV7LibraryMachineWorkQueue(decisions);

  assert.equal(V7_LIBRARY_MINIMUM_RELEASE_DEVOTIONALS, 150);
  assert.equal(queue.approvedDevotionals, 147);
  assert.equal(queue.devotionalDeficit, 3);
  assert.equal(queue.releaseFloorSatisfied, false);
  const backfill = queue.work.find(row => row.kind === 'backfill');
  assert.equal(backfill.count, 3);
  assert.equal(backfill.retryPolicy, 'continue_until_minimum_auto_approved_count');
});

test('release floor is satisfied only by auto-approved devotionals', () => {
  const decisions = [
    ...Array.from({ length: 2 }, (_, index) => ({
      itemId: `devotional.approved.${index}`, revision: 'r1', contentType: 'devotional', outcome: 'auto_approved'
    })),
    { itemId: 'devotional.repair', revision: 'r1', contentType: 'devotional', outcome: 'needs_repair', repairReasons: ['editorial_coherence'] },
    { itemId: 'book.ok', revision: 'r1', contentType: 'book', outcome: 'auto_approved' }
  ];
  const queue = buildV7LibraryMachineWorkQueue(decisions, { minimumDevotionals: 2 });
  assert.equal(queue.releaseFloorSatisfied, true);
  assert.equal(queue.devotionalDeficit, 0);
  assert.equal(queue.work.filter(row => row.kind === 'backfill').length, 0);
  assert.equal(queue.work.filter(row => row.kind === 'repair').length, 1);
});
