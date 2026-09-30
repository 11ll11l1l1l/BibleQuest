import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

const manualOpenLine =
  '- [ ] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.';
const manualCheckedLine =
  '- [x] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.';
const evidenceClassOpenLine =
  '- [ ] Acceptance PASS requires exact-head evidence of the correct class: automated, browser, backend and/or physical-device as applicable.';
const evidenceClassCheckedLine =
  '- [x] Acceptance PASS requires exact-head evidence of the correct class: automated, browser, backend and/or physical-device as applicable.';

test('manual accessibility PASS requires physical-device evidence on an exact candidate', () => {
  const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  const evidence = read('docs/v6/V6_ACCESSIBILITY_FIELD_ACCEPTANCE.md');

  assert.ok(
    checklist.includes(manualOpenLine) || checklist.includes(manualCheckedLine),
    'manual accessibility acceptance row must remain present',
  );
  assert.ok(
    checklist.includes(evidenceClassOpenLine) || checklist.includes(evidenceClassCheckedLine),
    'cross-cutting evidence-class acceptance row must remain present',
  );
  assert.match(evidence, /^Evidence class: PHYSICAL-DEVICE$/m);

  if (checklist.includes(manualOpenLine)) {
    assert.match(evidence, /^Status: PENDING$/m);
    return;
  }

  assert.match(evidence, /^Status: PASS$/m);
  assert.match(evidence, /^Exact candidate SHA: [0-9a-f]{40}$/m);
  assert.match(evidence, /^Evidence date \(JST\): (?!PENDING$).+$/m);
  assert.match(evidence, /^Tester: (?!PENDING$).+$/m);
  assert.match(evidence, /^Device \/ OS \/ browser: (?!PENDING$).+$/m);
  assert.match(evidence, /^Assistive technology: (?!PENDING$).+$/m);

  for (const check of [
    'Keyboard-only',
    'Screen reader',
    'Text scaling',
    'Touch/mobile',
    'Reduced motion',
    'Contrast',
  ]) {
    assert.match(evidence, new RegExp(`^- ${check}: PASS$`, 'm'));
  }

  assert.doesNotMatch(evidence, /^PENDING$/m);
});
