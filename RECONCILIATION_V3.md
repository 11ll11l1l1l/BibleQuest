# BibleQuest v3 — Product/Documentation Reconciliation

Status: cumulative release preserved; post-release Calendar and Visual Phase B milestones exactly verified and promoted
Updated: 2026-09-12 JST after Visual Phase B Calendar artwork promotion

## Current product/release truth

Current exact-green product:

- exact product: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`
- frozen ref: `release/v3-phase-b-calendar-artwork-20260912`
- exact accumulated verifier: run `34627049878` — **success**
- product PR: #104
- verified parent/base: repository `main` at `378ffcd99f5fa656bfd01bfdad477d3fc280baa3`
- feature head: `c8566754760bf7dbce7a207bd5e7431040c46612`

GitHub Actions run `34627049878` fetched `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e` directly as `refs/pull/104/merge`, checked out that SHA, and passed the full accumulated suite. After the run passed, the exact candidate was frozen and `main` was fast-forwarded to the same SHA. No new unverified product promotion commit was created.

Its immediate product ancestry remains fully preserved:

- Calendar creator edit/delete exact-green product: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`; frozen ref `release/v3-calendar-owner-edit-delete-20260912`; run `34623059639` success;
- Visual Phase B More exact-green product: `046e2a85cafe10d722d03d467d3733eddfeb6e65`; frozen ref `release/v3-phase-b-more-icons-20260912`; run `34618963635` success;
- Ministry Hub Calendar exact-green product: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`; frozen ref `release/v3-ministry-calendar-surface-20260912`; run `34616603649` success.

A later documentation-only merge may advance repository HEAD beyond `c15d1f...`. Such a docs SHA is bookkeeping, not a replacement exact-green product candidate.

## Historical cumulative release preserved

The earlier cumulative product remains important ancestry/evidence, but it is no longer current product truth:

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

- exposes the already-verified Calendar route to valid-member Ministry Hub tools;
- keeps Calendar state/persistence/shared-event behavior owned by `src/app/calendar.js`;
- adds no new Calendar schema/API/RLS/storage/recurrence or authorization behavior;
- full accumulated architecture, edge/security and browser/mobile suite passed in run `34616603649`.

### Visual Phase B More hub — `046e2a85...`

- adds real `assets/more-feature-icons.svg` semantic same-origin artwork;
- preserves existing More text/button semantics and route callbacks;
- adds a presentation-only More Phase B layer and permanent static/390 px acceptance;
- full accumulated suite passed in run `34618963635`.

### Calendar creator edit/delete — `7d28d7c...`

- preserves shared-event creator identity as normalized `ownerId`;
- exposes Edit/Delete only to the authenticated creator of the stored base congregation event, never recurrence occurrences;
- fails closed for non-owner mutations before network access;
- scopes API update/delete by event id + creator user id + congregation id;
- reuses existing own-row RLS and existing Calendar schema; no migration added;
- keeps non-owner shared events read-only and personal Calendar behavior unchanged;
- full accumulated suite passed in run `34623059639`.

### Visual Phase B Calendar artwork — `c15d1f...`

- replaces literal Calendar event emoji with passive same-origin SVG artwork;
- adds `assets/calendar-feature-icons.svg` with planner, personal, assignment, congregation and empty-state symbols;
- adds `src/ui/calendar-phase-b.css` after the base Calendar stylesheet;
- improves agenda/source/form presentation without changing Calendar interactions or backend ownership;
- keeps icons decorative and existing text/button semantics authoritative;
- adds permanent `tests/v3-calendar-phase-b-static.mjs` and `tests/v3-calendar-phase-b-smoke.mjs` while retaining existing functional `tests/v3-calendar-smoke.mjs`;
- full accumulated architecture, edge/security/static and browser/mobile suite passed in run `34627049878` on exact candidate `c15d1f...`.

## Deployment evidence for current product

Do not transfer deployment evidence from older product SHAs to current exact product `c15d1f...`.

The latest previously recorded Cloudflare Pages provider checks were for older exact-green product `046e2a85...`. The last independent two-host byte/browser verifier remains run `34612873935` for an earlier cumulative release.

Current exact product `c15d1f...` has complete GitHub exact-candidate regression and promotion evidence. Provider deployment identity and a fresh independent two-host live byte/browser verification have not yet been canonically recorded for this SHA. Until that evidence exists, do not claim `c15d1f...` is independently production-verified.

## Production Supabase truth

Production project: `zkfmgezvzugchcwppreq`.

The release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by all recent Calendar visual/functionality milestones:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. PR #104 made no production database mutation.

## Release-process reconciliation

- PR #97 added `pull_request` execution of the accumulated regression so product candidates receive integration evidence automatically.
- PR #98 restored validator-owned development-status ledger headings after a documentation-contract regression; run `34616114505` passed fully.
- PR #99 attempted a `push` trigger, but the permanent workflow contract correctly rejected it. The PR was closed without merge.
- PR #102 completed congregation Calendar creator edit/delete at exact-green `7d28d7c...`; run `34623059639` passed and that exact candidate was frozen/promoted.
- PR #104 completed Visual Phase B Calendar artwork. Run `34627049878` explicitly checked out exact synthetic merge candidate `c15d1f...`, passed completely, then that exact candidate was frozen/promoted.
- Exact-green promotions therefore continue through the established pattern: verify the PR synthetic merge commit, freeze that exact SHA, and fast-forward `main` to the exact verified commit when ancestry permits.

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

Start all new product development from exact-green `c15d1f...` unless newer repository evidence proves a later verified product.

Do not:

- redo Line A / Line B integration;
- rebuild Calendar v1/v1.5;
- redo the Ministry Hub Calendar surface;
- redo Calendar creator edit/delete;
- redo the More hub or Calendar Phase B artwork milestones;
- promote custom non-weekly recurrence into scope without evidence/user direction;
- reapply the three production migrations;
- wire absent `assets/icons/v3/` binaries;
- add a forbidden `push` trigger to the product regression workflow.

First reproduce and priority-classify any newly reported product/security/privacy/data-loss issue. If no credible P0/P1 gap is present, select the next materially under-designed Visual Phase B surface from current source, use real committed artwork, preserve existing ownership and interactions, add focused permanent acceptance, and require a complete exact-candidate accumulated regression before promotion.

Release-evidence work is separate: record provider deployment identity for the exact product when available and independently verify both production hostnames before claiming production verification.
