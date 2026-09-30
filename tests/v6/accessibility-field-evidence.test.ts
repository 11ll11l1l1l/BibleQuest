import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) => fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

const manualOpen = '- [ ] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.';
const manualPass = '- [x] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.';
const classOpen = '- [ ] Acceptance PASS requires exact-head evidence of the correct class: automated, browser, backend and/or physical-device as applicable.';
const classPass = '- [x] Acceptance PASS requires exact-head evidence of the correct class: automated, browser, backend and/or physical-device as applicable.';

test('manual accessibility acceptance cannot pass without exact physical-device evidence', () => {
  const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  const evidence = read('docs/v6/V6_ACCESSIBILITY_FIELD_EVIDENCE.md');
  assert.ok(checklist.includes(manualOpen) || checklist.includes(manualPass));
  assert.ok(checklist.includes(classOpen) || checklist.includes(classPass));
  assert.match(evidence, /^Evidence class: PHYSICAL-DEVICE$/m);
  if (checklist.includes(manualOpen)) {
    assert.match(evidence, /^Status: PENDING$/m);
    return;
  }
  assert.match(evidence, /^Status: PASS$/m);
  assert.match(evidence, /^Exact candidate SHA: [0-9a-f]{40}$/m);
  for (const field of ['Evidence date \\(JST\\)', 'Tester', 'Device \\/ OS \\/ browser', 'Assistive technology']) {
    assert.match(evidence, new RegExp(`^${field}: (?!PENDING$).+$`, 'm'));
  }
  for (const check of ['Keyboard-only','Screen reader','Text scaling','Touch/mobile','Reduced motion','Contrast']) {
    assert.match(evidence, new RegExp(`^- ${check}: PASSimport assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) => fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

const manualOpen = '- [ ] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.';
const manualPass = '- [x] Critical physical/manual accessibility acceptance is recorded where automation cannot prove behavior.';
const classOpen = '- [ ] Acceptance PASS requires exact-head evidence of the correct class: automated, browser, backend and/or physical-device as applicable.';
const classPass = '- [x] Acceptance PASS requires exact-head evidence of the correct class: automated, browser, backend and/or physical-device as applicable.';

test('manual accessibility acceptance cannot pass without exact physical-device evidence', () => {
  const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  const evidence = read('docs/v6/V6_ACCESSIBILITY_FIELD_EVIDENCE.md');
  assert.ok(checklist.includes(manualOpen) || checklist.includes(manualPass));
  assert.ok(checklist.includes(classOpen) || checklist.includes(classPass));
  assert.match(evidence, /^Evidence class: PHYSICAL-DEVICE$/m);
  if (checklist.includes(manualOpen)) {
    assert.match(evidence, /^Status: PENDING$/m);
    return;
  }
  assert.match(evidence, /^Status: PASS$/m);
  assert.match(evidence, /^Exact candidate SHA: [0-9a-f]{40}$/m);
  for (const field of ['Evidence date \\(JST\\)', 'Tester', 'Device \\/ OS \\/ browser', 'Assistive technology']) {
    assert.match(evidence, new RegExp(`^${field}: (?!PENDING$).+$`, 'm'));
  }
, 'm'));
  }
  const notes = evidence.match(/## Observation notes\n\n([\s\S]*?)\n\n## Evidence attachments \/ references/);
  const references = evidence.match(/## Evidence attachments \/ references\n\n([\s\S]*?)\n\n## Promotion rule/);
  assert.ok(notes && notes[1].trim() && notes[1].trim() !== 'PENDING', 'manual PASS requires recorded observation notes');
  assert.ok(references && references[1].trim() && references[1].trim() !== 'PENDING', 'manual PASS requires auditable evidence references');
});
