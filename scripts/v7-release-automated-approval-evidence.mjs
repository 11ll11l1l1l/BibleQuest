import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  V7_LIBRARY_APPROVAL_POLICY_ID,
  V7_LIBRARY_APPROVAL_POLICY_VERSION,
  requiredV7LibraryApprovalCriteria,
} from '../src/v7/content/automated-approval-policy.js';
import { validateV7LibraryReviewDecision } from '../src/v7/content/library-review-decision.js';
import { buildV7LibraryMachineWorkQueue } from '../src/v7/content/automated-repair-queue.js';

const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const CURATION_DIR = join(ROOT, 'data/v7/curation');
const DEFAULT_LEDGER = join(CURATION_DIR, 'release-automated-approval-decisions.json');
const BATCH_PATTERN = /^release-content-batch-\d+-summary\.json$/;
const MINIMUM_DEVOTIONALS = 150;

function clean(value) {
  return String(value ?? '').trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function json(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function batchNames() {
  try {
    return (await readdir(CURATION_DIR)).filter(name => BATCH_PATTERN.test(name)).sort();
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
}

async function readLedger(path) {
  try {
    return await json(path);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {
        schemaVersion: 1,
        scope: 'v7_library_release_automated_approval_decisions',
        policyId: V7_LIBRARY_APPROVAL_POLICY_ID,
        policyVersion: V7_LIBRARY_APPROVAL_POLICY_VERSION,
        status: 'open',
        decisions: [],
      };
    }
    throw error;
  }
}

function decisionReleaseEligible(decision, item) {
  if (decision.reviewerType !== 'automated_policy'
      || decision.outcome !== 'auto_approved'
      || decision.policyId !== V7_LIBRARY_APPROVAL_POLICY_ID
      || decision.policyVersion !== V7_LIBRARY_APPROVAL_POLICY_VERSION
      || decision.itemId !== item.id
      || decision.revision !== item.revision
      || decision.contentType !== item.type
      || item.rights?.status !== 'verified'
      || !Array.isArray(item.rights?.allowedUses)
      || item.rights.allowedUses.length === 0
      || item.source?.kind === 'fixture') return false;

  const expected = requiredV7LibraryApprovalCriteria(item.type).map(row => row.id);
  const actual = decision.criteria.map(row => row.id);
  if (actual.length !== expected.length || expected.some((id, index) => actual[index] !== id)) return false;
  if (decision.criteria.some(row => row.result !== 'pass'
      || !clean(row.evaluator)
      || !clean(row.evaluatedAt)
      || !Array.isArray(row.evidenceRefs)
      || row.evidenceRefs.length === 0)) return false;

  const primaryEvaluators = new Set(decision.criteria.map(row => row.evaluator));
  return decision.secondPass?.result === 'pass'
    && decision.secondPass?.revision === item.revision
    && clean(decision.secondPass?.evaluator)
    && !primaryEvaluators.has(decision.secondPass.evaluator)
    && clean(decision.secondPass?.evaluatedAt)
    && Array.isArray(decision.secondPass?.evidenceRefs)
    && decision.secondPass.evidenceRefs.length > 0;
}

export function buildLaneBAutomatedApprovalEvidence({
  candidateSha = '',
  items = [],
  decisions = [],
  ledgerPath = 'data/v7/curation/release-automated-approval-decisions.json',
  minimumDevotionals = MINIMUM_DEVOTIONALS,
} = {}) {
  assert(Array.isArray(items), 'items must be an array');
  assert(Array.isArray(decisions), 'decisions must be an array');

  const itemById = new Map();
  for (const item of items) {
    assert(item?.id, 'release factory item id is required');
    assert(!itemById.has(item.id), `duplicate release factory item ${item.id}`);
    itemById.set(item.id, item);
  }

  const normalizedDecisions = [];
  const decisionByItem = new Map();
  for (const [index, raw] of decisions.entries()) {
    const decision = validateV7LibraryReviewDecision(raw);
    const item = itemById.get(decision.itemId);
    assert(item, `approval ledger decision ${index} targets non-release item ${decision.itemId}`);
    assert(decision.revision === item.revision,
      `${decision.itemId}: approval decision revision ${decision.revision} does not match release revision ${item.revision}`);
    assert(decision.contentType === item.type,
      `${decision.itemId}: approval decision content type does not match release item`);
    assert(!decisionByItem.has(decision.itemId),
      `${decision.itemId}: approval ledger contains multiple current decisions`);
    decisionByItem.set(decision.itemId, decision);
    normalizedDecisions.push(decision);
  }

  let autoApproved = 0;
  let needsRepair = 0;
  let rejected = 0;
  let ineligibleApproval = 0;
  const missingDecisionIds = [];
  const ineligibleApprovalIds = [];

  for (const item of items) {
    const decision = decisionByItem.get(item.id);
    if (!decision) {
      missingDecisionIds.push(item.id);
      continue;
    }
    if (decision.outcome === 'needs_repair') {
      needsRepair += 1;
      continue;
    }
    if (decision.outcome === 'rejected') {
      rejected += 1;
      continue;
    }
    if (decisionReleaseEligible(decision, item)) {
      autoApproved += 1;
    } else {
      ineligibleApproval += 1;
      ineligibleApprovalIds.push(item.id);
    }
  }

  const machineWork = buildV7LibraryMachineWorkQueue(normalizedDecisions, { minimumDevotionals });
  const devotionalCount = items.filter(item => item.type === 'devotional').length;
  const launchFloorMet = devotionalCount >= minimumDevotionals;
  const allReleaseItemsApproved = items.length > 0
    && autoApproved === items.length
    && missingDecisionIds.length === 0
    && needsRepair === 0
    && rejected === 0
    && ineligibleApproval === 0;
  const readyForRelease = launchFloorMet && allReleaseItemsApproved && machineWork.releaseFloorSatisfied;

  return Object.freeze({
    schemaVersion: 1,
    candidateSha: clean(candidateSha).toLowerCase() || null,
    status: readyForRelease ? 'PASS' : 'OPEN',
    readyForRelease,
    policy: Object.freeze({
      id: V7_LIBRARY_APPROVAL_POLICY_ID,
      version: V7_LIBRARY_APPROVAL_POLICY_VERSION,
      minimumDevotionals,
      ledger: ledgerPath,
    }),
    counts: Object.freeze({
      releaseItems: items.length,
      devotionals: devotionalCount,
      decisions: normalizedDecisions.length,
      autoApproved,
      needsRepair,
      rejected,
      ineligibleApproval,
      missingDecisions: missingDecisionIds.length,
      devotionalDeficit: Math.max(0, minimumDevotionals - autoApproved),
    }),
    launchFloorMet,
    allReleaseItemsApproved,
    machineWork,
    blockers: Object.freeze({
      missingDecisionIds: Object.freeze(missingDecisionIds),
      ineligibleApprovalIds: Object.freeze(ineligibleApprovalIds),
      repairItemIds: Object.freeze(normalizedDecisions.filter(row => row.outcome === 'needs_repair').map(row => row.itemId)),
      rejectedItemIds: Object.freeze(normalizedDecisions.filter(row => row.outcome === 'rejected').map(row => row.itemId)),
    }),
    boundaries: Object.freeze([
      'factory-ready-for-policy-review-is-not-release-approval',
      'stored-decision-must-bind-current-item-revision-and-content-type',
      'all-required-policy-criteria-must-pass-with-auditable-evidence',
      'independent-second-pass-must-pass-the-exact-current-revision',
      'minimum-150-auto-approved-devotionals-required',
    ]),
  });
}

export async function collectReleaseFactory() {
  const names = await batchNames();
  const items = [];
  const seen = new Set();

  for (const name of names) {
    const summary = await json(join(CURATION_DIR, name));
    assert(Array.isArray(summary.contentFiles) && summary.contentFiles.length > 0,
      `${name}: contentFiles are required`);
    for (const relativePath of summary.contentFiles) {
      const bundle = await json(join(ROOT, relativePath));
      assert(Array.isArray(bundle.items), `${relativePath}: items array is required`);
      for (const item of bundle.items) {
        assert(!seen.has(item.id), `duplicate release factory item ${item.id}`);
        seen.add(item.id);
        items.push(item);
      }
    }
  }
  return items;
}

async function main() {
  const candidateSha = clean(process.argv[2] || process.env.BQ_EXACT_SHA);
  const ledgerPath = resolve(process.env.BQ_V7_APPROVAL_LEDGER || DEFAULT_LEDGER);
  const [items, ledger] = await Promise.all([collectReleaseFactory(), readLedger(ledgerPath)]);
  assert(ledger.schemaVersion === 1, 'approval ledger schemaVersion must be 1');
  assert(ledger.scope === 'v7_library_release_automated_approval_decisions',
    'approval ledger scope is invalid');
  assert(ledger.policyId === V7_LIBRARY_APPROVAL_POLICY_ID, 'approval ledger policy id is stale');
  assert(ledger.policyVersion === V7_LIBRARY_APPROVAL_POLICY_VERSION, 'approval ledger policy version is stale');
  assert(Array.isArray(ledger.decisions), 'approval ledger decisions must be an array');

  const report = buildLaneBAutomatedApprovalEvidence({
    candidateSha,
    items,
    decisions: ledger.decisions,
    ledgerPath: ledgerPath.startsWith(ROOT) ? ledgerPath.slice(ROOT.length + 1) : ledgerPath,
  });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
