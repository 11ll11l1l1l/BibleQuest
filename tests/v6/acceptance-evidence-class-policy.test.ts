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

type EvidenceReference = Readonly<{
  kind: 'workflow' | 'artifact' | 'physical-record';
  name?: string;
  id: string;
}>;

type EvidenceRecord = Readonly<{
  headSha: string;
  classes: readonly EvidenceClass[];
  references: readonly EvidenceReference[];
}>;

type PolicyRow = Readonly<{
  row: string;
  requiredClasses: readonly EvidenceClass[];
  evidence: EvidenceRecord | null;
}>;

type EvidencePolicy = Readonly<{
  schemaVersion: number;
  coverageStatus: 'PARTIAL' | 'COMPLETE';
  targetRow: string;
  allowedEvidenceClasses: readonly EvidenceClass[];
  rows: readonly PolicyRow[];
}>;

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
const policy = JSON.parse(read('docs/v6/V6_ACCEPTANCE_EVIDENCE_POLICY.json')) as EvidencePolicy;
const allowed = new Set<EvidenceClass>(policy.allowedEvidenceClasses);

function checklistState(row: string): 'open' | 'checked' {
  const open = '- [ ] ' + row;
  const checked = '- [x] ' + row;
  const hasOpen = checklist.includes(open);
  const hasChecked = checklist.includes(checked);
  assert.notEqual(hasOpen, hasChecked, row + ' must appear exactly once in the checklist');
  return hasChecked ? 'checked' : 'open';
}

function validateEvidence(row: PolicyRow, evidence: EvidenceRecord) {
  assert.match(evidence.headSha, /^[0-9a-f]{40}$/, row.row + ' needs an exact 40-character source SHA');
  assert.ok(evidence.classes.length > 0, row.row + ' needs at least one evidence class');
  assert.equal(new Set(evidence.classes).size, evidence.classes.length, row.row + ' evidence classes must be unique');

  for (const evidenceClass of evidence.classes) {
    assert.ok(allowed.has(evidenceClass), row.row + ' uses an unknown evidence class: ' + evidenceClass);
  }
  for (const required of row.requiredClasses) {
    assert.ok(evidence.classes.includes(required), row.row + ' is missing required evidence class ' + required);
  }

  assert.ok(evidence.references.length > 0, row.row + ' needs at least one durable evidence reference');
  for (const reference of evidence.references) {
    assert.ok(reference.id.trim().length > 0, row.row + ' contains an empty evidence reference');
  }

  if (row.requiredClasses.includes('PHYSICAL-DEVICE')) {
    assert.ok(
      evidence.references.some(reference => reference.kind === 'physical-record'),
      row.row + ' requires a physical-record reference; workflow/browser evidence is not a substitute',
    );
  }
}

test('W4/device-sensitive acceptance rows fail closed unless the required evidence class is recorded', () => {
  assert.equal(policy.schemaVersion, 1);
  assert.deepEqual(
    [...policy.allowedEvidenceClasses].sort(),
    ['BUILT-BROWSER', 'DATABASE', 'DEPLOYED', 'EXTERNAL-LIVE', 'PHYSICAL-DEVICE', 'STATIC', 'UNIT'].sort(),
  );
  assert.equal(new Set(policy.rows.map(row => row.row)).size, policy.rows.length, 'policy rows must be unique');

  for (const row of policy.rows) {
    assert.ok(row.requiredClasses.length > 0, row.row + ' needs at least one required evidence class');
    for (const required of row.requiredClasses) {
      assert.ok(allowed.has(required), row.row + ' requires an unknown evidence class: ' + required);
    }

    const state = checklistState(row.row);
    if (state === 'checked') {
      assert.ok(row.evidence, row.row + ' is checked but has no evidence record');
      validateEvidence(row, row.evidence);
    } else if (row.evidence) {
      validateEvidence(row, row.evidence);
    }
  }
});

test('cross-cutting evidence-class acceptance cannot close while policy coverage is partial', () => {
  const state = checklistState(policy.targetRow);
  if (state === 'open') return;

  assert.equal(policy.coverageStatus, 'COMPLETE', 'cross-cutting evidence-class row requires COMPLETE policy coverage');
  for (const row of policy.rows) {
    assert.equal(checklistState(row.row), 'checked', row.row + ' must be checked before evidence-class closure');
    assert.ok(row.evidence, row.row + ' must have exact evidence before evidence-class closure');
    validateEvidence(row, row.evidence);
  }
});
