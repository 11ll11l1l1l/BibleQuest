import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

test('field/device acceptance is bound to exact-candidate physical evidence', () => {
  const checklist = read('V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md');
  const evidence = read('docs/v6/V6_FIELD_DEVICE_EVIDENCE.md');
  const open = '- [ ] Required field/device evidence is attached to exact candidate.';
  const checked = '- [x] Required field/device evidence is attached to exact candidate.';

  assert.ok(checklist.includes(open) || checklist.includes(checked));
  assert.match(evidence, /^Evidence class: PHYSICAL-DEVICE$/m);

  if (checklist.includes(open)) {
    assert.match(evidence, /^Status: PENDING$/m);
    return;
  }

  assert.match(evidence, /^Status: PASS$/m);
  assert.match(evidence, /^Candidate SHA: [0-9a-f]{40}$/m);
  assert.match(evidence, /^Evidence date \(JST\): (?!PENDING$).+$/m);
  assert.match(evidence, /^Tester: (?!PENDING$).+$/m);

  const required = [
    'Manual accessibility: keyboard/focus',
    'Manual accessibility: screen reader',
    'Manual accessibility: text scaling/readability',
    'Manual accessibility: touch/mobile targets and overflow',
    'Manual accessibility: reduced motion/contrast',
    'Installed-PWA offline behavior',
    'Physical-device push delivery',
    'Background/lock-screen media controls where supported',
  ];

  for (const label of required) {
    const line = evidence.split('\n').find(value => value.startsWith('| ' + label + ' |'));
    assert.ok(line, label + ' evidence row must exist');
    const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
    assert.equal(cells[1], 'PASS', label + ' must pass before aggregate closure');
    assert.notEqual(cells[2], 'PENDING', label + ' must identify the device');
    assert.notEqual(cells[3], 'PENDING', label + ' must identify the environment');
    assert.notEqual(cells[4], 'PENDING', label + ' must have a durable evidence reference');
    assert.notEqual(cells[5], 'PENDING', label + ' must record the observation');
  }
});
