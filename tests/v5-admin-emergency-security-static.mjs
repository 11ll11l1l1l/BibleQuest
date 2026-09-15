import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../supabase/functions/bq-admin-ops/index.ts', import.meta.url), 'utf8');

function between(start, end) {
  const from = source.indexOf(start);
  assert.notEqual(from, -1, `missing start marker: ${start}`);
  const to = source.indexOf(end, from + start.length);
  assert.notEqual(to, -1, `missing end marker: ${end}`);
  return source.slice(from, to);
}

function assertBefore(block, first, second, message) {
  const firstIndex = block.indexOf(first);
  const secondIndex = block.indexOf(second);
  assert.notEqual(firstIndex, -1, `missing required operation: ${first}`);
  assert.notEqual(secondIndex, -1, `missing sensitive mutation: ${second}`);
  assert.ok(firstIndex < secondIndex, message);
}

assert.match(
  source,
  /return r\.data\?\.active&&\['owner','admin'\]\.includes\(r\.data\.role\)\?String\(r\.data\.role\):''/,
  'server front door must admit only active owner/admin roles'
);
assert.match(source, /if\(!r\)return json\(req,\{error:'Admin access required'\},403\)/, 'non-admin/member requests must fail closed');
assert.match(source, /async function requireSessionRevocation\(targetUserId:string\)/, 'sensitive actions must share a required session-revocation boundary');
assert.match(source, /if\(!revoked\)throw new Error\('Session revocation failed: target user not found'\)/, 'required session revocation must fail closed when the target cannot be revoked');

const deleteUser = between("if(action==='delete_user')", "if(action==='suspend_account'||action==='reactivate_account')");
assert.match(deleteUser, /if\(r!=='owner'\).*403/, 'delete_user must remain owner-only');
assert.match(deleteUser, /target===u\.id/, 'delete_user must reject self-deletion');
assert.match(deleteUser, /getUserById\(target\)/, 'delete_user must verify target Auth identity');
assert.match(deleteUser, /deleteUser\(target\)/, 'delete_user must still use the admin Auth deletion path');

const suspend = between("if(action==='suspend_account'||action==='reactivate_account')", "if(action==='force_sign_out')");
assert.match(suspend, /target===u\.id/, 'suspend/reactivate must reject self-targeting');
assert.match(suspend, /action==='suspend_account'&&targetAccess\.data\?\.role==='owner'/, 'suspend must protect another owner account');
assert.match(suspend, /if\(action==='suspend_account'\)await requireSessionRevocation\(target\)/, 'suspend must require successful target session revocation');
assertBefore(suspend, 'await requireSessionRevocation(target)', "a.from('bible_app_access').update", 'suspend must revoke sessions before disabling the account');
assert.doesNotMatch(suspend, /catch\([^)]*\)[^{]*\{[^}]*force-sign-out-on-suspend/s, 'suspend must not swallow session-revocation failures');
assert.match(suspend, /audit\(a,u\.id,target,action,/, 'suspend/reactivate must be audited');

const forceSignOut = between("if(action==='force_sign_out')", "if(action==='set_temp_password')");
assert.match(forceSignOut, /targetUserId required/, 'force sign-out must require an explicit target');
assert.match(forceSignOut, /forceSignOutUser\(target\)/, 'force sign-out must revoke target sessions');
assert.match(forceSignOut, /audit\(a,u\.id,target,'force_sign_out',\{\}\)/, 'force sign-out must be audited without sensitive detail');

const tempPassword = between("if(action==='set_temp_password')", "if(action==='change_email')");
assert.match(tempPassword, /if\(r!=='owner'\).*403/, 'temporary password action must remain owner-only');
assert.match(tempPassword, /target===u\.id/, 'temporary password action must reject self-targeting');
assert.match(tempPassword, /password\.length<12/, 'temporary password must keep the minimum length guard');
assert.match(tempPassword, /updateUserById\(target,\{password\}\)/, 'temporary password must use admin Auth mutation');
assert.match(tempPassword, /await requireSessionRevocation\(target\)/, 'temporary password must require successful session revocation');
assertBefore(tempPassword, 'await requireSessionRevocation(target)', 'a.auth.admin.updateUserById(target,{password})', 'temporary password must revoke sessions before changing credentials');
assert.match(tempPassword, /audit\(a,u\.id,target,'set_temp_password',\{sessionsRevoked:true\}\)/, 'temporary password audit must record successful revocation without credentials');
assert.match(tempPassword, /return json\(req,\{ok:true,revoked:true\}\)/, 'temporary password success must only report after required revocation succeeds');
assert.doesNotMatch(tempPassword, /audit\([^\n]*(password|token|secret)\s*:/i, 'temporary password audit must never persist credentials');

const changeEmail = between("if(action==='change_email')", "return json(req,{error:'Unknown action'},400)");
assert.match(changeEmail, /if\(r!=='owner'\).*403/, 'change_email must remain owner-only');
assert.match(changeEmail, /target===u\.id/, 'change_email must reject the active owner self-target');
assert.match(changeEmail, /email\.length>254/, 'change_email must bound email length');
assert.match(changeEmail, /getUserById\(target\)/, 'change_email must verify target Auth identity');
assert.match(changeEmail, /updateUserById\(target,\{email\}\)/, 'change_email must use admin Auth mutation');
assert.match(changeEmail, /await requireSessionRevocation\(target\)/, 'change_email must require successful global session revocation');
assertBefore(changeEmail, 'await requireSessionRevocation(target)', 'a.auth.admin.updateUserById(target,{email})', 'change_email must revoke sessions before changing the Auth identity');
assert.match(changeEmail, /audit\(a,u\.id,target,'change_email',\{emailChanged:true,sessionsRevoked:true\}\)/, 'change_email audit must record only non-sensitive successful markers');
assert.match(changeEmail, /return json\(req,\{ok:true,changed:true,revoked:true\}\)/, 'change_email success must only report after required revocation succeeds');
assert.doesNotMatch(changeEmail, /audit\([^\n]*\{[^}]*email\s*:/i, 'change_email audit must never persist the email value');
assert.doesNotMatch(changeEmail, /audit\([^\n]*\{[^}]*(password|token|secret)\s*:/i, 'change_email audit must never persist credentials or recovery secrets');

console.log('PASS V5 admin emergency action server-security contract');
