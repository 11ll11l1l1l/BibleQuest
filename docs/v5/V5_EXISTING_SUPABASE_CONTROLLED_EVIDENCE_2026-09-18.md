# V5 existing-Supabase controlled evidence — 2026-09-18

Candidate source SHA before this evidence-only documentation update: `7b2710fe097b6321fef68916938017bb88bc1c7c`.

This record intentionally contains no email addresses, credentials, tokens, project identifiers, raw push endpoints, subscription keys, VAPID private material, temporary passwords, or private notification content.

## Scope and topology

The operator explicitly required reuse of the existing BibleQuest Supabase project and rejected provisioning a second paid project. All live checks below therefore used dedicated QA/disposable identities and QA-only data inside the existing project. Production member rows were not repurposed for the tests.

This differs from the stricter A2 non-production runbook in `docs/v5/a2-nonprod-backend-evidence-runbook.md`, which requires a Supabase origin isolated from production. Accordingly, Admin email-change observations below are retained as real live-backend evidence but do **not** close the runbook's formal non-production BACKEND-E2E gate.

## Phase 2 — Admin email-change live observation

A disposable owner/admin/target Auth topology exercised the deployed `bq-admin-ops` path using the candidate fail-closed session-revocation RPC.

Observed PASS conditions:

- non-owner admin email-change attempt denied;
- active owner self-target attempt denied;
- owner-to-target email change succeeded;
- target Auth email changed;
- target pre-change refresh/session material was rejected after revocation;
- audit detail contained only privacy-safe status flags and no old/new email, password, token, or recovery value;
- target email was restored before completion;
- disposable Auth users and probe audit rows were removed.

Evidence classification: live backend observation on the existing project. Formal A2 BACKEND-E2E remains open because the checked-in runbook requires an isolated non-production Supabase origin.

## Phase 4 — Web Push backend evidence

The existing project now has the minimum server delivery prerequisites without enabling automatic assignment-triggered pushes:

- VAPID configuration is stored encrypted in Supabase Vault under the dedicated server-only secret owner;
- `bq-push-delivery` prefers normal Edge Function VAPID environment variables and falls back to the Vault record through the server-only database connection;
- `bible_push_subscriptions` remains user-owned/RLS-protected;
- `bible_push_delivery_ledger` remains service-role-only and has an index covering its subscription foreign key;
- the live assignment function was deliberately left unchanged, so no automatic push fanout to real users was enabled.

Controlled live observations:

1. Fresh QA notification with no eligible subscriptions returned a successful no-op: attempted 0, delivered 0, removed 0, failed 0, skipped 0.
2. A disposable, structurally valid subscription was pointed at a controlled HTTPS endpoint returning HTTP 410. The real sender signed/attempted one delivery and returned attempted 1, delivered 0, removed 1, failed 0, skipped 0.
3. The exact subscription row was removed and its unfinished delivery claim did not remain.
4. The temporary notification/subscription rows and temporary HTTP test extension were removed.
5. One-time probe functions were returned to inert HTTP 410 handlers.

The controlled 410 exercise proves the sender's permanent-endpoint cleanup branch, but it is not a genuine browser push-provider 404/410 response. The checklist item requiring an appropriate real push-service response therefore remains open.

Closed-app arrival/tap routing and push-disabled behavior remain DEVICE/FIELD evidence and are not inferred from these backend checks.

## Phase 6 — Gate C multi-congregation isolation

A clearly labelled QA-only second congregation was established using QA identities. No existing production congregation membership was repurposed.

Fourteen live RLS assertions passed across both directions for:

- congregation visibility;
- member directory isolation;
- assignment isolation;
- calendar isolation.

Temporary assignment/calendar fixtures and temporary membership alterations used during the isolation run were cleaned/restored. The QA-only second congregation and its two QA members remain as a controlled reusable Gate C fixture.

Evidence classification: BACKEND-E2E for the RLS isolation boundary.

## Exact-SHA regression evidence

A temporary CI-only PR was created from candidate `7b2710fe097b6321fef68916938017bb88bc1c7c` solely to trigger exact-head workflows. Its only changes were two comment lines in existing test files.

All triggered checks passed:

- Cloudflare Pages exact-SHA deployment: SUCCESS;
- collision guard: SUCCESS;
- preview smoke: SUCCESS;
- accumulated regression, including browser/mobile regressions: SUCCESS;
- push-delivery security, including Deno type checks and secret scan: SUCCESS;
- push-delivery source contract: SUCCESS;
- Section G state/browser matrix: SUCCESS.

The CI-only PR was closed without merge. Its two comment changes were reverted on the temporary branch, leaving zero file diff from `v5/feature-completion`.

## Remaining evidence

Still open:

- formal Admin email-change BACKEND-E2E under the runbook's separate non-production-project requirement;
- genuine push-provider invalid/expired endpoint evidence;
- app closed/backgrounded + push enabled receives a real notification and notification tap opens the accepted same-origin destination;
- push disabled preserves pre-push behavior.

No DEVICE/FIELD item is marked PASS by this record.
