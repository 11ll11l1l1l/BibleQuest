# A3 Architecture / Security — #94 Reset / Recovery

STATE/PROVENANCE
- Agent: `BQ-A3-ARCH-SECURITY`
- Inspected: 2026-09-11 JST as the next dependency-likely milestone only.
- #94 canonical/work candidate: not yet established in the inspected live state.
- Current active canonical remains #93 `feature/v3-admin-operations` @ `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`.
- Latest frozen base remains `release/v3.63-admin-console` @ `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`; v3.64 is not yet frozen in the inspected state.
- This report becomes stale when #93 freezes, a #94 branch/candidate appears, retained recovery ownership changes, or `bq-password-reset` / recovery schema / grants / tests change.

INSPECTED EVIDENCE
FACT:
- Retained `reset.js` is a standalone unauthenticated recovery-code/password-reset page. It validates password length/match client-side, then calls `bq-password-reset` with `action: reset`, email, recovery code, and new password.
- The retained page uses the public Supabase publishable key only; it does not carry service-role credentials.
- `bq-password-reset` owns the privileged recovery authority. It creates a server-side admin client, rate-limits by hashed connection identifier, hashes recovery codes/email, enforces expiry and lockout, atomically claims an unused code, changes the Auth password with admin authority, then rotates to a new recovery code.
- `action: issue` requires a valid authenticated user JWT before issuing/replacing a recovery code.
- `action: reset` intentionally does not require an authenticated session; possession of matching email + live recovery code is the recovery credential.
- The server rejects disallowed Origin values, limits reset attempts, delays further attempts after repeated code failures, uses constant-time hash comparison, marks the code used before password update, rolls `used_at` back if password mutation fails, and retires old codes when creating a replacement.

REQUIRED OWNER/COMPOSITION
RECOMMENDATION:
- #94 should remain a page/surface composition over the already authoritative recovery service unless primary retained/inventory evidence proves a different owner.
- `bq-password-reset` should remain the sole trusted authority for recovery-code verification, rate limiting/lockout, Auth password mutation, one-time code consumption, and recovery-code rotation.
- Do not duplicate these security rules in a new browser owner or a second Edge/RPC path.

SAFE DATA FLOW
- Recovery page -> public API boundary -> `bq-password-reset` -> server rate limit -> locate live hashed recovery credential -> constant-time verify -> atomically consume code -> Auth password update -> rotate recovery code -> return new code once for user saving.

AUTHORIZATION / TRUST BOUNDARY
FACT:
- The reset action is credential-based rather than session-based. Its security boundary is possession of the correct recovery code plus email, enforced only at the trusted function.
- The issue action is session-authenticated and must remain separate from reset semantics.

RECOMMENDATION:
- Do not require an authenticated session for the retained reset flow unless authoritative #94 contract evidence explicitly changes that behavior; doing so would break account recovery when the user cannot sign in.
- Do not broaden browser/database grants to `bible_password_reset_codes` or expose code hashes, attempts, lockout state, or service credentials to the client.

MISSING EVIDENCE
- Exact authoritative #94 inventory/retained-boundary reconciliation after v3.64 freeze.
- Exact #94 work candidate and permanent tests.
- Faithful executable tests of `bq-password-reset` reset behavior for valid code, wrong code, lockout, expired/used code, one-time claim race, password-update rollback, and successful code rotation.
- Confirmation that #94 is only the standalone reset/recovery surface and does not duplicate already-verified underlying password/recovery-code capability.

PRIVACY/SCOPE
RECOMMENDATION:
- Keep responses generic for invalid email/code combinations; do not introduce account-enumeration signals.
- Do not render or persist recovery-code hashes, internal user IDs, lockout internals, or admin/service credentials in the browser.

UNSAFE APPROACHES
- Direct browser reads/writes of recovery-code tables.
- Moving password reset to client-side Supabase admin APIs.
- Reusing an authenticated-session requirement for the reset action.
- Allowing a recovery code to remain valid after successful password reset.
- Treating client-side validation as the recovery security boundary.
- Folding #94 into #100 backup/export/import/reset or #93 Admin Operations without authoritative dependency evidence.

BLOCKERS
- No #94 implementation should begin from this preliminary report while #93 release closure is incomplete and the exact #94 contract/branch/frozen base has not been reconciled.

NON-BLOCKING OBSERVATIONS
- The existing trusted reset handler already contains a materially strong security shape for a recovery-code flow: server-only admin authority, hashed codes, rate limiting, lockout, one-time claim, rollback on failed password update, and code rotation.

ARCHITECTURE ACCEPTANCE CHECKS FOR FUTURE #94
- Recover the exact #94 contract after the preceding release freezes.
- Preserve `bq-password-reset` as the single trusted recovery authority.
- Keep service-role credentials and recovery-code storage server-only.
- Prove credential-based unauthenticated reset and authenticated issue flows separately.
- Add faithful trusted-boundary regression coverage for reset-code lifecycle and failure handling.
- Do not absorb unrelated backup/reset or Admin Operations ownership.
