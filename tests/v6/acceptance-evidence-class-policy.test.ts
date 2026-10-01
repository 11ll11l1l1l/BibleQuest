import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

type EvidenceClass =
  | 'STATIC'
  | 'UNIT'
  | 'BUILT-BROWSER'
  | 'DATABASE'
  | 'EXTERNAL-LIVE'
  | 'DEPLOYED'
  | 'PHYSICAL-DEVICE';

type EvidenceReferenceKind =
  | 'workflow'
  | 'artifact'
  | 'physical-record'
  | 'live-record'
  | 'deployment-record'
  | 'decision-record';

type EvidenceReference = Readonly<{
  kind: EvidenceReferenceKind;
  name?: string;
  id: string;
}>;

type EvidenceRecord = Readonly<{
  headSha: string;
  classes: readonly EvidenceClass[];
  references: readonly EvidenceReference[];
}>;

type EvidenceOption = Readonly<{
  id: string;
  requiredClasses: readonly EvidenceClass[];
  requiredReferenceKinds: readonly EvidenceReferenceKind[];
}>;

type PolicyRow = Readonly<{
  row: string;
  options: readonly EvidenceOption[];
  evidence: EvidenceRecord | null;
}>;

type EvidencePolicy = Readonly<{
  schemaVersion: number;
  coverageStatus: 'PARTIAL' | 'COMPLETE';
  coverageScope: string;
  targetRow: string;
  allowedEvidenceClasses: readonly EvidenceClass[];
  allowedReferenceKinds: readonly EvidenceReferenceKind[];
  rows: readonly PolicyRow[];
}>;

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
const policy = JSON.parse(read('docs/v6/V6_ACCEPTANCE_EVIDENCE_POLICY.json')) as EvidencePolicy;
const allowedClasses = new Set<EvidenceClass>(policy.allowedEvidenceClasses);
const allowedReferenceKinds = new Set<EvidenceReferenceKind>(policy.allowedReferenceKinds);

const checklistEntries = [...checklist.matchAll(/^- \[([ x])\] (.+)$/gm)].map(match => Object.freeze({
  state: match[1] === 'x' ? 'checked' as const : 'open' as const,
  row: match[2],
}));

function checklistState(row: string): 'open' | 'checked' {
  const matches = checklistEntries.filter(entry => entry.row === row);
  assert.equal(matches.length, 1, row + ' must appear exactly once in the checklist');
  return matches[0].state;
}

function validateOption(row: PolicyRow, option: EvidenceOption) {
  assert.match(option.id, /^[a-z0-9][a-z0-9-]*$/, row.row + ' has an invalid evidence-option id');
  assert.ok(option.requiredClasses.length > 0, row.row + '/' + option.id + ' needs at least one required evidence class');
  assert.equal(
    new Set(option.requiredClasses).size,
    option.requiredClasses.length,
    row.row + '/' + option.id + ' evidence classes must be unique',
  );
  assert.equal(
    new Set(option.requiredReferenceKinds).size,
    option.requiredReferenceKinds.length,
    row.row + '/' + option.id + ' reference kinds must be unique',
  );

  for (const evidenceClass of option.requiredClasses) {
    assert.ok(allowedClasses.has(evidenceClass), row.row + '/' + option.id + ' requires unknown evidence class ' + evidenceClass);
  }
  for (const referenceKind of option.requiredReferenceKinds) {
    assert.ok(allowedReferenceKinds.has(referenceKind), row.row + '/' + option.id + ' requires unknown reference kind ' + referenceKind);
  }

  if (option.requiredClasses.includes('PHYSICAL-DEVICE')) {
    assert.ok(
      option.requiredReferenceKinds.includes('physical-record'),
      row.row + '/' + option.id + ' must require a physical-record for PHYSICAL-DEVICE evidence',
    );
  }
  if (option.requiredClasses.includes('DEPLOYED')) {
    assert.ok(
      option.requiredReferenceKinds.includes('deployment-record'),
      row.row + '/' + option.id + ' must require a deployment-record for DEPLOYED evidence',
    );
  }
  if (option.requiredClasses.includes('EXTERNAL-LIVE')) {
    assert.ok(
      option.requiredReferenceKinds.includes('live-record'),
      row.row + '/' + option.id + ' must require a live-record for EXTERNAL-LIVE evidence',
    );
  }
  if (option.requiredClasses.some(value => value === 'UNIT' || value === 'BUILT-BROWSER' || value === 'DATABASE')) {
    assert.ok(
      option.requiredReferenceKinds.includes('workflow'),
      row.row + '/' + option.id + ' automated/backend evidence must require a workflow reference',
    );
  }
}

function optionSatisfied(option: EvidenceOption, evidence: EvidenceRecord): boolean {
  const classes = new Set(evidence.classes);
  const referenceKinds = new Set(evidence.references.map(reference => reference.kind));
  return option.requiredClasses.every(value => classes.has(value))
    && option.requiredReferenceKinds.every(value => referenceKinds.has(value));
}

