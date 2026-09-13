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

assert.match(
  source,
  /return r\.data\?\.active&&\['owner','admin'\]\.includes\(r\.data\.role\)\?String\(r\.data\.role\):''/,
  'server front door must admit only active owner/admin roles'
);
assert.match(source, /if\(!r\)return json\(req,\{error:'Admin access required'\},403\)/, 'non-admin/member requests must fail closed');

const deleteUser = between("if(action==='delete_user')", "if(action==='suspend_account'||action==='reactivate_account')");
assert.match(deleteUser, /if\(r!=='owner'\).*403/, 'delete_user must remain owner-only');
assert.match(deleteUser, /target===u\.id/, 'delete_user must reject self-deletion');
assert.match(deleteUser, /getUserById\(target\)/, 'delete_user must verify target Auth identity');
assert.match(deleteUser, /deleteUser\(target\)/, 'delete_user must still use the admin Auth deletion path');

const suspend = between("if(action==='suspend_account'||action==='reactivate_account')", "if(action==='force_sign_out')");
assert.match(suspend, /target===u\.id/, 'suspend/reactivate must reject self-targeting');
assert.match(suspend, /action==='suspend_account'&&targetAccess\.data\?\.role==='owner'/, 'suspend must protect another owner account');
assert.match(suspend, /forceSignOutUser\(target\)/, 'suspend must attempt target session revocation');
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
assert.match(tempPassword, /forceSignOutUser\(target\)/, 'temporary password must attempt session revocation');
assert.match(tempPassword, /audit\(a,u\.id,target,'set_temp_password',\{sessionsRevoked:revoked\}\)/, 'temporary password audit must record only revocation state');
assert.doesNotMatch(tempPassword, /audit\([^\n]*(password|token|secret)\s*:/i, 'temporary password audit must never persist credentials');

const changeEmail = between("if(action==='change_email')", "throw new Error('Unknown admin action')");
assert.match(changeEmail, /if\(r!=='owner'\).*403/, 'change_email must remain owner-only');
assert.match(changeEmail, /target===u\.id/, 'change_email must reject the active owner self-target');
assert.match(changeEmail, /email\.length>254/, 'change_email must bound email length');
assert.match(changeEmail, /getUserById\(target\)/, 'change_email must verify target Auth identity');
assert.match(changeEmail, /updateUserById\(target,\{email\}\)/, 'change_email must use admin Auth mutation');
assert.match(changeEmail, /forceSignOutUser\(target\)/, 'change_email must attempt global session revocation');
assert.match(changeEmail, /audit\(a,u\.id,target,'change_email',\{emailChanged:true,sessionsRevoked:revoked\}\)/, 'change_email audit must record only non-sensitive markers');
assert.doesNotMatch(changeEmail, /audit\([^\n]*\{[^}]*email\s*:/i, 'change_email audit must never persist the email value');
assert.doesNotMatch(changeEmail, /audit\([^\n]*\{[^}]*(password|token|secret)\s*:/i, 'change_email audit must never persist credentials or recovery secrets');

console.log('PASS V5 admin emergency action server-security contract');
