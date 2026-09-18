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

const requiredAuditHelper = between('async function auditRequired', 'async function health');
assert.match(requiredAuditHelper, /from\('bible_admin_audit_log'\)\.insert/, 'required checkpoint must persist through the existing audit owner');
assert.match(requiredAuditHelper, /detail:\{stage:'requested'\}/, 'required checkpoint detail must remain privacy-safe and bounded');
assert.match(requiredAuditHelper, /if\(r\.error\)throw new Error\('Admin audit unavailable'\)/, 'audit persistence failure must fail closed');
assert.doesNotMatch(requiredAuditHelper, /password|email|token|secret/i, 'required checkpoint helper must not accept or persist sensitive values');

function assertCheckpointBefore(block, action, mutation, label) {
  const checkpoint = `auditRequired(a,u.id,target,'${action}')`;
  const checkpointAt = block.indexOf(checkpoint);
  const mutationAt = block.indexOf(mutation);
  assert.ok(checkpointAt >= 0, `${label} must require a durable audit checkpoint`);
  assert.ok(mutationAt > checkpointAt, `${label} must not mutate before the audit checkpoint succeeds`);
}

const deleteUser = between("if(action==='delete_user')", "if(action==='suspend_account'||action==='reactivate_account')");
assertCheckpointBefore(deleteUser, 'delete_account', "a.from('bible_shared_sessions').update", 'delete_user shared-session cleanup');
assertCheckpointBefore(deleteUser, 'delete_account', 'a.auth.admin.deleteUser(target)', 'delete_user Auth deletion');
const deleteMutationAt = deleteUser.indexOf('a.auth.admin.deleteUser(target)');
const deleteSuccessCheckAt = deleteUser.indexOf('if(del.error)throw del.error');
const deleteCompletionAuditAt = deleteUser.indexOf("audit(a,u.id,target,'delete_account',{accountDeleted:true})");
assert.ok(deleteMutationAt >= 0, 'delete_user must call Supabase Auth deletion');
assert.ok(deleteSuccessCheckAt > deleteMutationAt, 'delete_user must check Auth deletion result');
assert.ok(deleteCompletionAuditAt > deleteSuccessCheckAt, 'delete_user must not claim accountDeleted=true until Auth deletion succeeds');

const suspendReactivate = between("if(action==='suspend_account'||action==='reactivate_account')", "if(action==='force_sign_out')");
assert.match(suspendReactivate, /auditRequired\(a,u\.id,target,action\)/, 'suspend/reactivate must checkpoint the exact requested action');
assert.ok(
  suspendReactivate.indexOf('auditRequired(a,u.id,target,action)') < suspendReactivate.indexOf("a.from('bible_app_access').update"),
  'suspend/reactivate access mutation must follow the audit checkpoint',
);

const forceSignOut = between("if(action==='force_sign_out')", "if(action==='set_temp_password')");
assertCheckpointBefore(forceSignOut, 'force_sign_out', 'forceSignOutUser(a,target)', 'force_sign_out');

const tempPassword = between("if(action==='set_temp_password')", "if(action==='change_email')");
assertCheckpointBefore(tempPassword, 'set_temp_password', 'a.auth.admin.updateUserById(target,{password})', 'set_temp_password');

const changeEmail = between("if(action==='change_email')", "return json(req,{error:'Unknown action'},400)");
assertCheckpointBefore(changeEmail, 'change_email', 'a.auth.admin.updateUserById(target,{email})', 'change_email');

console.log('PASS admin emergency actions require durable pre-mutation audit and truthful delete completion ordering');
