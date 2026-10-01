import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (relative: string) =>
  fs.readFileSync(new URL('../../' + relative, import.meta.url), 'utf8');

test('W4 field execution procedure stays exact-candidate and physical-evidence fail-closed', () => {
  const note = read('docs/v6/W4_FIELD_EXECUTION_NOTE.md');
  const evidence = read('docs/v6/V6_FIELD_DEVICE_EVIDENCE.md');
  const harness = read('v6-field-device.js');

  assert.match(note, /exact V6 candidate commit SHA/i);
  assert.match(note, /same SHA/i);
  assert.match(note, /physical device/i);
  assert.match(note, /screen-reader labels\/announcements/i);
  assert.match(note, /200%\/large-text readability/i);
  assert.match(note, /reduced-motion behavior/i);
  assert.match(note, /offline\/reopen behavior/i);
  assert.match(note, /PASS\/FAIL per observation/i);
  assert.match(note, /FAIL-CLOSED\/PENDING/i);
  assert.match(note, /Browser emulation is not physical-device evidence/i);

  assert.match(evidence, /^Evidence class: PHYSICAL-DEVICE$/m);
  assert.match(evidence, /v6-field-device\.html/);
  assert.match(harness, /fetch\('\.\/bq-build\.json'/);
  assert.match(harness, /evidenceClass: 'PHYSICAL-DEVICE'/);
  assert.match(harness, /PASS requires every physical sub-check/);
});
