# A4 QA / regression investigation — #77 Notification Center

Agent: `BQ-A4-QA`
Inspected: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#77 Notification Center/inbox**.
- Canonical branch: `feature/v3-notification-center` at exact `a5d4f0712f2a1962b099e1d4d0b5aa22b440b728` at final recheck.
- Dedicated `agent/a1-work/077-...` candidate: not found at inspection.
- Frozen base: `release/v3.49-ministry-hub` at exact `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Base exact bookkeeping run: `34461217180`, success, explicitly checked out/asserted frozen v3.49 exact SHA.
- No complete exact-SHA functional run has been observed for current `a5d4f0712f2a1962b099e1d4d0b5aa22b440b728`.

## PRIMARY EVIDENCE — FACT

1. `FEATURE_INVENTORY_V3.md` defines #77 acceptance as `load; read/unread; open target; refresh`.
2. `NOTIFICATION_CENTER_V3.md` requires signed-out fail-closed behavior, own-row normalization, read/unread and mark-all behavior, authoritative refresh, allowlisted target routing, unsupported-target rejection, 390px browser/mobile coverage, full accumulated regression execution and separate exact functional/bookkeeping gates.
3. The #77 branch is descended from frozen v3.49 and contains the Notification Center application/UI/API implementation plus `scripts/validate-v3-notification-center.mjs`, `tests/v3-notification-center-edge.mjs`, and `tests/v3-notification-center-smoke.mjs`.
4. The accumulated workflow remains `workflow_dispatch`-only and additively invokes all three #77 tests while retaining the complete v3.49 architecture, edge/security and browser/mobile lists; no prior invocation was observed removed.
5. `tests/v3-notification-center-smoke.mjs` uses Playwright at 390x844, opens the real `#/notifications` route signed out, exercises signed-in inbox presentation, verifies unread-count transitions, blocks an `https://evil.example` action kind from exposing an Open action, verifies allowlisted assignment routing, refresh without navigation, mark-all-read behavior, 44px touch targets, no horizontal overflow and no console/page errors.
6. During this A4 pass the branch advanced from `99abc0a...` -> `95932bcc...` -> `bd6c7c...` -> current `a5d4f071...`. The last move changed only `tests/v3-notification-center-smoke.mjs` (2 additions / 2 deletions). Candidate-specific PASS cannot transfer across these SHAs.
7. No complete exact functional workflow run has yet been observed for current exact SHA `a5d4f071...`; workflow/test presence is not execution evidence.

## ACCEPTANCE / NEGATIVE CASES

The exact candidate gate must prove signed-out fail-closed behavior; own-row load/normalization including cross-user and expiry rejection; unread/read state and mark-all behavior; authoritative refresh; strict allowlisted target routing; rejection of unknown/blank/malformed/deferred targets; read-state persistence before supported navigation; 390px usability/overflow/touch targets; and preservation of all accumulated #1–#76 coverage.

## FAILURES / MISSING EVIDENCE

**MISSING EVIDENCE — current exact SHA is NOT READY.**

Structural coverage is present: permanent #77 validator/edge/smoke tests exist and the accumulated workflow invokes them without observed prior-coverage removal.

The remaining release-critical gap is exact execution. No complete exact-SHA functional run has been observed for `a5d4f0712f2a1962b099e1d4d0b5aa22b440b728`, so A4 cannot claim the current implementation/tests or accumulated harness pass on this exact tip.

No product defect is established solely by this missing evidence.

## DISPOSITION

**NOT READY for exact `a5d4f0712f2a1962b099e1d4d0b5aa22b440b728` solely because the complete exact-SHA functional gate has not yet been observed.**

Counterfactual: promotion now would freeze #77 based on source/test presence instead of executed proof. Once an exact workflow explicitly checks out/asserts this SHA and all accumulated architecture, edge/security and browser/mobile phases succeed, A4 may reassess that same SHA. Any later SHA requires fresh review.

## TRIAGE RECONCILIATION

TRIAGE was read only after primary evidence inspection and is stale: it still describes #76 as pre-implementation, while live evidence proves #76 is frozen at v3.49 and #77 is active. It supplies no current #77 promotion authorization.

## STALENESS CONDITIONS

This report becomes stale immediately if `feature/v3-notification-center` advances from `a5d4f0712f2a1962b099e1d4d0b5aa22b440b728`, if a dedicated #77 work candidate appears, if workflow/tests change, if exact run evidence appears, or if the authoritative #77 contract/inventory changes.

A4 modified no product/workflow/canonical branch/inventory/release/handoff/lease/CURRENT/TRIAGE/main/production state.