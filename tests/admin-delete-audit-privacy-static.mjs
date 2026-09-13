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

const deleteUser = between("if(action==='delete_user')", "if(action==='suspend_account'||action==='reactivate_account')");

assert.match(deleteUser, /if\(r!==['"]owner['"]\).*403/, 'delete_user must remain owner-only');
assert.match(deleteUser, /target===u\.id/, 'delete_user must reject self-deletion');
assert.match(deleteUser, /getUserById\(target\)/, 'delete_user must verify the target Auth account');
assert.match(deleteUser, /audit\(a,u\.id,target,['"]delete_account['"],\{accountDeleted:true\}\)/, 'delete_user audit must contain only a non-sensitive deletion marker');
assert.doesNotMatch(deleteUser, /audit\([^\n]*\{[^}]*email\s*:/i, 'delete_user audit must not persist an email address');
assert.doesNotMatch(deleteUser, /audit\([^\n]*\{[^}]*(password|token|secret)\s*:/i, 'delete_user audit must not persist credentials or recovery secrets');

const auditAt = deleteUser.indexOf("audit(a,u.id,target,'delete_account'");
const deleteAt = deleteUser.indexOf('a.auth.admin.deleteUser(target)');
assert.ok(auditAt >= 0 && deleteAt > auditAt, 'delete_user must preserve the established audit-before-delete ordering');

console.log('PASS admin delete-account audit privacy contract');
