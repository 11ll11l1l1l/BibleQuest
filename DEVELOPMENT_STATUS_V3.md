# BibleQuest v3 Development Status

Updated: 2026-09-11 JST after cumulative Line A + Line B verification.

## Current exact product checkpoints

- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`
- live `main` HEAD recovered after cumulative verification: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`
- cumulative exact-green post-release product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- cumulative verifier run: `34610903807` — **success**
- cumulative integration branch: `integration/v3-cumulative-line-a-line-b-20260911`

A following documentation-only commit does not replace `cf17f36...` as the verified product SHA.

## What `cf17f36...` contains

### Former Line A

- Assignment Private Responses `73d39ce6fe0f9db20db62e25fd497a8711f921b0`;
- Workspace/Cloud Notes deployed-schema compatibility `61ee54fac7d352312cef7ffd8010997fa8bc9e51`.

### Former Line B

- Visual tranche 18 `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`;
- Avatar Vault v2 `7ce6685a7383102f29797869a77eabcf7ab9c0c2`;
- Calendar v1.5 `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`.

`cf17f36...` is a two-parent merge with exact parents `61ee54f...` and `01ba15e...`. The previous divergence is resolved for this candidate.

## Verification

Exact-SHA run `34610903807` passed:

- exact-parent/candidate assertions;
- cumulative integration contract;
- focused Assignment privacy, Workspace schema, Avatar, Calendar and visual regressions;
- deployment gate;
- all accumulated architecture validators;
- all accumulated edge regressions;
- all accumulated browser/mobile regressions.

No PASS may be transferred to a changed product SHA.

## Production state

Production has **not** been changed by this integration work. `main` has **not** been promoted to `cf17f36...`. Cloudflare propagation has not been claimed for this candidate.

Production Supabase/data was not changed during this integration/verification work.

## Migration state

### Assignment response presence

`supabase/migrations/20260911131000_assignment_response_presence.sql`

Reviewed blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

State: `NOT APPLIED / UNKNOWN` until production is positively checked. Read `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before application. Do not infer application from Git or tests.

### Calendar

Candidate contains:

- `supabase/migrations/20260911_calendar_events.sql`
- `supabase/migrations/20260911140000_calendar_congregation_sharing.sql`

Production application state is also unknown until positively checked.

## Calendar status

Calendar v1.5 is implemented and included in the cumulative exact-green product. `CALENDAR_V3.md` remains the Calendar feature behavior/ownership authority. Do not rebuild Calendar v1/v1.5 merely because older planning files describe it as incomplete.

## Visual status

Visual tranche 18 and Avatar Vault v2 are in the cumulative exact-green product. `docs/V3_ICON_ASSET_MAP.md` is the semantic guide for the analyzed 70-PNG family, but the guide alone is not proof that the binary PNG set is committed. Verify/import binaries before wiring them during future Visual Phase B work.

## Correct next route

1. preserve/freeze `cf17f36...` as the current cumulative exact-green product checkpoint;
2. keep documentation commits separate from the verified product SHA;
3. refresh live `main` before any promotion;
4. review Assignment + Calendar production migration state and release sequencing;
5. only then select controlled `main` promotion/deployment;
6. after deployment, independently verify Cloudflare propagation plus live Assignment privacy/authorization and Calendar behavior;
7. once production integration is closed, resume the next dependency-safe Priority 1 functionality/visual milestone from the newest exact-green cumulative base.

## Evidence rules

- repository evidence overrides stale prose;
- docs-only HEAD != verified product SHA;
- committed migration != applied migration;
- GitHub promotion != Cloudflare propagation;
- never claim unexecuted tests;
- never call the application bug-free.
