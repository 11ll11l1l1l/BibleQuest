# V5 Admin isolated-local BACKEND-E2E evidence — 2026-09-18

Evidence source head: `1fa91d30d85067abcaa17c3b2e06b514421a42aa`.

GitHub Actions run: `35283763923`.
Job: `admin-local-e2e` / `105411397336`.

This record contains no email addresses, passwords, access/refresh tokens, API keys, user IDs, raw audit payloads, or production project identifiers.

## Topology

The run used a fresh Supabase CLI stack on loopback inside an ephemeral GitHub Actions runner. It did not connect to or mutate the hosted BibleQuest Supabase project.

The workflow copied only:

- `20260905_admin_auth_schema_parity.sql`;
- `20260915183000_admin_session_revocation.sql`; and
- the exact checked-in `supabase/functions/bq-admin-ops/index.ts`.

Three distinct Auth users were generated at runtime for owner/admin/target roles. Their credentials were generated in memory, never committed, and removed with the disposable stack.

## Real execution

The existing `tests/v5-admin-email-change-e2e.mjs` harness executed against the loopback Supabase Auth/API/function stack.

Observed PASS conditions:

- dedicated non-owner admin attempt denied;
- active owner self-target attempt denied;
- owner-to-target email mutation succeeded;
- target Auth email changed to the temporary controlled address;
- pre-change target refresh/session material failed after session revocation;
- latest `change_email` audit row identified the correct actor/target/action and contained only the approved `emailChanged` / `sessionsRevoked` status markers;
- old/new email, password, token, and recovery values were absent from audit detail;
- target email was restored by the harness before completion;
- wrapper cleanup deleted all disposable users; and
- the local stack stopped successfully.

The retained CI log records:

- `PASS: controlled non-production owner email-change E2E verified.`
- `PASS: isolated local Supabase Admin email-change BACKEND-E2E completed with disposable identities.`

## Evidence class

**BACKEND-E2E PASS** for the V5 Phase 2 controlled email-change requirement.

The checked-in runbook now recognizes the isolated loopback Supabase CLI workflow as the zero-cost Phase 2 non-production topology. Hosted non-production evidence remains subject to HTTPS and explicit hosted production-origin separation.

This evidence does not satisfy any Web Push DEVICE/FIELD requirement and does not authorize production mutation.
