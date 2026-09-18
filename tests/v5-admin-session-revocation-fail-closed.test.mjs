import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const adminOpsSource = fs.readFileSync(
  new URL('../supabase/functions/bq-admin-ops/index.ts', import.meta.url),
  'utf8',
);
const revocationMigration = fs.readFileSync(
  new URL('../supabase/migrations/20260915183000_admin_session_revocation.sql', import.meta.url),
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

test('session revocation mirrors Supabase Auth logout through a service-role-only RPC', () => {
  assert.match(
    revocationMigration,
    /grant usage on schema private to service_role/i,
    'fresh backends must explicitly allow the service role to traverse the private implementation schema',
  );
  assert.match(
    revocationMigration,
    /create or replace function private\.bible_revoke_auth_sessions_impl\([\s\S]*?security definer[\s\S]*?delete from auth\.sessions[\s\S]*?where user_id = target_user_id/i,
    'private definer must delete the same auth.sessions rows used by Supabase Auth global logout',
  );
  assert.match(
    revocationMigration,
    /create or replace function public\.bible_revoke_auth_sessions\([\s\S]*?security invoker[\s\S]*?private\.bible_revoke_auth_sessions_impl\(target_user_id\)/i,
    'public RPC must be an invoker wrapper around the private privileged implementation',
  );
  assert.match(
    revocationMigration,
    /revoke all on function public\.bible_revoke_auth_sessions\(uuid\)[\s\S]*?from public, anon, authenticated/i,
    'browser roles must not execute the session-revocation RPC',
  );
  assert.match(
    revocationMigration,
    /grant execute on function public\.bible_revoke_auth_sessions\(uuid\)[\s\S]*?to service_role/i,
    'only the service role should receive the public RPC execution grant',
  );

  assert.match(
    adminOpsSource,
    /a\.rpc\('bible_revoke_auth_sessions',\{target_user_id:targetUserId\}\)/,
    'admin ops must revoke target sessions through the locked RPC',
  );
  assert.doesNotMatch(
    adminOpsSource,
    /\/auth\/v1\/admin\/users\/.*\/logout/,
    'admin ops must not call the nonexistent Supabase admin logout-by-user-id route',
  );
});

test('sensitive admin changes require successful session revocation before mutation', () => {
  assert.match(
    adminOpsSource,
    /async function requireSessionRevocation\(a:ReturnType<typeof db>,targetUserId:string\)/,
    'admin ops must expose a fail-closed session revocation helper',
  );
  assert.match(
    adminOpsSource,
    /if\(r\.error\)throw new Error\(`Session revocation failed: \$\{r\.error\.message\}`\)/,
    'RPC failures must abort the sensitive admin operation',
  );

  const requiredCalls = adminOpsSource.match(/await requireSessionRevocation\(a,target\)/g) || [];
  assert.equal(
    requiredCalls.length,
    3,
    'suspend, temporary-password reset, and email change must all require revocation',
  );

  const suspend = between("if(action==='suspend_account'||action==='reactivate_account')", "if(action==='force_sign_out')");
  assertBefore(
    suspend,
    'await requireSessionRevocation(a,target)',
    "a.from('bible_app_access').update",
    'suspension must revoke sessions before disabling the account',
  );

  const tempPassword = between("if(action==='set_temp_password')", "if(action==='change_email')");
  assertBefore(
    tempPassword,
    'await requireSessionRevocation(a,target)',
    'a.auth.admin.updateUserById(target,{password})',
    'temporary-password reset must revoke sessions before changing credentials',
  );

  const changeEmail = between("if(action==='change_email')", "return json(req,{error:'Unknown action'},400)");
  assertBefore(
    changeEmail,
    'await requireSessionRevocation(a,target)',
    'a.auth.admin.updateUserById(target,{email})',
    'email change must revoke sessions before changing the Auth identity',
  );

  assert.doesNotMatch(
    adminOpsSource,
    /force-sign-out-on-(?:suspend|temp-password|email-change)/,
    'sensitive paths must not swallow session-revocation errors',
  );
});
