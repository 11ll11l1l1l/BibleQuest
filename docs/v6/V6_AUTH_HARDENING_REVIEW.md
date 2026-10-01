# BibleQuest V6 privileged re-authentication and MFA/passkey review

Status: REVIEW COMPLETE; IMPLEMENTATION NOT ENABLED
Updated: 2026-09-30 JST
Scope: V6 Owner/Admin authentication hardening and recovery policy
Authority: `V6_ACTIVE_STATUS.md`, `src/v6/admin/contracts.ts`

## Current implementation snapshot

BibleQuest currently uses `@supabase/supabase-js@2.112.4` in both the browser API owner and deployed admin operations function.

The browser session owner supports password sign-in, current-password verification for the user's own password change, session refresh/persistence and sign-out. It does **not** currently call Supabase reauthentication, MFA assurance-level, MFA factor, or passkey APIs.

The deployed `bq-admin-ops` function requires a valid JWT, resolves the caller with `auth.getUser(jwt)`, reloads the caller's BibleQuest platform role from `bible_app_access`, limits Owner-only actions on the server, audits high-risk operations, and revokes target-user sessions for applicable actions. It does **not** currently require or inspect a fresh-authentication timestamp, `aal2`, or an `amr` step-up claim.

Therefore this review does not claim fresh-auth, MFA, or passkeys are deployed.

## Decision 1 — privileged re-authentication requirements

Fresh step-up authentication is required for the highest-impact Owner/Admin operations before those operations are considered fully hardened.

The following current Admin transport actions are **step-up required** because they alter identity, authorization, account availability, credentials, or active sessions:

- `set_role`
- `set_congregation_role`
- `set_group_owner`
- `remove_congregation`
- `delete_user`
- `suspend_account`
- `force_sign_out`
- `set_temp_password`
- `change_email`

Lower-impact administrative mutations such as creating a group, ordinary group membership maintenance, setting a congregation association, or reactivating an account may continue to use the current authenticated Owner/Admin server authority unless a later threat review escalates them.

UI visibility is never sufficient evidence of step-up. The server/Edge Function must verify the assurance evidence for every step-up-required operation.

### Accepted enforcement shape

For BibleQuest, the future enforcement boundary should use Supabase session assurance rather than a client-only timestamp.

1. The client obtains a fresh authentication/step-up result through supported Supabase Auth APIs.
2. The resulting request carries the authenticated session JWT normally.
3. The server verifies the user and platform role exactly as it does today.
4. The server additionally verifies the required authentication assurance and recency before executing a step-up-required action.
5. Failure must return a distinct authorization/step-up error and must not perform the mutation.
6. The audit log must record that step-up was required/satisfied without storing OTPs, passwords, WebAuthn material, access tokens, or recovery secrets.

Supabase currently exposes MFA assurance in the JWT as `aal` and authentication-method history in `amr`. A future implementation should use server-verifiable JWT/session evidence and a bounded recency window. A **10-minute maximum age** for the most recent qualifying authentication method is the V6 design target for destructive, credential-changing, role/ownership-changing, suspension and session-revocation actions. The exact implementation must be tested against the supported Supabase Auth flow before enforcement is enabled.

Supabase `auth.reauthenticate()` sends a reauthentication OTP for supported sensitive account flows, but BibleQuest must not assume that a front-end call alone proves generic Admin step-up to `bq-admin-ops`. The server still needs verifiable assurance/recency evidence.

The existing `verifyPassword()` path in `src/core/api.js` is currently used for the signed-in user's own password change. It re-signs in with `signInWithPassword`; it is **not** accepted as the future generic Admin step-up contract by itself.

## Decision 2 — MFA for privileged roles

MFA has been evaluated for Owner/Admin roles.

Supabase currently supports MFA using TOTP authenticator applications and phone verification, and exposes `aal2` for sessions that completed a second factor.

V6 decision:

- Do **not** require MFA for every BibleQuest member.
- TOTP is the preferred first privileged-role MFA factor because it does not depend on SMS delivery.
- Mandatory Owner/Admin MFA should not be switched on until enrollment, challenge, factor-management, loss/recovery, and privileged-session enforcement are implemented and tested together.
- When privileged MFA enforcement is implemented, the server must enforce the assurance level; showing an MFA screen or hiding Admin UI is insufficient.
- Phone MFA may be offered as a secondary/recovery factor only after provider/cost/delivery implications are explicitly accepted.
- A privileged user who has enrolled MFA must not silently fall back to an AAL1 Admin mutation path.

