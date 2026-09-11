# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after cumulative integration verification.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md`
2. `RECONCILIATION_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. `CALENDAR_V3.md` only for Calendar behavior/ownership
5. `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before Assignment production integration
6. `docs/V3_ICON_ASSET_MAP.md` before PNG/icon visual wiring
7. `CONTINUE_PROMPT_V3.md` for a reusable new-chat continuation prompt

Repository evidence and the latest explicit user instruction override stale prose.

## Current state

- repository: `11ll11l1l1l/BibleQuest`
- production/runtime SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- rollback/reference: `release/v3-production-20260911-r3`
- live `main` last recovered: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`
- cumulative exact-green product SHA: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- exact verifier run: `34610903807` — success
- integration branch: `integration/v3-cumulative-line-a-line-b-20260911`
- verifier branch: `verify/v3-cumulative-cf17f36-20260911`

`cf17f36...` directly merges verified Line A `61ee54fac7d352312cef7ffd8010997fa8bc9e51` and verified full Line B `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`.

The former divergence is resolved in this candidate. Do not restart the Line A + Line B merge unless live repository evidence shows a newer divergence.

## Included verified work

- Assignment Private Responses `73d39ce6fe0f9db20db62e25fd497a8711f921b0`;
- Workspace schema compatibility `61ee54fac7d352312cef7ffd8010997fa8bc9e51`;
- Visual tranche 18 `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`;
- Avatar Vault v2 `7ce6685a7383102f29797869a77eabcf7ab9c0c2`;
- Calendar v1.5 `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`.

## Verification evidence

Run `34610903807` passed exact ancestry/candidate checks, focused cross-line regressions, deployment gate, accumulated architecture validators, accumulated edge regressions, and accumulated browser/mobile regressions.

A docs-only commit after `cf17f36...` does not inherit or replace its product identity. Report branch HEAD and exact-green product SHA separately.

## Production migration gates

Assignment response presence migration:
`supabase/migrations/20260911131000_assignment_response_presence.sql`
Reviewed blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

State: `NOT APPLIED / UNKNOWN` until positively checked in production. Before applying, compare deployed `private.bible_assignment_visible(...)`; after applying, run live authorization/privacy smoke.

Calendar migrations are also present in the candidate:

- `supabase/migrations/20260911_calendar_events.sql`
- `supabase/migrations/20260911140000_calendar_congregation_sharing.sql`

Do not infer production application from repository presence.

## Immediate next gate

Do not begin a competing feature branch from an older line.

1. preserve `cf17f36...`;
2. refresh `main` immediately before any promotion;
3. review production migration state and deployment order;
4. if promotion is selected, promote the cumulative exact-green product deliberately;
5. separately verify Cloudflare propagation and live Assignment/Calendar authorization behavior;
6. after production integration closes, continue the next dependency-safe Priority 1 feature/visual milestone from the newest cumulative exact-green base.

## Visual/icon instruction

`docs/V3_ICON_ASSET_MAP.md` maps the analyzed 70-PNG family. The map is a semantic contract, not proof the binaries are present. Verify/import them before wiring. Do not invent features to use icons. For selected visual work, generated/mapped assets follow `generate → choose → optimize → implement → test` without routine approval stops.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; `src/core/api.js` remains the single browser backend/Supabase owner unless intentionally redesigned; never transfer PASS; never claim unexecuted tests; docs-only commits are not product candidates; committed migration is not applied migration; GitHub promotion is not Cloudflare proof; preserve rollback; do not call the app bug-free.
