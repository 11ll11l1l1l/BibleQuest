# V5 Phase 2 controlled email-change E2E

Purpose: prove integrated #358 owner-only `bq-admin-ops` `change_email` behavior against a controlled non-production Supabase Auth project without exposing secrets or leaving the target mutated.

## Hard prerequisites

Execution is prohibited until the environment is independently established as non-production. Connected-project access alone is not authorization.

The non-production backend must have, in this order:

1. migration `20260915183000_admin_session_revocation.sql` applied successfully;
2. the matching current `bq-admin-ops` Edge Function deployed from the candidate under test;
3. normal `bible_admin_audit_log` storage available;
4. three dedicated, distinct identities: active owner, active non-owner admin, and disposable target account;
5. a controlled replacement mailbox/address for the target;
6. no real/private user content attached to the disposable target.

The migration/function pair is atomic for this gate. Do not run the harness against an older deployed function or a backend lacking the revocation RPC.

## Required environment variables

Provide these only through the controlled execution environment; never commit or paste their values into issues/logs:

- `BQ_V5_TEST_SUPABASE_URL`
- `BQ_V5_PRODUCTION_SUPABASE_URL`
- `BQ_V5_TEST_ANON_KEY`
- `BQ_V5_TEST_SERVICE_ROLE_KEY`
- `BQ_V5_OWNER_EMAIL`, `BQ_V5_OWNER_PASSWORD`
- `BQ_V5_ADMIN_EMAIL`, `BQ_V5_ADMIN_PASSWORD`
- `BQ_V5_TARGET_EMAIL`, `BQ_V5_TARGET_PASSWORD`
- `BQ_V5_TARGET_NEW_EMAIL`
- `BQ_V5_E2E_CONFIRM_NONPROD=I_UNDERSTAND_NONPROD_ONLY`

Run: `node tests/v5-admin-email-change-e2e.mjs`.

## Required assertions

A BACKEND-E2E PASS requires all of the following in one controlled run:

- all three dedicated identities authenticate and are distinct;
- non-owner admin `change_email` receives 403;
- active owner self-target receives 409;
- owner-to-target change succeeds and reports `ok:true`, `changed:true`, `revoked:true` without echoing an email;
- Supabase Auth shows the target email changed;
- the target refresh token obtained before the change no longer refreshes after revocation;
- latest `change_email` audit names the controlled actor/target and records `emailChanged:true`, `sessionsRevoked:true` without email/password/token/secret keys or values;
- `finally` restoration returns the target to the original controlled email; restoration failure makes the run fail.

Deleting `auth.sessions` mirrors Supabase global logout refresh-session revocation. Already-issued access JWTs may remain usable until expiry; this gate does not claim instant cryptographic access-token invalidation.

## Evidence discipline

Syntax/static workflow success is **STATIC** only. BACKEND-E2E is earned only by the controlled real run above on a positively established non-production backend. Missing credentials, skipped execution, unknown/production topology, or failed restoration is not PASS.

Record only candidate SHA, a non-sensitive test-project identifier, execution time, PASS/FAIL, and non-sensitive HTTP/error category. Never retain environment dumps, raw Auth responses, tokens, passwords, keys, or email values.