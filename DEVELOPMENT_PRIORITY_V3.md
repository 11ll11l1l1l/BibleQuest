# BibleQuest v3 — Current Development Priority

Updated: 2026-09-12 JST after exact-green Visual Phase B Account promotion.

This is the cross-feature task-selection authority. Read `RECONCILIATION_V3.md` next for exact product/release ancestry and evidence.

## Current product truth

- current exact-green product: `2f04b7150b36d4a14dac953fd08ae2c5a307d0d9`
- current frozen product ref: `release/v3-phase-b-account-artwork-20260912`
- current accumulated verifier: run `34632158164` — **success**
- current product PR: #109
- parent exact-green Avatar Vault product: `df2a7051e305474a5ea24912c3f5341f33bc61b8`, run `34630985269` — success
- prior Personal Mission Phase B product: `df1bbd18782bee6430546ee7b444ad4bc48f5116`, run `34629528297` — success
- prior Calendar Phase B product: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3e`, run `34627049878` — success
- prior More Phase B product: `046e2a85cafe10d722d03d467d3733eddfeb6e65`, run `34618963635` — success
- production Supabase release migrations: **APPLIED + LIVE VERIFIED** and unchanged
- previous rollback: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Run `34632158164` explicitly checked out exact PR synthetic merge candidate `2f04b715...`, and the complete accumulated architecture, edge/security/static and browser/mobile suite passed. The candidate was frozen before `main` moved to the same SHA.

Provider deployment identity and fresh independent two-host production verification have not been recorded for this exact product and must not be inferred from older PASS evidence.

## Authority order

1. latest explicit user instruction;
2. this file for cross-feature priority;
3. `RECONCILIATION_V3.md` for product/release ancestry and integration truth;
4. current handoff/status;
5. feature contract inside the selected feature;
6. exact-candidate workflow/deployment/live evidence;
7. historical inventory/release/agent evidence.

## Priority 1 now — coordinated functionality and artwork completion

Resume product selection from exact-green `2f04b715...`. Select by dependency, user value and verifiability rather than historical inventory order.

### 1A — functionality/correctness

Complete genuinely unfinished accepted functionality and reproduced defects. Confirm incompleteness through the current v3 runtime before coding. A credible current P0/P1 may interrupt other work; stale/minor findings may not.

Old PR #88 is not a current v3 P0 merely because its legacy root `account.js` contains a stale-device progress path. Current v3 boots through `src/app/bootstrap.js`, current account behavior lives in `src/app/account.js`, and progress ownership lives under `src/core/progress.js`. Reproduce a problem through the current v3 runtime before selecting any related correction.

Completed and **not** automatic work anymore:

- Calendar v1/v1.5 core behavior;
- Ministry Hub Calendar surface;
- congregation Calendar creator edit/delete;
- existing Calendar migrations/security state;
- fixed-weekly congregation recurrence.

Custom non-weekly recurrence remains explicitly deferred unless new evidence or explicit user direction makes it required and the ownership/acceptance boundary is clear.

### 1B — Visual Phase B

Continue the approved mandatory pre-release visual/artwork program while preserving information architecture, navigation, persistence and backend ownership.

Completed Phase B checkpoints:

- More hub semantic feature icons at exact `046e2a85...`;
- Calendar semantic event/planner artwork at exact `c15d1f...`;
- Personal Mission semantic Review/Study artwork at exact `df1bbd...`;
- Avatar Vault semantic artwork for all 15 existing catalog styles plus locked state at exact `df2a705...`;
- Account semantic profile/sign-in/create/recovery/device/security artwork at exact `2f04b715...`;
- real committed same-origin passive SVG assets;
- permanent focused static and 390 px browser acceptance retained in the accumulated suite.

Do not repeat those surfaces. Select the next materially minimal, placeholder, generic or emoji-like user-facing surface only after inspecting current source and current assets.

The historical `assets/icons/v3/` mapped binary family remains absent. Before any new icon/artwork wiring:

1. inspect `VISUAL_PHASE_B_V3.md` and current surface quality;
2. verify real current assets;
3. use `docs/V3_ICON_ASSET_MAP.md` only for semantic assignments, not as proof binaries exist;
4. generate/import deliberate replacements only for the selected surface;
5. do not invent features just to consume artwork;
6. preserve existing interactions and ownership;
7. verify mobile, accessibility, offline/performance and accumulated regression behavior.

For selected visual work needing generated/replacement artwork: **generate/import → choose → optimize → implement → test**. Routine image approval is not a development gate.

### 1C — release hardening

Release hardening means reproduced defects and current release evidence gaps, not repeating green work.

Current evidence status for exact `2f04b715...`:

- GitHub exact-candidate regression: complete/green;
- frozen exact-green product ref: complete;
- `main` advanced to exact tested candidate: complete;
- provider deployment identity for the exact product: not yet canonically recorded;
- independent two-host live byte/browser verification for the exact product: not yet canonically recorded;
- Issue #6 final acceptance still requires explicit 320/360/390/412/430 px and installed-PWA evidence for the intended final release candidate;
- Issue #68 still requires multi-account field validation for linked congregation/Journey Group/couple activity integration.

Keep these evidence types separate. Do not modify product code merely to manufacture deployment evidence.

## Production migration state

Assignment response presence and Calendar migrations remain `APPLIED + LIVE VERIFIED`. Do not apply them again.

Production history includes:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

## Priority firewall

- P0 — severe current production/security/privacy/data-loss/core outage reproduced through the current v3 runtime.
- P1 — major user-facing capability broken without reasonable workaround, or explicitly approved product-completion/artwork work selected under this plan.
- P2 — real defect/usability issue but not primary-use blocker.
- P3 — cosmetic/speculative/low-impact issue outside the approved visual program.

Planned Visual Phase B quality work is not automatically P3 merely because it is visual. Unplanned tiny cosmetic defects remain low priority.

## Non-negotiable rules

- Rebuild-and-verify.
- One owner/source of truth per responsibility.
- Preserve `src/core/api.js` as the single browser backend/Supabase owner unless an intentional redesign is selected and verified.
- Every changed product candidate earns its own complete verification.
- Never transfer PASS.
- Never claim unexecuted tests.
- Docs-only commits are not product SHAs.
- Do not weaken tests to force green.
- Product regression workflow remains `workflow_dispatch` + `pull_request`; do not add a forbidden `push` trigger.
- Preserve frozen exact-green refs and rollback references.
- GitHub promotion, provider deployment checks and independent live production proof are separate evidence stages.
- Do not call the app bug-free.
