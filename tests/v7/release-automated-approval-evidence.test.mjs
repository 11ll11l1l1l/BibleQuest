import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLaneBAutomatedApprovalEvidence, collectReleaseFactory } from '../../scripts/v7-release-automated-approval-evidence.mjs';
import { collectReleaseApprovalEntries } from '../../scripts/v7-release-automated-approval-decisions.mjs';
import {
  V7_LIBRARY_APPROVAL_POLICY_ID,
  V7_LIBRARY_APPROVAL_POLICY_VERSION,
  requiredV7LibraryApprovalCriteria,
} from '../../src/v7/content/automated-approval-policy.js';

const now = '2026-10-07T00:00:00.000Z';

function item(id) {
  return {
    id,
    revision: 'r1',
    type: 'devotional',
    source: { kind: 'first_party' },
    rights: { status: 'verified', allowedUses: ['display', 'translate'] },
  };
}

function approvedDecision(target) {
  const criteria = requiredV7LibraryApprovalCriteria(target.type).map(row => ({
    id: row.id,
    result: 'pass',
    hard: row.hard,
    terminal: row.terminal,
    evaluator: 'policy-primary',
    evaluatedAt: now,
    evidenceRefs: [`evidence:${row.id}`],
  }));
  return {
    schemaVersion: 1,
    itemId: target.id,
    revision: target.revision,
    contentType: target.type,
    reviewerType: 'automated_policy',
    outcome: 'auto_approved',
    policyId: V7_LIBRARY_APPROVAL_POLICY_ID,
    policyVersion: V7_LIBRARY_APPROVAL_POLICY_VERSION,
    decidedAt: now,
    evidenceRefs: criteria.flatMap(row => row.evidenceRefs).concat('evidence:second-pass'),
    criteria,
    secondPass: {
      result: 'pass',
      revision: target.revision,
      evaluator: 'policy-independent-second-pass',
      evaluatedAt: now,
      evidenceRefs: ['evidence:second-pass'],
    },
  };
}

test('Lane D approval evidence does not confuse factory handoff with release approval', () => {
  const items = [item('one'), item('two')];
  const report = buildLaneBAutomatedApprovalEvidence({
    candidateSha: 'a'.repeat(40),
    items,
    decisions: [],
    minimumDevotionals: 2,
  });
  assert.equal(report.status, 'OPEN');
  assert.equal(report.readyForRelease, false);
  assert.equal(report.counts.missingDecisions, 2);
  assert.equal(report.counts.autoApproved, 0);
});

test('Lane D approval evidence passes only exact-policy decisions with independent second pass', () => {
  const items = [item('one'), item('two')];
  const report = buildLaneBAutomatedApprovalEvidence({
    candidateSha: 'b'.repeat(40),
    items,
    decisions: items.map(approvedDecision),
    minimumDevotionals: 2,
  });
  assert.equal(report.status, 'PASS');
  assert.equal(report.readyForRelease, true);
  assert.equal(report.counts.autoApproved, 2);
  assert.equal(report.counts.catalogDeficit, 0);
  assert.equal(report.counts.approvedDevotionalDeficit, 0);
  assert.equal(report.machineWork.releaseFloorSatisfied, true);
});

test('factory evidence and automated approval ledger include all 300 release items including backfills', async () => {
  const [factory, approvals] = await Promise.all([collectReleaseFactory(), collectReleaseApprovalEntries()]);
  const releaseIds = factory.map(item => item.id).sort();
  const decisionIds = approvals.map(row => row.item.id).sort();
  assert.equal(factory.length, 300);
  assert.equal(approvals.length, 300);
  assert.deepEqual(releaseIds, decisionIds);
  assert.ok(releaseIds.includes('devotional.biblequest.guilt.11'));
});

