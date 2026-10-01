import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

const fieldRow = 'Required field/device evidence is attached to exact candidate.';
const manualAccessibilityRow =
  'Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.';

const manualGates = [
  'Manual accessibility: keyboard/focus',
  'Manual accessibility: screen reader',
  'Manual accessibility: text scaling/readability',
  'Manual accessibility: touch/mobile targets and overflow',
  'Manual accessibility: reduced motion/contrast',
];

const allFieldGates = [
  ...manualGates,
  'Installed-PWA offline behavior',
  'Physical-device push delivery',
  'Background/lock-screen media controls where supported',
];

function isChecked(checklist: string, label: string) {
  return checklist.includes('- [x] ' + label);
}

function assertExactCandidateMetadata(evidence: string) {
  assert.match(evidence, /^Evidence class: PHYSICAL-DEVICE$/m);
  assert.match(evidence, /^Candidate SHA: [0-9a-f]{40}$/m);
  assert.match(evidence, /^Evidence date \(JST\): (?!PENDING$).+$/m);
  assert.match(evidence, /^Tester: (?!PENDING$).+$/m);
}

function assertGateEvidence(evidence: string, label: string) {
  const line = evidence.split('\n').find(value => value.startsWith('| ' + label + ' |'));
  assert.ok(line, label + ' evidence row must exist');
  const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
  assert.equal(cells[1], 'PASS', label + ' must pass before checklist closure');
  assert.notEqual(cells[2], 'PENDING', label + ' must identify the device');
  assert.notEqual(cells[3], 'PENDING', label + ' must identify the environment');
  assert.notEqual(cells[4], 'PENDING', label + ' must have a durable evidence reference');
  assert.notEqual(cells[5], 'PENDING', label + ' must record the observation');
}

test('aggregate field/device acceptance is bound to exact-candidate physical evidence', () => {
  const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  const evidence = read('docs/v6/V6_FIELD_DEVICE_EVIDENCE.md');

  assert.ok(
    checklist.includes('- [ ] ' + fieldRow) || checklist.includes('- [x] ' + fieldRow),
    'field/device acceptance row must remain present',
  );
  assert.match(evidence, /^Evidence class: PHYSICAL-DEVICE$/m);

  if (!isChecked(checklist, fieldRow)) {
    assert.match(evidence, /^Status: PENDING$/m);
    return;
  }

  assert.match(evidence, /^Status: PASS$/m);
  assertExactCandidateMetadata(evidence);
  for (const label of allFieldGates) assertGateEvidence(evidence, label);
});

test('critical manual accessibility cannot pass without physical observations', () => {
  const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  const evidence = read('docs/v6/V6_FIELD_DEVICE_EVIDENCE.md');

  assert.ok(
    checklist.includes('- [ ] ' + manualAccessibilityRow) ||
      checklist.includes('- [x] ' + manualAccessibilityRow),
    'manual accessibility acceptance row must remain present',
  );

  if (!isChecked(checklist, manualAccessibilityRow)) return;

  assertExactCandidateMetadata(evidence);
  for (const label of manualGates) assertGateEvidence(evidence, label);
});

const installedPwaChecklistRow = 'Physical installed-PWA offline acceptance passes.';

test('physical installed-PWA acceptance cannot pass without exact-candidate device observation', () => {
  const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  const evidence = read('docs/v6/V6_FIELD_DEVICE_EVIDENCE.md');

  assert.ok(
    checklist.includes('- [ ] ' + installedPwaChecklistRow) ||
      checklist.includes('- [x] ' + installedPwaChecklistRow),
    'physical installed-PWA acceptance row must remain present',
  );

  if (!isChecked(checklist, installedPwaChecklistRow)) return;

  assertExactCandidateMetadata(evidence);
  assertGateEvidence(evidence, 'Installed-PWA offline behavior');
});
