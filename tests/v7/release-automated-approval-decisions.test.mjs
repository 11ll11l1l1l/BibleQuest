import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildReleaseAutomatedApprovalLedger,
  collectReleaseApprovalEntries,
} from '../../scripts/v7-release-automated-approval-decisions.mjs';

const CANDIDATE = 'a'.repeat(40);
const EVALUATED_AT = '2026-10-07T09:30:00.000Z';

test('current Lane A factory corpus produces complete exact-revision automated approvals', async () => {
  const entries = await collectReleaseApprovalEntries();
  assert.ok(entries.length >= 174);
  const ledger = buildReleaseAutomatedApprovalLedger({
    candidateSha: CANDIDATE,
    entries,
    decidedAt: EVALUATED_AT,
  });
  assert.equal(ledger.candidateSha, CANDIDATE);
  assert.equal(ledger.status, 'complete');
  assert.equal(ledger.counts.releaseItems, entries.length);
  assert.equal(ledger.counts.autoApproved, entries.length);
  assert.equal(ledger.counts.needsRepair, 0);
  assert.equal(ledger.counts.rejected, 0);
  assert.ok(ledger.decisions.every(row => row.outcome === 'auto_approved'));
  assert.ok(ledger.decisions.every(row => row.secondPass.evaluator !== row.criteria[0].evaluator));
});

test('release approval materialization fails closed when committed rights evidence is tampered', async () => {
  const entries = await collectReleaseApprovalEntries();
  const [first, ...rest] = entries;
  const tampered = {
    ...first,
    item: {
      ...first.item,
      rights: {
        ...first.item.rights,
        status: 'unknown',
        allowedUses: [],
      },
    },
  };
  const ledger = buildReleaseAutomatedApprovalLedger({
    candidateSha: CANDIDATE,
    entries: [tampered, ...rest],
    decidedAt: EVALUATED_AT,
  });
  assert.equal(ledger.status, 'needs_repair');
  assert.equal(ledger.counts.autoApproved, entries.length - 1);
  assert.equal(ledger.counts.rejected, 1);
  assert.ok(ledger.decisions.find(row => row.itemId === first.item.id)?.outcome === 'rejected');
});
