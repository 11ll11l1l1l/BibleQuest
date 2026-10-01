import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(
  new URL('../../supabase/functions/bq-admin-ops/index.ts', import.meta.url),
  'utf8',
);

function actionBlock(start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(from, -1, `Missing admin action block: ${start}`);
  assert.notEqual(to, -1, `Missing admin action boundary: ${end}`);
  return source.slice(from, to);
}

test('Owner emergency temporary passwords use the shared breached-password checker', () => {
  assert.match(
    source,
    /import \{assertPasswordNotCompromised\} from '\.\.\/_shared\/password-security\.ts';/,
  );

  const block = actionBlock(
    "if(action==='set_temp_password')",
    "if(action==='change_email')",
  );

  const screening = block.indexOf('await assertPasswordNotCompromised(password)');
  const audit = block.indexOf("await auditRequired(a,u.id,target,'set_temp_password')");
  const revoke = block.indexOf('await requireSessionRevocation(a,target)');
  const mutate = block.indexOf('a.auth.admin.updateUserById(target,{password})');

  assert.ok(screening >= 0, 'temporary password must be screened for known breaches');
  assert.ok(audit > screening, 'breach screening must happen before the requested audit side effect');
  assert.ok(revoke > screening, 'breach screening must happen before session revocation');
  assert.ok(mutate > revoke, 'credential mutation must remain after required session revocation');
});

test('Owner emergency temporary password screening fails closed with safe status codes', () => {
  const block = actionBlock(
    "if(action==='set_temp_password')",
    "if(action==='change_email')",
  );

  assert.match(block, /code==='BQ_PASSWORD_COMPROMISED'.*400/s);
  assert.match(block, /code==='BQ_PASSWORD_BREACH_CHECK_UNAVAILABLE'.*503/s);
  assert.match(block, /password\.length<12/);
  assert.doesNotMatch(
    block,
    /audit\([^\n]*\{[^}]*(password|token|secret)\s*:/i,
    'temporary password audit must not persist credential material',
  );
});
