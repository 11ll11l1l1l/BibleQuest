# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after branch/document reconciliation.

## Read first

1. `DEVELOPMENT_PRIORITY_V3.md` — cross-feature task-selection authority.
2. `RECONCILIATION_V3.md` — verified branch graph, cumulative-product truth and integration gates.
3. `DEVELOPMENT_STATUS_V3.md` — summarized current state.
4. Feature contracts such as `CALENDAR_V3.md` only for their feature behavior.
5. `ASSIGNMENT_RESPONSE_PRESENCE_MIGRATION_V3.md` before any Assignment Private Responses production integration.
6. `docs/V3_ICON_ASSET_MAP.md` before future PNG/icon visual wiring.

For new chat instances, use `CONTINUE_PROMPT_V3.md`.

## Production state — preserve

- repository: `11ll11l1l1l/BibleQuest`
- production/runtime product SHA: `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
- frozen rollback/reference: `release/v3-production-20260911-r3`
- `main` recovered before reconciliation: `8cd27be5da37ae64ee6db69c0f69ec2014cd43d5`
- historical release-parity scope: 98/98 complete
- #39 Hiragana Match and #40 Kids Bible Who Am I remain retired unless explicitly reopened

Do not repoint production, apply migrations or change production data merely because a development branch is green.

## Critical state — no cumulative post-release winner yet

There is **no single cumulative latest exact-green post-release product SHA**.

### Verified Line A — Assignment → Workspace

- Assignment Private Responses: `73d39ce6fe0f9db20db62e25fd497a8711f921b0`; verifier run `34588223163`.
- Workspace schema compatibility: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`; verifier run `34594577664`; descendant of Assignment.

### Verified Line B — Visual18 → Avatar Vault v2 → Calendar v1.5

- Visual tranche 18: `524adb11cd7e5ad877b5dcdb8f5c28373ad84932`; verifier `34601602518`.
- Avatar Vault v2: `7ce6685a7383102f29797869a77eabcf7ab9c0c2`; verifier `34603004871`; descendant of Visual18.
- Calendar v1.5: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`; verifier `34604370963`; descendant of Avatar v2.

Line A and Line B diverge from recovered merge base `545b5b98d88ca04001d3675317c37cbcd3306955`. Commit date is not whole-product authority.

## Immediate next product milestone

Restore one cumulative product truth:

1. refresh live refs and ancestry;
2. use Line A `61ee54f...` as the dependency-preserving base unless newer evidence provides a verified cumulative successor;
3. reconcile the whole intended Line B delta through `01ba15e...`, preserving Visual18 + Avatar v2 + Calendar v1.5;
4. resolve conflicts by architecture owner/feature contract/verified behavior, not chronology;
5. create one cumulative candidate;
6. run focused Assignment/Workspace/Visual18/Avatar/Calendar checks plus the complete accumulated exact-SHA suite;
7. freeze the first exact-green cumulative SHA;
8. only then consider product promotion to `main` and production integration.

## Documentation conflict rule

- `DEVELOPMENT_PRIORITY_V3.md` governs cross-feature priority.
- `RECONCILIATION_V3.md` governs branch/integration truth.
- `DEVELOPMENT_STATUS_V3.md` describes cumulative state.
- A feature contract governs only that feature.
- Exact-SHA test evidence proves which SHA earned PASS.

If the same filename diverges between branches, diff both versions. Do not guess by timestamp. Preserve verified feature behavior while retaining global planning authority in the global documents.

## Assignment response presence migration

Canonical migration: `supabase/migrations/20260911131000_assignment_response_presence.sql`.
Reviewed blob: `bbbceb057c631f08ec32826384ef6fcd61da4527`.

Production application is not recorded. Treat it as **UNAPPLIED until positively verified**.

Future production integration must:

1. select a cumulative candidate that contains/expects Assignment Private Responses;
2. compare production migration/schema state;
3. compare deployed `private.bible_assignment_visible(...)` with the reviewed migration because the migration replaces that helper;
4. compare any supplied SQL to the committed reviewed migration;
5. apply immediately before compatible code when possible, otherwise immediately after;
6. run live privacy/authorization smoke;
7. record `APPLIED + LIVE VERIFIED` only with evidence.

The peer-visible presence projection must remain physically separated from private answer/feedback text; authenticated clients cannot mutate it; the sync SECURITY DEFINER function is not a public/anon/authenticated RPC surface.

## PNG icon-map status

`docs/V3_ICON_ASSET_MAP.md` is the canonical semantic map for all 70 analyzed PNGs. It was recovered from `visual/v3-icon-asset-map` head `df02e1d43d6b9c14d43de3212baf9b50c09f83d0`, guide blob `e42b7b5314e6581f00633290ecac84ff738c8002`.

At reconciliation time `assets/icons/v3/` was **not present on `main`**. Do not assume the binaries are committed. Before visual wiring, verify/import exactly the intended asset set, then follow the guide. Never invent features just to use icons. For an already-selected visual improvement, mapped/generated artwork should be chosen, implemented and tested without routine user approval.

## Reporting format for future runs

Report separately:

- production SHA;
- live `main` HEAD;
- active branch;
- relevant exact-green Line A/Line B feature SHAs;
- cumulative exact-green candidate SHA, or explicitly `NONE`;
- tests/workflows actually executed;
- migration state (`NOT APPLIED`, `APPLIED / smoke pending`, or `APPLIED + LIVE VERIFIED`);
- whether production/Supabase were touched;
- next dependency-safe gate.

## Non-negotiable rules

Rebuild-and-verify; one owner per responsibility; never transfer PASS; never claim unexecuted tests; docs-only commits are not product candidates; chronology does not replace ancestry; preserve rollback/production; no competing backend/Supabase/state owners; GitHub promotion is not Cloudflare propagation proof; do not call the app bug-free.
