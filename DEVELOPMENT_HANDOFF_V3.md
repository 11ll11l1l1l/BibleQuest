# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after branch/document reconciliation.

## First instruction

Read, in order:

1. `DEVELOPMENT_PRIORITY_V3.md` — cross-feature task-selection authority;
2. `RECONCILIATION_V3.md` — branch graph, cumulative-product truth and integration gates;
3. `DEVELOPMENT_STATUS_V3.md` — summarized current state;
4. feature contracts such as `CALENDAR_V3.md` only for their feature behavior;
5. `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before any Assignment Private Responses production integration.

For new chat instances, use `CONTINUE_PROMPT_V3.md`.

## Production state — preserve

- repository: `11ll11l1l1l/BibleQuest`
- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`
- `main` recovered before this reconciliation: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`
- historical release-parity scope: 98/98 complete
- #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened

Do not repoint production, apply migrations or change production data merely because a development branch is green.

## Critical reconciliation result

There is **no single cumulative latest exact-green post-release product SHA** right now.

Do not use commit date as whole-product authority.

### Verified feature lines

- Visual Phase A: `406c34dcdf904b7483bf4381be774a908738e60c`
- Assignment Private Responses: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`, verifier run `34588223163`
- Workspace schema compatibility: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`, verifier run `34594577664`; cumulative on Assignment
- Calendar v1.5: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`, verifier run `34604370963`; exact-green but divergent from Assignment → Workspace

A global/latest cumulative product SHA may be recorded only after intended feature lines are integrated and the resulting exact SHA passes the complete accumulated verification.

## Documentation conflict rule

When the same or related documentation differs across feature branches, do not guess which whole file wins.

- `DEVELOPMENT_PRIORITY_V3.md` governs cross-feature priority.
- `RECONCILIATION_V3.md` governs integration/branch truth.
- `DEVELOPMENT_STATUS_V3.md` describes cumulative state only.
- A feature contract governs that feature's behavior/ownership only.
- Exact-SHA test evidence proves which product SHA earned PASS.

For Calendar, the implemented v1/v1.5 contract recovered from the verified Calendar line supersedes the older generic pre-implementation Calendar prose **inside Calendar scope**, but it does not supersede global planning/status documents.

## Assignment Private Responses migration

Canonical migration:

`supabase/migrations/20260911131000_assignment_response_presence.sql`

Verified Assignment-line blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

Production application is not recorded. Treat it as **UNAPPLIED until positively verified**.

Future release steps:

1. select a cumulative candidate that includes/expects Assignment Private Responses;
2. compare production migration/schema state;
3. compare deployed `private.bible_assignment_visible(...)` with the migration because the file uses `create or replace function`;
4. compare any user-supplied SQL to the committed reviewed migration and reject unexplained differences;
5. apply the migration immediately before compatible code if possible, otherwise immediately after it;
6. run live privacy/authorization smoke;
7. record `APPLIED + LIVE VERIFIED` only with evidence.

Do not apply this migration on a divergent/unrelated branch merely because the file exists.

The intended privacy boundary is non-negotiable: peer-visible completion presence is physically separated from private answer/feedback text; clients cannot mutate the projection; the private SECURITY DEFINER sync function is not callable by anon/authenticated roles.

## Immediate next product milestone

Restore one cumulative product truth:

1. refresh all live refs;
2. use the cumulative Assignment → Workspace exact-green line (`61ee54f...`) as the integration base unless newer verified ancestry provides a better one;
3. diff/replay Calendar v1.5 product changes from `01ba15e...` onto that line rather than blindly choosing the newer timestamp;
4. resolve owner/doc conflicts explicitly;
5. create one cumulative candidate;
6. run focused Assignment/Workspace/Calendar verification plus the complete accumulated exact-SHA suite;
7. preserve the first exact-green cumulative SHA as the new integration checkpoint;
8. only then consider main product promotion and production integration.

## Visual instruction remains active

Visual Phase B remains required after dependency-safe integration work. Consult `VISUAL_PHASE_B_V3.md` and `docs/V3_ICON_ASSET_MAP.md` when present. Do not invent features simply to use an icon. For a selected visual improvement, generate/select/implement/test needed assets directly without asking for routine image approval.

## Evidence/reporting format for every future run

Report separately:

- production SHA;
- live `main` HEAD;
- active development branch;
- feature exact-green SHAs relevant to the work;
- cumulative exact-green candidate SHA, or explicitly `NONE`;
- tests actually executed and workflow run IDs;
- migration state (`NOT APPLIED`, `APPLIED / smoke pending`, or `APPLIED + LIVE VERIFIED`);
- whether production/Supabase were touched;
- next dependency-safe gate.

## Non-negotiable rules

- Rebuild-and-verify; one owner per responsibility.
- Never transfer PASS across changed product SHAs.
- Never claim an unexecuted test.
- Documentation-only commits are not product candidates.
- Chronological recency never substitutes for ancestry/integration evidence.
- Preserve rollback and production boundaries.
- Do not introduce competing backend/Supabase/state owners.
- A GitHub merge/promotion is not proof of Cloudflare propagation.
- Do not call the app bug-free.
