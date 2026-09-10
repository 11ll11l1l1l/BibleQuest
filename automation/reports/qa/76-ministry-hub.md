# A4 QA / regression investigation — #76 Ministry Hub

Agent: `BQ-A4-QA`
Inspected: 2026-09-10 JST

## STATE / PROVENANCE

- Milestone: **#76 Ministry Hub — CLOSED / FROZEN**.
- Canonical branch: `feature/v3-ministry-hub` at exact `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- `agent/a1-work/076-ministry-hub`: absent at this inspection.
- Frozen release: `release/v3.49-ministry-hub` at exact `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Previous frozen base: `release/v3.48-assignment-push` at `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Exact bookkeeping verification: Actions run `34461217180`, verify-branch trigger SHA `1e5e55bfac4a6fd403b05b8a9575bec9243690fd`, completed `success`; the executed workflow explicitly checked out and asserted exact candidate `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Exact functional evidence recorded in product contract: candidate `dfc6440cd7105c73107081dfb4fb16f8bfac2d71`, run `34460593373`, complete accumulated suite green.

## PRIMARY EVIDENCE — FACT

1. `FEATURE_INVENTORY_V3.md` at exact frozen v3.49 records #75 `Regression-tested` and #76 `Verified`, with #76 acceptance `open tools; role guard; navigation`; #77–#79 remain separate.
2. `MINISTRY_HUB_V3.md` defines the bounded #76 portal/navigation contract, including ordinary-member access, fail-closed unsupported roles, current Assignments/Journey Groups routes and deferred Live Room/Leader Dashboard.
3. Permanent #76 evidence exists as `scripts/validate-v3-ministry-hub.mjs`, `tests/v3-ministry-hub-edge.mjs`, and `tests/v3-ministry-hub-smoke.mjs`.
4. The #76 role-boundary regression executes the actual congregation-membership + Ministry Hub service boundary and verifies signed-out, member, leader/ministry and unsupported-role behavior; unsupported roles lose both readable congregation tools and ministry tools.
5. The 390px Playwright regression opens the real `#/ministry-hub` route, verifies member/ministry presentation, supported navigation callbacks, disabled deferred destinations, 44px touch targets, no horizontal overflow and no page/console errors.
6. Comparing frozen v3.48 to v3.49 shows the accumulated workflow changed only to add the three #76 invocations; no prior test invocation was removed. The exact verification workflow at trigger commit `1e5e55bf...` contains all prior v3.48 validators/edge/browser tests plus #76 coverage.
7. Actions run `34461217180` completed exact-SHA assertion, accumulated architecture validators, accumulated edge regressions, Playwright/Chromium setup, local-server startup and accumulated browser/mobile regressions successfully.

## QA DISPOSITION

**READY / CLOSED for exact SHA `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.**

No regression weakening, deletion, skip or bypass was observed in the accumulated harness. The bookkeeping SHA itself has a complete exact-SHA green gate, and the frozen release points to that same SHA.

## FAILURES

- None established for frozen #76.

## MISSING EVIDENCE

- None required to sustain the #76 release claim at the currently frozen SHA.
- This does not transfer PASS to #77 or any later SHA.

## STALENESS CONDITIONS

This report becomes stale if `feature/v3-ministry-hub` or `release/v3.49-ministry-hub` moves, if exact run evidence is invalidated, or if any post-release history rewrite occurs. Existing frozen refs are expected to remain immutable.

## CONTROL-PLANE RECONCILIATION

`automation/CURRENT.md` and `automation/TRIAGE.md` are stale relative to live GitHub state: both still describe v3.48 / pre-implementation #76, while primary evidence proves v3.49 is frozen and a #77 canonical branch now exists. This stale control text does not invalidate the exact #76 release evidence.

A4 modified no product/workflow/canonical branch/inventory/release/handoff/lease/CURRENT/TRIAGE/main/production state.