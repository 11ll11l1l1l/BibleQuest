# BibleQuest v3 — Current Development Priority

Updated: 2026-09-12 JST after exact-green Visual Phase B Avatar Vault promotion.

This is the cross-feature task-selection authority. Read `RECONCILIATION_V3.md` next for exact product/release ancestry and evidence.

## Current product truth

- current exact-green product: `df2a7051e305474a5ea24912c3f5341f33bc61b8`
- current frozen product ref: `release/v3-phase-b-avatar-vault-artwork-20260912`
- current accumulated verifier: run `34630985269` — **success**
- parent exact-green Personal Mission product: `df1bbd18782bee6430546ee7b444ad4bc48f5116`, run `34629528297` — success
- prior Calendar Phase B product: `c15d1fceddce537fa8a31a6b2b5c909d197b1b3`, run `34627049878` — success
- prior Calendar creator edit/delete product: `7d28d7ced00450f6c1abd93cb31ea78d51c5c876`, run `34623059639` — success
- prior More Phase B product: `046e2a85cafe10d722d03d467d3733eddfeb6e65`, run `34618963635` — success
- production Supabase release migrations: **APPLIED + LIVE VERIFIED** and unchanged
- previous rollback: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Current exact product `df2a705...` has exact-candidate GitHub regression evidence. Provider deployment identity and fresh independent two-host production verification have not been recorded for this exact product and must not be inferred from older PASS evidence.

## Authority order

1. latest explicit user instruction;
2. this file for cross-feature priority;
3. `RECONCILIATION_V3.md` for product/release ancestry and integration truth;
4. current handoff/status;
5. feature contract inside the selected feature;
6. exact-candidate workflow/deployment/live evidence;
7. historical inventory/release/agent evidence.

## Priority 1 now — coordinated functionality and artwork completion

Resume product selection from exact-green `df2a705...`. Select by dependency, user value and verifiability rather than historical inventory order.

### 1A — functionality/correctness

Complete genuinely unfinished accepted functionality and reproduced defects. Confirm incompleteness before coding. A credible current P0/P1 may interrupt other work; stale/minor findings may not.

Completed and **not** automatic work anymore:

- Calendar v1/v1.5 core behavior;
- Ministry Hub Calendar surface;
- congregation Calendar creator edit/delete;
- existing Calendar migrations/security state;
- fixed-weekly congregation recurrence.

Custom non-weekly recurrence remains explicitly deferred. Do not promote it into release scope merely because it is possible. Select it only if new repository evidence or explicit user direction makes it required and the ownership/acceptance boundary is clear.

### 1B — Visual Phase B

Continue the approved visual/artwork upgrade while preserving information architecture, navigation, persistence and backend ownership.

Completed Phase B checkpoints:

- More hub semantic feature icons at exact `046e2a85...`;
- Calendar semantic event/planner artwork at exact `c15d1f...`;
- Personal Mission semantic Review/Study artwork at exact `df1bbd...`;
- Avatar Vault semantic artwork for all 15 existing catalog styles plus locked state at exact `df2a705...`;
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

Release hardening means reproduced post-release defects, current security/privacy regressions or evidence gaps—not repeating green work.

Current release-evidence gap for exact `df2a705...`:

- GitHub exact-candidate regression: complete/green;
- frozen exact-green product ref: complete;
- `main` advanced to exact tested candidate: complete;
- provider deployment identity for the exact product: not yet canonically recorded;
- independent two-host live byte/browser verification for the exact product: not yet canonically recorded.

Keep these evidence types separate. Do not modify product code merely to manufacture deployment evidence.

## Production migration state

Assignment response presence and Calendar migrations remain `APPLIED + LIVE VERIFIED`. Do not apply them again.

Production history includes:

- `20260911144939 assignment_response_presence`
- `20260911144950 calendar_events`
- `20260911145003 calendar_congregation_sharing`

## Priority firewall

- P0 — severe production/security/privacy/data-loss/core outage.
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
