# BibleQuest v3 — Product/Documentation Reconciliation

Status: cumulative release preserved; Avatar Vault Visual Phase B exact candidate verified, frozen and promoted
Updated: 2026-09-12 JST after Visual Phase B Avatar Vault artwork promotion

## Current product/release truth

Current exact-green product:

- exact product: `df2a7051e305474a5ea24912c3f5341f33bc61b8`
- frozen ref: `release/v3-phase-b-avatar-vault-artwork-20260912`
- exact accumulated verifier: run `34630985269` — **success**
- product PR: #108
- verified base/repository docs HEAD at candidate creation: `42c2e1a23c8b24121de966198187a6bb5b79991a`
- feature head: `0d08ccf4fe8b1de5774d6bd6e4915f913e30ea48`

GitHub Actions run `34630985269` fetched `df2a7051e305474a5ea24912c3f5341f33bc61b8` directly as `refs/pull/108/merge`, checked out that SHA, and passed the complete accumulated architecture, edge/security/static and browser/mobile suite. After the run passed, the exact candidate was frozen and `main` was advanced to the same SHA. No new unverified product promotion commit was created.

Its immediate exact-green product ancestry remains preserved:

- Visual Phase B Personal Mission: `df1bbd18782bee6430546ee7b444ad4bc48f5116`; frozen ref `release/v3-phase-b-mission-artwork-20260912`; run `34629528297` success;
- Visual Phase B Calendar: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3`; frozen ref `release/v3-phase-b-calendar-artwork-20260912`; run `34627049878` success;
- Calendar creator edit/delete: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`; run `34623059639` success;
- Visual Phase B More: `046e2a85cafe10d722d03d467d3733eddfeb6e65`; run `34618963635` success;
- Ministry Hub Calendar: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`; run `34616603649` success.

Later documentation-only commits may advance repository HEAD beyond `df2a705...`. Such docs SHAs are bookkeeping, not replacement exact-green product candidates.

## What the current product adds

### Visual Phase B Avatar Vault — `df2a705...`

- replaces the Avatar Vault page's rendered catalog/lock emoji with passive same-origin SVG artwork in `assets/avatar-vault-icons.svg`;
- provides one committed symbol for each of the existing 15 style IDs plus `lock`;
- preserves `src/engines/avatar-vault.js` as catalog/unlock/progress owner, `src/app/avatar-vault.js` as selected/earned/persistence/API-sync owner, and `src/core/api.js` as browser backend boundary;
- limits product rendering changes to `src/features/avatar-vault/index.js` and a bounded presentation layer `src/ui/avatar-vault-phase-b.css`;
- preserves the catalog, unlock requirements, availability flags, progress wording, saved selection, API sync, leaderboard compatibility, fair-play/scoring meaning, Equip action and Back routing;
- adds permanent `tests/v3-avatar-vault-phase-b-static.mjs` and `tests/v3-avatar-vault-phase-b-smoke.mjs` coverage;
- 390 px acceptance proves all 15 catalog cards render, unlocked Equip remains functional, locked artwork is distinct, every symbol resolves to the committed sprite, relevant controls remain at least 44 px, legacy emoji are not rendered, and no horizontal overflow or console/page errors are introduced;
- full accumulated regression passed in run `34630985269` on exact candidate `df2a705...`.

### Retained earlier exact-green Visual Phase B checkpoints

- Personal Mission artwork: `df1bbd...`, run `34629528297` success.
- Calendar artwork: `c15d1f...`, run `34627049878` success.
- More semantic icons: `046e2a85...`, run `34618963635` success.

## Historical cumulative release preserved

The earlier cumulative release and production verification remain historical ancestry/evidence. They must not be transferred to changed product SHAs.

- cumulative exact-green product: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- cumulative verifier: `34610903807` — success
- previous promoted release commit: `04bd51bfc4ff16a3b42d13e47e95e637999b4880`
- previous release ref: `release/v3-cumulative-20260911-r1`
- previous independent two-host production verifier: `34612873935` — success
- prior rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Do not restart historical reconciliation work.

## Deployment evidence for current product

Do not transfer deployment evidence from older product SHAs to current exact product `df2a705...`.

Current exact product has complete GitHub exact-candidate regression and frozen-ref promotion evidence. Provider deployment identity for `df2a705...` and a fresh independent two-host live byte/browser verification have not yet been canonically recorded. Until that evidence exists, do not claim `df2a705...` is independently production-verified.

## Production Supabase truth

Production project: `zkfmgezvzugchcwppreq`.

The release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by the Avatar Vault visual milestone:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. PR #108 made no production database mutation.

## Release-process reconciliation

- PR #97 added `pull_request` execution of the accumulated regression so product candidates receive integration evidence automatically.
- PR #98 restored the validator-owned development-status ledger headings; run `34616114505` passed fully.
- PR #99 attempted a forbidden `push` trigger; the permanent workflow contract rejected it and it was closed without merge.
- PR #102 completed Calendar creator edit/delete at exact-green `7d28d7c...`; run `34623059639` passed.
- PR #104 completed Calendar Visual Phase B at exact-green `c15d1f...`; run `34627049878` passed.
- PR #106 completed Personal Mission Visual Phase B at exact-green `df1bbd...`; run `34629528297` passed.
- PR #108 completed Avatar Vault Visual Phase B. Run `34630985269` explicitly checked out exact synthetic merge candidate `df2a705...`, passed completely, then that exact candidate was frozen and promoted.
- Accepted promotion pattern remains: PR synthetic merge candidate → full green accumulated run → freeze exact candidate ref → advance `main` to the same verified SHA when ancestry permits.

## Document authority

When documents disagree:

1. latest explicit user instruction;
2. `DEVELOPMENT_PRIORITY_V3.md` for cross-feature task selection;
3. this file for current product/release ancestry and integration truth;
4. `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`;
5. feature-specific contract inside that feature only;
6. exact-candidate workflow/deployment/live evidence;
7. historical release/investigator/ledger documents.

## Next safe gate

Start new product selection from exact-green `df2a705...` unless newer repository evidence proves a later verified product.

First reproduce and priority-classify any newly reported product/security/privacy/data-loss issue. If no credible P0/P1 gap is present, continue the required pre-release Visual Phase B program on the next materially under-designed, placeholder, generic or emoji-like user-facing surface from current source.

Do not:

- redo historical integration;
- rebuild Calendar v1/v1.5;
- redo Ministry Hub Calendar, Calendar creator edit/delete, More, Calendar, Personal Mission or Avatar Vault Phase B milestones;
- promote custom non-weekly recurrence into scope without evidence/user direction;
- reapply the three production migrations;
- wire absent `assets/icons/v3/` binaries;
- add a forbidden `push` trigger to the product regression workflow;
- treat provider deployment or independent live verification as implied by GitHub regression success.

For the next selected visual surface, use real committed artwork, preserve existing ownership/interactions, add focused permanent acceptance, and require the complete accumulated exact-candidate regression before promotion.
