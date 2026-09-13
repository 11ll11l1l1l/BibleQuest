# V5 Phase 2 controlled email-change E2E

Purpose: prove the existing `bq-admin-ops` `change_email` action against a controlled **non-production** Supabase Auth project without logging secrets or leaving the target account mutated.

This is acceptance evidence for V5 Phase 2. It is not a new auth architecture and must not be pointed at production.

## Preconditions

Use three dedicated test identities in the same non-production BibleQuest backend:

- an active `owner` in `bible_app_access`;
- an active non-owner `admin`;
- a normal target account whose email and password may be changed during the test.

The target account must not own a production-like congregation/group and must contain no real user data. The owner/admin/target accounts must be distinct.

The deployed non-production backend must contain the V5 `bq-admin-ops` implementation under test and the normal `bible_admin_audit_log` table.

## Required environment variables

Set these only in the controlled execution environment. Do not paste their values into issues, PRs, logs or committed files.

- `BQ_V5_TEST_SUPABASE_URL`
- `BQ_V5_PRODUCTION_SUPABASE_URL` — used only as a hard safety comparison; the harness refuses identical origins.
- `BQ_V5_TEST_ANON_KEY`
- `BQ_V5_TEST_SERVICE_ROLE_KEY` — used only for test verification/restoration; never printed.
- `BQ_V5_OWNER_EMAIL`
- `BQ_V5_OWNER_PASSWORD`
- `BQ_V5_ADMIN_EMAIL`
- `BQ_V5_ADMIN_PASSWORD`
- `BQ_V5_TARGET_EMAIL`
- `BQ_V5_TARGET_PASSWORD`
- `BQ_V5_TARGET_NEW_EMAIL` — a controlled mailbox/address reserved for this test.
- `BQ_V5_E2E_CONFIRM_NONPROD=I_UNDERSTAND_NONPROD_ONLY`

## Run

```sh
node tests/v5-admin-email-change-e2e.mjs
```

The harness fails closed unless every required value is present, HTTPS is used, the test origin differs from the declared production origin, and the explicit non-production acknowledgement is present.

## What PASS proves

A complete PASS proves real backend behavior, not only source inspection:

1. all three controlled identities can authenticate;
2. a non-owner admin receives HTTP 403 for `change_email`;
3. the active owner receives HTTP 409 when attempting the emergency action on itself;
4. the owner can change the controlled target's Auth email;
5. the response does not echo an email value;
6. the target's pre-change refresh token no longer works, proving the expected global session-revocation path invalidated the existing refresh session;
7. the latest `change_email` audit row names the correct actor/target and contains `emailChanged: true` without email/password/token/secret keys or values;
8. the target Auth email is restored to its original value in `finally` cleanup.

If cleanup fails, the harness fails even if the change itself succeeded and prints only the HTTP status requiring operator cleanup. It never prints credentials, tokens, keys, or email addresses.

## Evidence classification

- `node --check tests/v5-admin-email-change-e2e.mjs` is **STATIC** syntax evidence only.
- A real invocation with controlled non-production Supabase credentials that reaches the final PASS line is **BACKEND-E2E** evidence for the Phase 2 email-change acceptance item.
- Production execution is prohibited.

Record only: exact repository SHA, non-production project identifier safe for disclosure, UTC/JST execution time, PASS/FAIL, and any non-sensitive HTTP/error category. Never attach environment dumps or raw Auth responses.
