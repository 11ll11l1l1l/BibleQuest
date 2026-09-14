# A2 controlled non-production backend evidence runbook

Status: V5 evidence-readiness only. This document does not authorize production mutation and does not convert STATIC checks into BACKEND-E2E or DEVICE/FIELD evidence.

## Purpose

Phase 2 still requires a real Supabase Auth email-change run and restoration on controlled identities. Phase 4 still requires controlled server delivery plus closed-app/disabled-push device evidence. Before either is attempted, the operator must prove that the target topology is non-production, isolated from the production project, uses dedicated test identities/device data, and has an explicit cleanup plan.

The checked-in preflight is intentionally network-free. It verifies current source security contracts and, when run with `--runtime-preflight`, validates only the shape and separation of operator-provided test configuration. It never prints credential, token, email, user-id, project-id, or VAPID values.

## Current authoritative owners

- Phase 2 privileged action: `supabase/functions/bq-admin-ops/index.ts`, action `change_email`.
- Phase 4 privileged sender: `supabase/functions/bq-push-delivery/index.ts`.
- Phase 4 account-owned subscription storage/RLS: `supabase/migrations/20260914072000_push_subscriptions.sql`.
- Notification Center rows remain the push sender's source of truth; this runbook does not add a notification engine.

## Hard stop conditions

Do not execute real backend evidence if any condition below is true:

1. The test Supabase project origin is missing, not HTTPS, or equals the declared production project origin.
2. The project is merely "connected" but has not been positively identified by the operator as a disposable/controlled non-production BibleQuest environment.
3. The owner, admin, and target identities are not three dedicated, distinct controlled test users.
4. The target account does not have two controlled email addresses available: the original address and a temporary replacement address used only for the test.
5. The operator cannot restore the target email immediately after the Phase 2 mutation or cannot remove test push subscriptions after Phase 4 evidence.
6. Required access/refresh tokens are not short-lived controlled test credentials, or any credential would need to be committed, pasted into Issue #185, CI logs, screenshots, reports, or repository files.
7. VAPID server configuration has not been confirmed in the non-production function environment without disclosing the private key.
8. A separate test device/browser profile is unavailable for push permission, closed-app delivery/tap, and disabled-push proof.
9. Any step would require weakening RLS, granting `anon` access, exposing service-role/VAPID private material, or changing production configuration/data.

## Preflight

Run the static contract in ordinary CI:

```bash
node --check scripts/verify-v5-a2-nonprod-evidence-readiness.mjs
node scripts/verify-v5-a2-nonprod-evidence-readiness.mjs
```

For an operator-side readiness check, export the values only into the local process environment or approved secret store, then run:

```bash
node scripts/verify-v5-a2-nonprod-evidence-readiness.mjs --runtime-preflight
```

Required operator environment names:

- `BQ_EVIDENCE_NONPROD_ACK=BIBLEQUEST_NONPROD_EVIDENCE_ONLY`
- `BQ_EVIDENCE_TEST_SUPABASE_URL`
- `BQ_EVIDENCE_PROD_SUPABASE_URL`
- `BQ_EVIDENCE_OWNER_USER_ID`
- `BQ_EVIDENCE_ADMIN_USER_ID`
- `BQ_EVIDENCE_TARGET_USER_ID`
- `BQ_EVIDENCE_TARGET_ORIGINAL_EMAIL`
- `BQ_EVIDENCE_TARGET_TEMP_EMAIL`
- `BQ_EVIDENCE_OWNER_ACCESS_TOKEN`
- `BQ_EVIDENCE_ADMIN_ACCESS_TOKEN`
- `BQ_EVIDENCE_TARGET_REFRESH_TOKEN`
- `BQ_EVIDENCE_RESTORE_TARGET_EMAIL=yes`
- `BQ_EVIDENCE_DELETE_TEST_PUSH_SUBSCRIPTIONS=yes`
- `BQ_EVIDENCE_VAPID_CONFIGURED=yes`
- `BQ_EVIDENCE_TEST_DEVICE_READY=yes`

Never set `BQ_EVIDENCE_PRODUCTION_MUTATION_ALLOWED=yes`; the preflight rejects it.

A successful runtime preflight means only that the proposed topology is structurally ready. It performs zero network calls and must be recorded as readiness, not BACKEND-E2E or DEVICE/FIELD PASS.

## Phase 2 controlled email-change evidence sequence

Only after the preflight passes:

1. Confirm the test project's `bq-admin-ops` deployment corresponds to the candidate source being evaluated; do not deploy to production.
2. Authenticate the dedicated non-owner admin and prove `change_email` is denied.
3. Authenticate the dedicated owner and prove self-target change is denied.
4. With the owner, change only the dedicated target user's email from the controlled original to the controlled temporary address.
5. Verify the API response contains status flags only and does not echo either email, credentials, or tokens.
6. Verify the target's pre-change refresh/session material no longer succeeds, using the dedicated target fixture only.
7. Verify the `change_email` audit row contains the actor/target/action and privacy-safe flags, not old/new email values, password/token material, or recovery secrets.
8. Restore the target to the original controlled email immediately. Confirm restoration before any PASS claim.
9. Remove local temporary environment values/tokens according to the test credential policy.

Evidence classification is BACKEND-E2E only when the real non-production calls above execute successfully and restoration is verified. Static source checks, a passing readiness preflight, or a connected-project inventory do not satisfy this gate.

## Phase 4 controlled Web Push evidence sequence

Only after the preflight passes and the client/service-worker owner has a compatible current-head candidate:

1. Confirm the non-production project contains the expected account-owned `bible_push_subscriptions` RLS contract and the current `bq-push-delivery` function. Do not alter RLS to facilitate testing.
2. Use the dedicated test user/browser profile to create a subscription through the accepted client lifecycle. Keep category preferences initially disabled and verify no push is sent for a disabled category.
3. Explicitly enable one test category and create/use a fresh Notification Center row owned by that same controlled test user.
4. Invoke the accepted privileged delivery path with only the notification id. Confirm recipient/category/title/body are derived server-side and delivery does not expose server credentials.
5. Close/background the app as required by the acceptance gate and prove notification delivery and tap routing on the test device/browser profile.
6. Revoke/expire one controlled endpoint if a safe push-service test path is available and prove only that exact recipient subscription is removed for permanent 404/410 invalidation.
7. Delete all test push subscriptions and any disposable Notification Center fixture created solely for the run.

Server delivery can qualify as BACKEND-E2E when exercised against the controlled non-production backend. Closed-app arrival, tap routing, and disabled-push behavior remain DEVICE/FIELD evidence and must not be inferred from server success.

## Evidence record rules

A retained report may include candidate SHA, non-sensitive test-case IDs, timestamps, HTTP status classes, aggregate delivery/removal counts, cleanup/restoration PASS/FAIL, and evidence class. It must not include email addresses, access/refresh tokens, service-role values, VAPID private material, raw push endpoint/key material, recovery secrets, temporary passwords, or private notification content.

If any cleanup/restoration step fails, classify the run FAIL/BLOCKED, stop further mutation, preserve only non-sensitive diagnostics, and resolve the controlled fixture before another run.