This is an architecture decision, not a claim that MFA is currently enabled.

## Decision 3 — passkeys

Passkeys have been evaluated for privileged roles.

The current BibleQuest Supabase JavaScript version is new enough for the current Supabase passkey API, but Supabase documents passkey support as **experimental**. BibleQuest will therefore **not make passkeys mandatory in V6** and will not couple V6 release certification to an experimental authentication API.

A future pilot may expose passkey registration/sign-in behind a feature flag after browser/PWA compatibility, RP-ID/origin configuration, factor lifecycle, account recovery and rollback are proven.

The WebAuthn RP ID must remain stable. Changing it can make existing passkeys unusable, so BibleQuest must select the production RP ID deliberately before any real user enrollment.

## Recovery implications

Recovery must be designed before privileged MFA/passkey enforcement.

- BibleQuest's existing application recovery code is a password-reset mechanism. It is **not** an MFA factor and must not be treated as proof of AAL2.
- A privileged account must have a tested recovery path before mandatory MFA is enabled.
- Preferred recovery is a second independently controlled verified factor where practical.
- Factor removal or replacement for Owner/Admin must itself require strong current authentication and be auditable.
- A lost-factor recovery must not become a generic bypass that grants privileged access from only an email address or an existing low-assurance session.
- Any break-glass Owner recovery must be explicit, audited, rare, and followed by session revocation and factor re-enrollment.
- Passkey recovery must account for device loss, password-manager/account loss, cross-device availability, and the possibility that an RP-ID change invalidates credentials.
- Experimental recovery-code APIs must not become a V6 dependency without a separate review.

## Decision 4 — leaked-password protection / supported equivalent

Live Security Advisor evidence observed at 2026-10-02 00:06 JST still reports `auth_leaked_password_protection` as disabled. The canonical fail-closed evidence record is `docs/v6/V6_LEAKED_PASSWORD_ACCEPTANCE.json`. Supabase documents its built-in HaveIBeenPwned leaked-password protection as available on Pro and above.

The V6 fallback candidate therefore uses the free HaveIBeenPwned Pwned Passwords range API with k-anonymity: BibleQuest hashes the completed password locally, sends only the first five SHA-1 hexadecimal characters, requests padded responses, and compares the returned suffixes locally. The plaintext password and complete hash are never sent to HaveIBeenPwned.

The fallback is fail closed for first-party password-setting flows: if the breach service cannot be checked, BibleQuest does not silently proceed with that password change. A known-compromised password is rejected with a user-safe message.

Candidate coverage includes:
- ordinary account signup in `bq-signup`;
- recovery-code password reset in `bq-password-reset`;
- the signed-in user's normal Account-page password change before `auth.updateUser`;
- the Owner emergency `set_temp_password` path before audit, session revocation, and Admin Auth mutation.

This is **still not equivalent to project-level Supabase enforcement**. A caller that bypasses BibleQuest's first-party password-setting flows and reaches a permitted Supabase Auth password endpoint directly would not be covered while the hosted project setting remains disabled. CI now prevents this acceptance row from being checked without matching canonical evidence. Therefore the acceptance row must remain open until either:
1. Supabase built-in leaked-password protection is enabled and verified on a plan that supports it; or
2. the release owner explicitly accepts the now-complete first-party equivalent plus its residual direct-Auth bypass scope.

## Release impact

The checklist items **Privileged Owner/Admin re-auth requirements are reviewed** and **MFA/passkeys for privileged roles are evaluated with recovery implications documented** may be marked complete by this review.

That completion means the security decisions and gaps are explicit. It does **not** mean reauthentication, MFA, AAL2 enforcement, passkeys, or privileged factor recovery are implemented.

Implementation of fresh step-up for the listed high-impact actions remains a follow-on security-hardening tranche. Any future tranche must preserve the current server-side role checks, audit requirements, session-revocation behavior and offline prohibition.

## References

- Supabase Auth reauthentication: https://supabase.com/docs/reference/javascript/auth-reauthenticate
- Supabase MFA / AAL enforcement: https://supabase.com/docs/guides/auth/auth-mfa
- Supabase passkeys: https://supabase.com/docs/guides/auth/passkeys
- Supabase passkey JavaScript API: https://supabase.com/docs/reference/javascript/auth-passkey
