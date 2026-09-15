import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ui = readFileSync(new URL('../src/features/admin-console/index.js', import.meta.url), 'utf8');

const checks = [];
const verify = (name, test) => {
  try {
    test();
    checks.push({ name, ok: true });
  } catch (error) {
    checks.push({ name, ok: false, error });
  }
};

verify('user cards expose identity, congregation, and security sections', () => {
  for (const section of ['identity', 'congregations', 'security']) {
    assert.match(ui, new RegExp(`data-admin-user-section=\\"${section}\\"`));
  }
});

verify('emergency actions have explicit severity presentation', () => {
  assert.match(ui, /data-admin-severity=\\"safe\\"/);
  assert.match(ui, /SAFE · SESSION/);
  assert.match(ui, /data-admin-severity=\\"elevated\\"/);
  assert.match(ui, /ELEVATED · (ACCESS|CREDENTIAL)/);
  assert.match(ui, /data-admin-severity=\\"critical\\"/);
  assert.match(ui, /CRITICAL · PERMANENT/);
});

verify('all currently accepted Phase 2 emergency action controls are rendered', () => {
  for (const marker of [
    'data-admin-force-signout',
    'data-admin-suspend-user',
    'data-admin-reactivate-user',
    'data-admin-set-temp-password',
    'data-admin-change-email',
    'data-admin-delete-user',
  ]) {
    assert.match(ui, new RegExp(marker));
  }
});

verify('destructive and identity-changing flows use typed confirmation', () => {
  assert.match(ui, /phrase=`SUSPEND \$\{user\.email\|\|user\.name\}`;typedAction\(phrase,/);
  assert.match(ui, /phrase=`CHANGE EMAIL \$\{user\.email\|\|user\.name\}`;typedAction\(phrase,/);
  assert.match(ui, /phrase=`DELETE \$\{user\.email\|\|user\.name\}`;typedAction\(phrase,/);
  assert.match(ui, /Confirmation phrase did not match\. No account change was made\./);
});

verify('temporary-password UI keeps the accepted minimum and does not echo the secret', () => {
  assert.match(ui, /type=\\"password\\" minlength=\\"12\\" maxlength=\\"128\\"/);
  assert.match(ui, /password\.length<12/);
  assert.match(ui, /if\(input\)input\.value=''/);
});

verify('owner-only recovery controls are hidden from admin and self targets', () => {
  assert.match(ui, /const credential=owner&&!self\?/);
  assert.match(ui, /accountDeletion\?\.changeEmail/);
  assert.match(ui, /accountDeletion\?\.setTempPassword/);
});

verify('self-suspension and self-deletion remain blocked in presentation', () => {
  assert.match(ui, /Self-suspension is blocked/);
  assert.match(ui, /active Owner account cannot delete itself/);
});

const failed = checks.filter(check => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.ok ? '' : `: ${check.error.message}`}`);
}

assert.equal(failed.length, 0, `${failed.length} Admin Console Phase 2 UI acceptance characterization check(s) failed`);
console.log(`Admin Console Phase 2 UI acceptance characterization: ${checks.length}/${checks.length} passed`);
