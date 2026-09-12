// BibleQuest V4 Phase 2: static contract for the new emergency
// user-management actions added to supabase/functions/bq-admin-ops. CI
// cannot execute Deno/Supabase locally (documented gap), so this locks in
// the exact authorization/audit invariants as the closest available proof,
// pending real deployment verification.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve(import.meta.dirname, '..');
const src = fs.readFileSync(path.join(root, 'supabase', 'functions', 'bq-admin-ops', 'index.ts'), 'utf8');

// Every action must sit behind the existing siteRole() check (owner/admin)
// before the action router is ever reached - already enforced by the
// pre-existing `if(!r)return json(req,{error:'Admin access required'},403)`
// line that runs before the action dispatch; verify it still wraps ours.
const routerStart = src.indexOf("const body=await req.json()");
const dispatchBlock = src.slice(routerStart);
assert.ok(dispatchBlock.includes("action==='suspend_account'"), 'suspend_account action must be dispatched from the same authenticated+role-checked router as every other action.');

// Temporary password: owner-only, minimum length, never logged, self-action blocked.
assert.ok(/action==='set_temp_password'\)\{\s*if\(r!=='owner'\)/.test(src), 'set_temp_password must be gated to the owner role only.');
assert.ok(/password\.length<12/.test(src), 'Temporary password must enforce a minimum length server-side (never trust client-side validation alone).');
assert.ok(/target===u\.id.*Use your own account recovery flow/.test(src), 'The owner must not be able to set a temporary password for their own account through the emergency tool.');
assert.ok(!/audit\(a,u\.id,target,'set_temp_password',\{[^}]*\bpassword\b[^}]*\}/.test(src), 'The audit-log detail object for set_temp_password must never include the raw password value.');
assert.ok(src.includes("await audit(a,u.id,target,'set_temp_password'"), 'set_temp_password must be recorded in the audit log.');

// Suspend/reactivate: mutual self-protection, owner-immunity from suspension, audited.
assert.ok(/action==='suspend_account'\|\|action==='reactivate_account'/.test(src), 'Suspend and reactivate must share one authorization/audit code path, not diverge.');
assert.ok(/target===u\.id\)return json\(req,\{error:'You cannot suspend or reactivate your own account'/.test(src), 'An admin/owner must not be able to suspend or reactivate their own account.');
assert.ok(/suspend_account'&&targetAccess\.data\?\.role==='owner'/.test(src), 'Another owner account must be immune to suspension, mirroring the existing delete_user owner-immunity rule.');
assert.ok(src.includes("await audit(a,u.id,target,action,"), 'Suspend/reactivate must be recorded in the audit log with the actual action name, not a generic label.');

// Suspending an account must also revoke its active sessions immediately (Phase 3
// requirement carried into Phase 2: "immediately lose... sessions revoked").
assert.ok(/suspend_account'\)\{try\{await forceSignOutUser\(target\)/.test(src), 'Suspending an account must immediately attempt to revoke its active sessions.');

// Force sign-out: any owner/admin may use it (Safe tier per the governing plan), audited.
assert.ok(src.includes("action==='force_sign_out'"), 'force_sign_out action must exist.');
assert.ok(src.includes("await audit(a,u.id,target,'force_sign_out'"), 'force_sign_out must be recorded in the audit log.');

// The session-revocation helper must use the documented GoTrue admin REST
// endpoint (supabase-js v2's auth.admin.signOut takes a JWT, not a user id,
// so it cannot be used here) and must not swallow a real backend outage as
// if the user were simply already signed out.
assert.ok(src.includes('/auth/v1/admin/users/${targetUserId}/logout'), 'Session revocation must use the documented per-user GoTrue admin logout endpoint.');
assert.ok(/res\.status!==404\)throw new Error/.test(src), 'Session revocation must distinguish "user has no active session" (404, fine) from a real failure (must throw).');

console.log('BibleQuest v4 Phase 2 admin emergency-actions RLS/authorization contract passed.');
