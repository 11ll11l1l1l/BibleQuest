# V5 Phase 6 Gate C — controlled two-congregation BACKEND-E2E

Status: **STATIC/readiness only until the controlled backend harness is actually executed.**

This runbook defines the smallest current-head runtime proof for the remaining V5 multi-congregation isolation gate. It does not change product runtime, schema, RLS, Edge Functions, or any backend data. The harness is deliberately read-only.

## What this proves

When executed successfully against an explicitly approved isolated non-production Supabase project, `tests/v5-gate-c-two-congregation-e2e.mjs` proves that:

- two distinct authenticated users resolve to distinct Auth identities;
- Actor A has an active membership in Congregation A and no active membership in Congregation B;
- Actor B has an active membership in Congregation B and no active membership in Congregation A;
- an active all-member assignment fixture in Congregation A is visible to Actor A and invisible to Actor B;
- the symmetric Congregation B assignment fixture is visible to Actor B and invisible to Actor A;
- a congregation-shared `bible_calendar_events` fixture in Congregation A is visible to Actor A and invisible to Actor B;
- the symmetric Congregation B calendar fixture is visible to Actor B and invisible to Actor A;
- directly changing the client-side `congregation_id` filter to the foreign congregation still returns no Assignment or Calendar rows.

The last assertion matters because V5's active-congregation context is a client selection aid, not an authorization primitive. Gate C requires the backend/RLS boundary to remain authoritative even when a caller deliberately supplies another congregation id.

## What this does not prove

A PASS here is **not** a production-release PASS by itself. This harness does not certify assignment/calendar authoring permissions, assignment recipient workflows, Presence behavior, Web Push delivery, owner email-change/session revocation, device/closed-app behavior, deployment parity, or production configuration. Those remain separate evidence lanes.

The repository workflow `.github/workflows/v5-gate-c-two-congregation-e2e-readiness.yml` runs only syntax/static readiness. A green workflow must never be reported as Gate C BACKEND-E2E PASS.

## Current source owners mapped for this proof

The readiness tranche was mapped from integration head `e571135874aef8a5147cab465add60a275992b21` after the My Journey integration advanced the prior base without touching these owners.

Relevant current owners are:

- `src/app/congregation-membership.js` — client membership/context controller;
- `src/core/api.js` — browser data access for congregation-scoped Assignments;
- `supabase/migrations/20260904_assignments_presence_unlocks.sql` and subsequent assignment hardening migrations — Assignment RLS/visibility;
- `supabase/migrations/20260911_calendar_events.sql`;
- `supabase/migrations/20260911140000_calendar_congregation_sharing.sql` — congregation Calendar sharing/RLS.

The evidence harness bypasses UI filtering and queries Supabase REST directly with each user's access JWT so the tested boundary is RLS, not presentation behavior.

## Required environment topology

Do not run until all of the following are true:

1. A disposable or otherwise explicitly approved **non-production** BibleQuest Supabase target exists.
2. Its V5 schema/migrations are at the candidate revision being evaluated.
3. Two dedicated test accounts exist.
4. Two distinct test congregations exist.
5. Actor A is active in Congregation A and is **not** active in Congregation B.
6. Actor B is active in Congregation B and is **not** active in Congregation A.
7. Each congregation has one deterministic Assignment fixture that is `active=true`, `target_scope='all'`, and currently visible (not future-scheduled).
8. Each congregation has one congregation-shared `bible_calendar_events` fixture.
9. The production Supabase origin is known so the harness can reject identical test/production origins.

The fixtures can be prepared through an approved non-production admin/ministry path. Do not seed them by pointing this harness at a service-role key; the harness intentionally has no service-role path.

## Required environment variables

```text
BIBLEQUEST_GATE_C_BACKEND_E2E_ALLOWED=true
BIBLEQUEST_TEST_SUPABASE_URL=https://<nonprod-project>.supabase.co
BIBLEQUEST_PRODUCTION_SUPABASE_URL=https://<production-project>.supabase.co
BIBLEQUEST_TEST_SUPABASE_ANON_KEY=<nonprod anon/publishable key>

BIBLEQUEST_GATE_C_CONGREGATION_A_ID=<uuid>
BIBLEQUEST_GATE_C_CONGREGATION_B_ID=<uuid>
BIBLEQUEST_GATE_C_ASSIGNMENT_A_ID=<uuid>
BIBLEQUEST_GATE_C_ASSIGNMENT_B_ID=<uuid>
BIBLEQUEST_GATE_C_CALENDAR_A_ID=<uuid>
BIBLEQUEST_GATE_C_CALENDAR_B_ID=<uuid>

BIBLEQUEST_GATE_C_ACTOR_A_EMAIL=<dedicated nonprod account>
BIBLEQUEST_GATE_C_ACTOR_A_PASSWORD=<secret>
BIBLEQUEST_GATE_C_ACTOR_B_EMAIL=<dedicated nonprod account>
BIBLEQUEST_GATE_C_ACTOR_B_PASSWORD=<secret>
```

Do **not** set `BIBLEQUEST_TEST_SUPABASE_SERVICE_ROLE_KEY`. If present, the harness fails closed. The anon key is also rejected if it decodes as a service-role JWT. Both signed-in access tokens must decode with `role=authenticated`.

## Fail-closed preflight

Before any network request, the harness requires the explicit allow marker. It then requires HTTPS test/production URLs and rejects identical origins. It validates distinct congregation/fixture ids and distinct test-account emails. After login it verifies distinct Auth user ids and the expected isolated active-membership topology before evaluating fixture visibility.

If any prerequisite is missing or ambiguous, the result is **NOT RUN / BLOCKED**, not PASS.

## Execution

Static/readiness only, safe on CI with no secrets or backend request:

```bash
node --check tests/v5-gate-c-two-congregation-e2e.mjs
node tests/v5-gate-c-two-congregation-e2e.mjs --static-readiness
```

Controlled real proof, only in the approved non-production environment after setting the variables above:

```bash
node tests/v5-gate-c-two-congregation-e2e.mjs
```

Capture the exact candidate commit SHA, target non-production project reference/origin, test timestamp, and terminal exit result. Do not capture passwords, access tokens, refresh tokens, or anon keys in evidence artifacts.

## PASS interpretation

A real successful execution may be recorded as:

`Gate C BACKEND-E2E — PASS for authenticated read isolation of congregation membership + Assignments + Calendar on <exact candidate SHA>.`

It must also include this limitation:

`Authoring workflows, Presence, Push/device behavior, deployment parity, and production promotion are outside this proof.`

Until such a controlled execution exists, the repository state remains **Gate C STATIC/readiness only** and V5 must not be described as production-ready on the strength of this tranche.
