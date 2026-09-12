// BibleQuest V4 Phase 2: static contract for emergency user-management.
// Locks both the Edge Function authorization invariants and the Admin Console
// presentation/interaction contract. Live authenticated Supabase execution is
// still a separate release gate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(root, 'supabase', 'functions', 'bq-admin-ops', 'index.ts'), 'utf8');
const ui = fs.readFileSync(path.join(root, 'src', 'features', 'admin-console', 'index.js'), 'utf8');

// Every action must sit behind the existing siteRole() check (owner/admin)
// before the action router is reached.
const routerStart = src.indexOf("const body=await req.json()");
assert.ok(routerStart >= 0, 'Admin operations request router must exist.');
const dispatchBlock = src.slice(routerStart);
assert.ok(dispatchBlock.includes("action==='suspend_account'"), 'suspend_account action must be dispatched from the same authenticated+role-checked router as every other action.');

// Temporary password: owner-only, minimum length, never logged, self-action blocked.
assert.ok(/action==='set_temp_password'\)\{\s*if\(r!=='owner'\)/.test(src), 'set_temp_password must be gated to the owner role only.');
assert.ok(/password\.length<12/.test(src), 'Temporary password must enforce a minimum length server-side.');
assert.ok(/target===u\.id.*Use your own account recovery flow/.test(src), 'The owner must not set a temporary password for their own account through the emergency tool.');
assert.ok(!/audit\(a,u\.id,target,'set_temp_password',\{[^}]*\bpassword\b[^}]*\}/.test(src), 'The audit-log detail object for set_temp_password must never include the raw password value.');
assert.ok(src.includes("await audit(a,u.id,target,'set_temp_password'"), 'set_temp_password must be recorded in the audit log.');

// Suspend/reactivate: mutual self-protection, owner-immunity from suspension, audited.
assert.ok(/action==='suspend_account'\|\|action==='reactivate_account'/.test(src), 'Suspend and reactivate must share one authorization/audit code path.');
assert.ok(/target===u\.id\)return json\(req,\{error:'You cannot suspend or reactivate your own account'/.test(src), 'An admin/owner must not suspend or reactivate their own account.');
assert.ok(/suspend_account'&&targetAccess\.data\?\.role==='owner'/.test(src), 'Another owner account must be immune to suspension.');
assert.ok(src.includes("await audit(a,u.id,target,action,"), 'Suspend/reactivate must be recorded in the audit log.');
assert.ok(/suspend_account'\)\{try\{await forceSignOutUser\(target\)/.test(src), 'Suspending an account must immediately attempt to revoke its active sessions.');

// Force sign-out and session revocation implementation.
assert.ok(src.includes("action==='force_sign_out'"), 'force_sign_out action must exist.');
assert.ok(src.includes("await audit(a,u.id,target,'force_sign_out'"), 'force_sign_out must be recorded in the audit log.');
assert.ok(src.includes('/auth/v1/admin/users/${targetUserId}/logout'), 'Session revocation must use the per-user GoTrue admin logout endpoint.');
assert.ok(/res\.status!==404\)throw new Error/.test(src), 'Session revocation must distinguish no-session 404 from a real backend failure.');

// Admin Console must expose the emergency controls through the existing
// createAdminOperationsService owner rather than inventing a second API path.
for (const section of ['identity','congregations','security']) {
  assert.ok(ui.includes(`data-admin-user-section=\"${section}\"`), `Admin user card must include the ${section} section.`);
}
for (const severity of ['safe','elevated','critical']) {
  assert.ok(ui.includes(`data-admin-severity=\"${severity}\"`), `Admin user-management UI must include ${severity} severity treatment.`);
}
for (const control of ['data-admin-force-signout','data-admin-suspend-user','data-admin-reactivate-user','data-admin-temp-password']) {
  assert.ok(ui.includes(control), `Admin Console must render ${control}.`);
}
assert.ok(ui.includes('accountDeletion.forceSignOut'), 'Force sign-out UI must call the existing Admin Operations service.');
assert.ok(ui.includes('accountDeletion.suspendAccount'), 'Suspend UI must call the existing Admin Operations service.');
assert.ok(ui.includes('accountDeletion.reactivateAccount'), 'Reactivate UI must call the existing Admin Operations service.');
assert.ok(ui.includes('accountDeletion.setTempPassword'), 'Temporary-password UI must call the existing Admin Operations service.');
assert.ok(ui.includes('`SUSPEND ${user.email||user.name}`'), 'Suspend must use a typed confirmation phrase tied to the target identity.');
assert.ok(ui.includes('`DELETE ${user.email||user.name}`'), 'Permanent deletion must keep typed confirmation tied to the target identity.');
assert.ok(/type=\"password\" minlength=\"12\"/.test(ui), 'Temporary-password input must be masked and enforce the 12-character client floor.');
assert.ok(ui.includes('password.length<12'), 'Temporary-password UI must reject values below the server minimum before dispatch.');
assert.ok(!ui.includes("fetch('/auth/v1/admin"), 'Admin Console must not bypass the shared Admin Operations API owner with direct auth-admin fetches.');

console.log('BibleQuest v4 Phase 2 admin emergency-actions authorization + presentation contract passed.');
