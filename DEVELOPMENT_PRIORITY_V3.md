# BibleQuest v3 — Current Development Priority

Updated: 2026-09-12 JST after exact-green Ministry Hub Calendar and Visual Phase B More-hub milestones.

This is the cross-feature task-selection authority. Read `RECONCILIATION_V3.md` next for exact product/release ancestry and evidence.

## Current product truth

- current `main` / exact-green product: `046e2a85cafe10d722d03d467d3733eddfeb6e65`
- current frozen product ref: `release/v3-phase-b-more-icons-20260912`
- current accumulated verifier: `34618963635` — **success**
- parent exact-green Ministry Hub Calendar product: `350cb1e583b207e10ba8dc50c3bb683dc50f9494`
- Calendar verifier: `34616603649` — **success**
- previous cumulative exact-green product: `cf17f36f9f041aee4715271eaebbe8581fc2c067`
- production Supabase release migrations: **APPLIED + LIVE VERIFIED** and unchanged
- previous rollback: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`

Cloudflare deployment-provider checks report success for exact `046e2a85...` on both configured Pages projects. Independent two-host byte/browser verification has not been rerun for this newer product, so do not transfer run `34612873935` from the older cumulative release.

## Authority order

1. latest explicit user instruction;
2. this file for cross-feature priority;
3. `RECONCILIATION_V3.md` for product/release ancestry and integration truth;
4. current handoff/status;
5. feature contract inside that feature;
6. exact-candidate workflow/live evidence;
7. historical inventory/release/agent evidence.

## Priority 1 now — coordinated functionality and artwork completion

Resume from exact-green `046e2a85...`. Select by dependency, user value and verifiability rather than historical inventory order.

### 1A — functionality/correctness

Complete genuinely unfinished accepted functionality and reproduced defects. Confirm incompleteness before coding. Current credible P0/P1 may interrupt other work; stale/minor findings may not.

Completed and **not** automatic work anymore:

- Calendar v1/v1.5;
- Ministry Hub Calendar surface;
- existing Calendar migrations/security state.

Leading Calendar functionality candidates still requiring investigation before selection:

1. congregation-event edit/delete UI and owner flow;
2. custom recurrence beyond fixed weekly.

Do not assume either is missing from old prose alone. Inspect current owner/UI/tests first. If already complete, select the next verified gap instead.

### 1B — Visual Phase B

Continue the approved visual/artwork upgrade while preserving information architecture, navigation, persistence and backend ownership.

Completed Phase B checkpoint:

- More hub semantic feature icons at exact `046e2a85...`;
- real committed same-origin SVG sprite, not placeholder paths;
- permanent static and 390 px browser acceptance in the accumulated suite.

The historical `assets/icons/v3/` mapped binary family remains absent. Before any new icon wiring:

1. inspect `VISUAL_PHASE_B_V3.md` and current surface quality;
2. verify real current assets;
3. use `docs/V3_ICON_ASSET_MAP.md` only for semantic assignments, not as proof binaries exist;
4. generate/import deliberate replacements only for the selected surface;
5. do not invent features just to consume artwork;
6. verify mobile, accessibility, offline/performance and accumulated regression behavior.

For selected visual work needing generated/replacement artwork: **generate/import → choose → optimize → implement → test**. Routine image approval is not a development gate.

### 1C — release hardening

Release hardening means reproduced post-release defects, current security/privacy regressions or evidence gaps—not repeating green work.

Current evidence gap: the exact new product has successful Cloudflare deployment checks, but an independent two-host live byte/browser verification equivalent to the prior production verifier has not yet been rerun. Do not conflate the two evidence types.

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
- GitHub promotion, Cloudflare deployment checks and independent live production proof are separate evidence stages.
- Do not call the app bug-free.
