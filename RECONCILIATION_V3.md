# BibleQuest v3 — Product/Documentation Reconciliation

Status: cumulative release preserved; Account Visual Phase B exact candidate verified, frozen and promoted
Updated: 2026-09-12 JST after Visual Phase B Account artwork promotion

## Current product/release truth

Current exact-green product:

- exact product: `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`
- frozen ref: `release/v3-phase-b-account-artwork-20260912`
- exact accumulated verifier: run `34632158164` — **success**
- product PR: #109
- verified base/repository docs HEAD at candidate creation: `bd7f3e1a4a15d725ec647ed1899acad49e8f18ae`
- feature head: `5becefc41150f5578f88c9f6ac107fe5d2a7ecf2`

GitHub Actions run `34632158164` fetched `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9` directly as `refs/pull/109/merge`, checked out that SHA, and passed the complete accumulated architecture, edge/security/static and browser/mobile suite. `tests/v3-account-phase-b-static.mjs` and `tests/v3-account-phase-b-smoke.mjs` both passed inside that accumulated run. After the run passed, the exact candidate was frozen and `main` was advanced to the same SHA. No new unverified product promotion commit was created.

Immediate exact-green ancestry remains preserved:

- Visual Phase B Avatar Vault: `df2a7051e305474a5ea24912c3f5341f33bc61b8`; frozen ref `release/v3-phase-b-avatar-vault-artwork-20260912`; run `34630985269` success;
- Visual Phase B Personal Mission: `df1bbd18782bee6430546ee7b444ad4bc48f5116`; frozen ref `release/v3-phase-b-mission-artwork-20260912`; run `34629528297` success;
- Visual Phase B Calendar: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`; run `34627049878` success;
- Calendar creator edit/delete: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`; run `34623059639` success;
- Visual Phase B More: `046e2a85cafe10d722d03d467d3733eddfeb6e65`; run `34618963635` success;
- Ministry Hub Calendar: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`; run `34616603649` success.

Later documentation-only commits may advance repository HEAD beyond `2f04b715...`. Such docs SHAs are bookkeeping, not replacement exact-green product candidates.

## What the current product adds

### Visual Phase B Account — `2f04b715...`

- adds passive same-origin SVG artwork in `assets/account-feature-icons.svg` for `profile`, `sign-in`, `create-account`, `recovery`, `device` and `security`;
- preserves `src/app/account.js` as Account transaction/device behavior owner, `src/app/session.js` as session/auth state owner, and `src/core/api.js` as browser backend/Supabase boundary;
- limits behavior-adjacent product changes to Account page presentation markup in `src/features/account/index.js` and a bounded presentation layer `src/ui/account-phase-b.css`;
- preserves Sign in/Create account/Recover switching, Continue as guest, login/signup/recovery submits, one-time recovery-code display/copy/save acknowledgement/Continue gate, remembered-device listing/removal, recovery-code regeneration, password change, Return home, sign-out and tutorial handoff;
- keeps security/device/recovery meaning in visible text and decorative SVGs `aria-hidden`;
- adds permanent `tests/v3-account-phase-b-static.mjs` and `tests/v3-account-phase-b-smoke.mjs` coverage;
- 390 px acceptance proves guest states use distinct semantic artwork, signed-in Account renders profile/device/security artwork, relevant action targets remain at least 44 px, callbacks remain functional, the committed sprite loads, and no horizontal overflow or console/page errors are introduced;
- full accumulated regression passed in run `34632158164` on exact candidate `2f04b715...`.

### Retained earlier exact-green Visual Phase B checkpoints

- Avatar Vault artwork: `df2a705...`, run `34630985269` success.
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

## Priority-firewall reconciliation

PR #88 describes stale-device progress overwrite behavior in legacy root `account.js`. That root runtime is not current v3 entry-path code: v3 `index.html` boots `src/app/bootstrap.js`, Account behavior is under `src/app/account.js`, and v3 progress behavior is owned under `src/core/progress.js`. The old PR therefore does not establish a current v3 P0 by itself. Any related issue must be reproduced through the current v3 runtime before product changes are selected.

## Deployment evidence for current product

Do not transfer deployment evidence from older product SHAs to exact product `2f04b715...`.

Current exact product has complete GitHub exact-candidate regression and frozen-ref promotion evidence. Provider deployment identity for `2f04b715...` and a fresh independent two-host live byte/browser verification have not yet been canonically recorded. Until that evidence exists, do not claim `2f04b715...` is independently production-verified.

## Production Supabase truth

Production project: `zkfmgezvzugchcwppreq`.

The release migrations remain **APPLIED + LIVE VERIFIED** and were untouched by the Account visual milestone:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

Do not reapply them. PR #109 made no production database mutation.

## Release-process reconciliation

- PR #97 added `pull_request` execution of the accumulated regression so product candidates receive integration evidence automatically.
- PR #98 restored the validator-owned development-status ledger headings; run `34616114505` passed fully.
- PR #99 attempted a forbidden `push` trigger; the permanent workflow contract rejected it and it was closed without merge.
- PR #102 completed Calendar creator edit/delete at exact-green `7d28d7c...`; run `34623059639` passed.
- PR #104 completed Calendar Visual Phase B at exact-green `c15d1f...`; run `34627049878` passed.
- PR #106 completed Personal Mission Visual Phase B at exact-green `df1bbd...`; run `34629528297` passed.
- PR #108 completed Avatar Vault Visual Phase B at exact-green `df2a705...`; run `34630985269` passed.
- PR #109 completed Account Visual Phase B. Run `34632158164` explicitly checked out exact synthetic merge candidate `2f04b715...`, passed completely, then that exact candidate was frozen and promoted.
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

Start new product selection from exact-green `2f04b715...` unless newer repository evidence proves a later verified product.

First reproduce and priority-classify any newly reported product/security/privacy/data-loss issue. If no credible P0/P1 gap is present, continue the mandatory pre-release Visual Phase B program on the next materially under-designed, placeholder, generic or emoji-like current v3 surface.

Do not:

- redo historical integration;
- rebuild Calendar v1/v1.5;
- redo Ministry Hub Calendar, Calendar creator edit/delete, More, Calendar, Personal Mission, Avatar Vault or Account Phase B milestones;
- promote custom non-weekly recurrence into scope without evidence/user direction;
- reapply the three production migrations;
- wire absent `assets/icons/v3/` binaries;
- add a forbidden `push` trigger to the product regression workflow;
- treat provider deployment or independent live verification as implied by GitHub regression success;
- import stale legacy-root fixes into v3 without reproducing the defect in the current runtime.

For the next selected visual surface, use real committed artwork, preserve existing ownership/interactions, add focused permanent acceptance, and require the complete accumulated exact-candidate regression before promotion.

Before final release approval, separately complete the still-required final-candidate evidence: provider deployment identity, explicit 320/360/390/412/430 + installed-PWA acceptance, multi-account linked-activity field validation, and independent two-host production verification.
