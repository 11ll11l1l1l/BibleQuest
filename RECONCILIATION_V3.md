# BibleQuest v3 — Product/Documentation Reconciliation

Status: cumulative release preserved; post-release Calendar and Visual Phase B milestones exactly verified and promoted
Updated: 2026-09-12 JST

## Current product/release truth

Current exact-green product:

- `main`: `046e2a85cafe10d722d03d467d3733eddfeb6e65`
- frozen ref: `release/v3-phase-b-more-icons-20260912`
- exact accumulated verifier: run `34618963635` — **success**
- verified parent: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`

The current product SHA is the exact PR #100 synthetic merge commit checked out by run `34618963635` (`Merge 624b8e53... into 350cb1e...`). After the run passed, that exact commit was frozen and `main` was fast-forwarded to it. No new unverified promotion commit was created.

Its parent `350cb1e...` is likewise an exact-green merge candidate:

- purpose: Ministry Hub Calendar surface;
- frozen ref: `release/v3-ministry-calendar-surface-20260912`;
- exact accumulated verifier: run `34616603649` — **success**;
- verified base: `de609669e7da7364e6969e11420ff599f45f666c`;
- feature head: `5407c97308df27642b2d8462e5da1e573ea9f08e`.

## Historical cumulative release preserved

The earlier cumulative product remains important ancestry/evidence, but it is no longer current `main`:

- cumulative exact-green product: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- cumulative verifier: `34610903807` — success
- former Line A parent: `61ee54fac7d352312cef7ffd8010997fa8bc9e51`
- former Line B parent: `01ba15e7cdc3f224509858fdd98c2f3b17d8a414`
- previous promoted release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- previous release ref: `release/v3-cumulative-20260911-r1`
- previous independent two-host production verifier: `34612873935` — success
- prior rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Do not restart the historical Line A / Line B reconciliation. It is resolved ancestry.

## What the current product adds after the cumulative release

### Ministry Hub Calendar surface — `350cb1e...`

- adds the already-verified Calendar route to valid-member Ministry Hub tools;
- keeps Calendar state/persistence/shared-event behavior owned by `src/app/calendar.js`;
- keeps congregation-role projection under the existing membership owner;
- does not add schema/API/RLS/storage/recurrence or authorization behavior;
- full accumulated architecture, edge/security and browser/mobile suite passed in run `34616603649`.

### Visual Phase B More hub — `046e2a85...`

- adds real `assets/more-feature-icons.svg` with 15 semantic same-origin symbols;
- wires decorative icons into existing More cards while preserving text/button semantics and route callbacks;
- adds `src/ui/more-phase-b.css` after the historical More visual layer;
- adds permanent static and 390 px browser acceptance tests to the accumulated regression;
- does not wire nonexistent `assets/icons/v3/` paths;
- full accumulated architecture, edge/security/static and browser/mobile suite passed in run `34618963635`.

## Deployment evidence for current product

Cloudflare Pages provider check runs succeeded for exact `046e2a85...` on both configured projects:

- `mybiblequest` — success;
- `biblequest` / `biblequest-7th` — success.

This establishes provider deployment success for the exact product SHA. It is not a substitute for a fresh independent two-host byte-for-byte/browser verification. The last such independent production verifier remains `34612873935` for the earlier cumulative release; its PASS does not transfer.

## Production Supabase truth

Production project: `zkfmgezvzugchcwppreq`.

The release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by the post-release Calendar-surface and visual milestones:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them.

## Release-process reconciliation

- PR #97 added `pull_request` execution of the accumulated regression so product candidates receive integration evidence automatically.
- PR #98 restored validator-owned development-status ledger headings after run `34615866840` exposed a documentation-contract regression; run `34616114505` passed fully.
- PR #99 attempted a `push` trigger, but the permanent workflow contract correctly failed run `34617187008` with `Product v3 regression workflow must not contain a push trigger.` The PR was closed without merge.
- Exact-green promotions therefore continue through the established candidate pattern: verify the PR synthetic merge commit, freeze that exact SHA, and fast-forward `main` to the exact verified commit when ancestry permits.

## Document authority

When documents disagree:

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md` for cross-feature task selection;
3. this file for current product/release ancestry and release truth;
4. `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`;
5. feature-specific contract inside that feature only;
6. exact-candidate workflow/deployment/live evidence;
7. historical release/investigator/ledger documents.

## Next safe gate

Start all new development from exact-green `046e2a85...` unless newer repository evidence proves a later verified product.

Do not:

- redo Line A / Line B integration;
- rebuild Calendar v1/v1.5;
- redo the Ministry Hub Calendar surface;
- redo the More hub Phase B icon milestone;
- reapply the three production migrations;
- wire absent `assets/icons/v3/` binaries;
- add a forbidden `push` trigger to the product regression workflow.

Next investigate congregation-shared Calendar event edit/delete as the leading functionality candidate. Confirm the gap from current owner/UI/tests before writing. If already complete, choose the next verified requirement gap or another materially under-designed Visual Phase B surface. Every product change requires focused permanent coverage plus a complete exact-candidate accumulated regression before promotion.
