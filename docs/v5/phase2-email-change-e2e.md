# V5 Phase 2 controlled email-change E2E

Purpose: prove integrated #358 owner-only `bq-admin-ops` `change_email` behavior against a controlled non-production Supabase Auth project without exposing secrets or leaving the target mutated.

## Hard prerequisites
Execution is prohibited until the environment is independently established as non-production. Connected-project access alone is not authorization.

The non-production backend must have: migration `20260915183000_admin_session_revocation.sql`; matching current `bq-admin-ops`; normal `bible_admin_audit_log`; three dedicated distinct identities (owner, non-owner admin, disposable target); a controlled replacement address; and no real/private content on the target. The migration/function pair is atomic for this gate.

## Required environment variables
Provide only through the controlled execution environment and never paste values into repo/issues/logs: `BQ_V5_TEST_SUPABASE_URL`, `BQ_V5_PRODUCTION_SUPABASE_URL`, `BQ_V5_TEST_ANON_KEY`, `BQ_V5_TEST_SERVICE_ROLE_KEY`, owner/admin/target email+password variables, `BQ_V5_TARGET_NEW_EMAIL`, and `BQ_V5_E2E_CONFIRM_NONPROD=I_UNDERSTAND_NONPROD_ONLY`.

Run: `node tests/v5-admin-email-change-e2e.mjs`.

## Required assertions
A BACKEND-E2E PASS requires: distinct identities authenticate; non-owner admin receives 403; owner self-target receives 409; owner target succeeds with `ok:true`, `changed:true`, `revoked:true`; Auth email actually changes; the pre-change refresh token fails after revocation; latest audit identifies controlled actor/target and contains exactly `emailChanged:true` and `sessionsRevoked:true` without sensitive material; and `finally` restores the original controlled email. Restoration failure fails the run.

Deleting `auth.sessions` mirrors global logout refresh-session revocation. Already-issued access JWTs may remain usable until expiry; this gate does not claim instant access-token invalidation.

## Evidence discipline
Syntax/static workflow success is **STATIC** only. BACKEND-E2E is earned only by the controlled real run on a positively established non-production backend. Missing credentials, skipped execution, unknown/production topology, or failed restoration is not PASS. Retain only candidate SHA, non-sensitive test-project identifier, execution time, PASS/FAIL, and non-sensitive HTTP/error category.
