import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const edgePath = path.join(root, 'supabase/functions/bq-admin-ops/index.ts');
const source = fs.readFileSync(edgePath, 'utf8');

function mustMatch(text, pattern, message) {
  assert.match(text, pattern, message);
}

// The shared admin front door must authenticate the caller and only admit an
// active owner/admin site role before any action-specific branch is reached.
mustMatch(
  source,
  /u=await requireUser\(req,a\),r=await siteRole\(a,u\.id\);if\(!r\)return json\(req,\{error:'Admin access required'\},403\)/,
  'admin operations must authenticate and reject callers without an active admin/owner site role',
);
mustMatch(
  source,
  /r\.data\?\.active&&\['owner','admin'\]\.includes\(r\.data\.role\)/,
  'siteRole must only admit active owner/admin access rows',
);

const changeStart = source.indexOf("if(action==='change_email'){");
const unknownStart = source.indexOf("return json(req,{error:'Unknown action'},400)", changeStart);
assert.ok(changeStart >= 0, 'change_email action must exist');
assert.ok(unknownStart > changeStart, 'change_email action must terminate before the unknown-action fallback');
const change = source.slice(changeStart, unknownStart);

mustMatch(
  change,
  /if\(r!=='owner'\)return json\(req,\{error:'Only the BibleQuest owner can change an account email'\},403\)/,
  'change_email must be owner-only on the server',
);
mustMatch(change, /target=String\(body\?\.targetUserId\|\|''\)/, 'change_email must derive the target from request input');
mustMatch(change, /if\(!target\)return json\(req,\{error:'targetUserId required'\},400\)/, 'change_email must require targetUserId');
mustMatch(
  change,
  /if\(target===u\.id\)return json\(req,\{error:'Use your own Account page for this active owner account'\},409\)/,
  'change_email must reject changes to the active owner account',
);
mustMatch(
  change,
  /email\.length>254\|\|!\/\^\[\^\\s@\]\+@\[\^\\s@\]\+\\\.\[\^\\s@\]\+\$\/\.test\(email\)/,
  'change_email must reject invalid or overlong replacement email addresses',
);
mustMatch(change, /a\.auth\.admin\.getUserById\(target\)/, 'change_email must verify the target auth account exists');
mustMatch(
  change,
  /String\(got\.data\.user\?\.email\|\|''\)\.trim\(\)\.toLowerCase\(\)===email/,
  'change_email must reject a no-op replacement email',
);

const updateAt = change.indexOf('a.auth.admin.updateUserById(target,{email})');
const revokeAt = change.indexOf('forceSignOutUser(target)');
const auditAt = change.indexOf("await audit(a,u.id,target,'change_email'");
const responseAt = change.indexOf('return json(req,{ok:true,changed:true,revoked})');
assert.ok(updateAt >= 0, 'change_email must update Supabase Auth through the admin API');
assert.ok(revokeAt > updateAt, 'session revocation must be requested after the email update');
assert.ok(auditAt > revokeAt, 'audit logging must follow the session-revocation attempt');
assert.ok(responseAt > auditAt, 'success must only be returned after the audit call');

mustMatch(
  change,
  /await audit\(a,u\.id,target,'change_email',\{emailChanged:true,sessionsRevoked:revoked\}\)/,
  'change_email audit must record the action and revocation outcome without an address value',
);
const auditCall = change.match(/await audit\(a,u\.id,target,'change_email',[^;]+;/)?.[0] || '';
assert.ok(auditCall, 'change_email audit call must be extractable');
assert.doesNotMatch(
  auditCall.replace("'change_email'", "'change-action'"),
  /\bemail\b|password|token|secret/i,
  'change_email audit detail must not contain an email address, password, token, or secret value',
);
assert.doesNotMatch(
  change.slice(responseAt, responseAt + 100),
  /email|password|token|secret/i,
  'change_email success response must not return the replacement email or credentials',
);

console.log('admin email-change edge security static checks passed');
