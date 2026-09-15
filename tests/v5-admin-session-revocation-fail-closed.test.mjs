import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const adminOpsSource = fs.readFileSync(
  new URL('../supabase/functions/bq-admin-ops/index.ts', import.meta.url),
  'utf8',
);

function between(start, end) {
  const from = adminOpsSource.indexOf(start);
  assert.notEqual(from, -1, `missing start marker: ${start}`);
  const to = adminOpsSource.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker: ${end}`);
  return adminOpsSource.slice(from, to);
}

function assertBefore(block, first, second, message) {
  const firstIndex = block.indexOf(first);
  const secondIndex = block.indexOf(second);
  assert.notEqual(firstIndex, -1, `missing required operation: ${first}`);
  assert.notEqual(secondIndex, -1, `missing sensitive mutation: ${second}`);
  assert.ok(firstIndex < secondIndex, message);
}

test('sensitive admin changes require successful session revocation before mutation', () => {
  assert.match(
    adminOpsSource,
    /async function requireSessionRevocation\(targetUserId:string\)/,
    'admin ops must expose a fail-closed session revocation helper',
  );

  assert.match(
    adminOpsSource,
    /if\(!revoked\)throw new Error\('Session revocation failed: target user not found'\)/,
    '404/not-found revocation must fail the sensitive admin operation',
  );

  const requiredCalls = adminOpsSource.match(/await requireSessionRevocation\(target\)/g) || [];
  assert.equal(
    requiredCalls.length,
    3,
    'suspend, temporary-password reset, and email change must all require revocation',
  );

  const suspend = between("if(action==='suspend_account'||action==='reactivate_account')", "if(action==='force_sign_out')");
  assertBefore(
    suspend,
    'await requireSessionRevocation(target)',
    "a.from('bible_app_access').update",
    'suspension must revoke sessions before disabling the account',
  );

  const tempPassword = between("if(action==='set_temp_password')", "if(action==='change_email')");
  assertBefore(
    tempPassword,
    'await requireSessionRevocation(target)',
    'a.auth.admin.updateUserById(target,{password})',
    'temporary-password reset must revoke sessions before changing credentials',
  );

  const changeEmail = between("if(action==='change_email')", "return json(req,{error:'Unknown action'},400)");
  assertBefore(
    changeEmail,
    'await requireSessionRevocation(target)',
    'a.auth.admin.updateUserById(target,{email})',
    'email change must revoke sessions before changing the Auth identity',
  );

  assert.doesNotMatch(
    adminOpsSource,
    /force-sign-out-on-(?:suspend|temp-password|email-change)/,
    'sensitive paths must not swallow session-revocation errors',
  );
});