function validateEvidence(row: PolicyRow, evidence: EvidenceRecord) {
  assert.match(evidence.headSha, /^[0-9a-f]{40}$/, row.row + ' needs an exact 40-character source SHA');
  assert.ok(evidence.classes.length > 0, row.row + ' needs at least one evidence class');
  assert.equal(new Set(evidence.classes).size, evidence.classes.length, row.row + ' evidence classes must be unique');

  for (const evidenceClass of evidence.classes) {
    assert.ok(allowedClasses.has(evidenceClass), row.row + ' uses unknown evidence class ' + evidenceClass);
  }

  assert.ok(evidence.references.length > 0, row.row + ' needs at least one durable evidence reference');
  assert.equal(
    new Set(evidence.references.map(reference => reference.kind + ':' + reference.id)).size,
    evidence.references.length,
    row.row + ' evidence references must be unique',
  );
  for (const reference of evidence.references) {
    assert.ok(allowedReferenceKinds.has(reference.kind), row.row + ' uses unknown reference kind ' + reference.kind);
    assert.ok(reference.id.trim().length > 0, row.row + ' contains an empty evidence reference');
  }

  assert.ok(
    row.options.some(option => optionSatisfied(option, evidence)),
    row.row + ' evidence does not satisfy any approved evidence path',
  );
}

test('evidence policy is complete, typed and fail-closed for every tracked acceptance row', () => {
  assert.equal(policy.schemaVersion, 2);
  assert.equal(policy.coverageStatus, 'COMPLETE');
  assert.ok(policy.coverageScope.trim().length > 0, 'evidence-policy coverage scope must be explicit');
  assert.deepEqual(
    [...policy.allowedEvidenceClasses].sort(),
    ['BUILT-BROWSER', 'DATABASE', 'DEPLOYED', 'EXTERNAL-LIVE', 'PHYSICAL-DEVICE', 'STATIC', 'UNIT'].sort(),
  );
  assert.deepEqual(
    [...policy.allowedReferenceKinds].sort(),
    ['artifact', 'decision-record', 'deployment-record', 'live-record', 'physical-record', 'workflow'].sort(),
  );
  assert.equal(new Set(policy.rows.map(row => row.row)).size, policy.rows.length, 'policy rows must be unique');
  assert.equal(
    policy.rows.some(row => row.row === policy.targetRow),
    false,
    'the evidence-policy meta row is enforced by policy completeness, not self-referential evidence',
  );

  for (const row of policy.rows) {
    checklistState(row.row);
    assert.ok(row.options.length > 0, row.row + ' needs at least one approved evidence path');
    assert.equal(new Set(row.options.map(option => option.id)).size, row.options.length, row.row + ' option ids must be unique');
    for (const option of row.options) validateOption(row, option);

    const state = checklistState(row.row);
    if (state === 'checked') {
      assert.ok(row.evidence, row.row + ' is checked but has no typed exact-head evidence record');
      validateEvidence(row, row.evidence);
    } else if (row.evidence) {
      validateEvidence(row, row.evidence);
    }
  }
});

test('every unresolved V6 acceptance blocker has an evidence classification before the meta-policy can close', () => {
  const tracked = new Set(policy.rows.map(row => row.row));
  const unresolved = checklistEntries
    .filter(entry => entry.state === 'open' && entry.row !== policy.targetRow)
    .map(entry => entry.row);

  const unclassified = unresolved.filter(row => !tracked.has(row));
  assert.deepEqual(
    unclassified,
    [],
    'every unresolved acceptance row must declare an evidence path before the cross-cutting evidence policy is COMPLETE',
  );

  assert.equal(policy.coverageStatus, 'COMPLETE');
  assert.ok(unresolved.length > 0, 'policy completeness must not be confused with product/release completion');
});

test('cross-cutting evidence-class row may close only as a policy invariant; dependent blockers remain fail-closed', () => {
  const state = checklistState(policy.targetRow);
  if (state === 'open') return;

  assert.equal(policy.coverageStatus, 'COMPLETE', 'cross-cutting evidence-class row requires COMPLETE policy coverage');

  const tracked = new Map(policy.rows.map(row => [row.row, row]));
  const unresolved = checklistEntries.filter(entry => entry.state === 'open');
  for (const entry of unresolved) {
    if (entry.row === policy.targetRow) continue;
    const row = tracked.get(entry.row);
    assert.ok(row, entry.row + ' is open but missing from the evidence policy');
    assert.ok(row.options.length > 0, entry.row + ' is open but has no approved evidence path');
    assert.equal(
      row.evidence === null || row.evidence !== undefined,
      true,
      entry.row + ' must preserve an explicit evidence state',
    );
  }

  assert.ok(
    unresolved.some(entry => entry.row !== policy.targetRow),
    'closing the evidence-policy invariant must not imply that physical, deployed or live-service blockers passed',
  );
});
