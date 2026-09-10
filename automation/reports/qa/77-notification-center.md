# A4 QA / regression investigation — #77 Notification Center

Agent: `BQ-A4-QA`
Inspected: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#77 Notification Center/inbox**.
- Canonical branch: `feature/v3-notification-center` at exact `95932bcc5a8b3e595e0d6fc8c3d97aba07671ab0` at final recheck.
- Dedicated `agent/a1-work/077-...` candidate: not found at inspection.
- Frozen base: `release/v3.49-ministry-hub` at exact `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Base exact bookkeeping run: `34461217180`, success, explicitly checked out/asserted frozen v3.49 exact SHA.
- No Actions run exists with head SHA `95932bcc5a8b3e595e0d6fc8c3d97aba07671ab0`.

## PRIMARY EVIDENCE — FACT

1. `FEATURE_INVENTORY_V3.md` defines #77 acceptance as `load; read/unread; open target; refresh`.
2. `NOTIFICATION_CENTER_V3.md` requires signed-out fail-closed behavior, own-row normalization, read/unread and mark-all behavior, authoritative refresh, allowlisted target routing, unsupported-target rejection, 390px browser/mobile coverage, full accumulated regression execution and separate exact functional/bookkeeping gates.
3. The #77 branch is descended from frozen v3.49 and contains the Notification Center application/UI/API implementation plus `scripts/validate-v3-notification-center.mjs`, `tests/v3-notification-center-edge.mjs`, and `tests/v3-notification-center-smoke.mjs`.
4. Between earlier inspected `99abc0a28916c671784e13ad1c3aa7ec80e782f0` and current `95932bcc...`, exactly two commits added the 390px smoke test and additively wired all three #77 tests into `.github/workflows/v3-regression.yml`.
5. Current `.github/workflows/v3-regression.yml` remains `workflow_dispatch`-only and retains the complete v3.49 accumulated validator, edge/security and browser/mobile invocation lists while adding exactly the #77 validator, edge test and smoke test. No prior invocation was observed removed in the current workflow comparison.
6. `tests/v3-notification-center-smoke.mjs` uses Playwright at 390x844, opens the real `#/notifications` route signed out, exercises a signed-in inbox presentation, verifies unread-count transitions, blocks an `https://evil.example` action kind from exposing an Open action, verifies allowlisted assignment routing, refresh without navigation, mark-all-read behavior, 44px touch targets, no horizontal overflow and no console/page errors.
7. No exact functional workflow run exists yet for current SHA `95932bcc...`; workflow presence is not execution evidence.

## ACCEPTANCE / NEGATIVE CASES

The exact candidate gate must prove, at minimum:

- signed-out route fails closed without private inbox access;
- authenticated own rows load with normalization, cross-user/expiry rejection and newest-first semantics;
- unread count/state and own-row read/unread writes behave correctly;
- mark-all-read and manual refresh reload authoritative state and report failures honestly;
- allowlisted routes remain assignment -> assignments, ministry -> ministry-hub, recognition -> recognition, media -> media;
- unknown/blank/malformed/deferred action kinds never become arbitrary routes, URLs, HTML or executable commands;
- supported-target opening persists read state before navigation and does not falsely navigate after a failed write;
- 390px real-route UI remains usable without overflow or sub-44px active controls;
- all accumulated #1–#76 regression invocations remain intact.

## FAILURES / MISSING EVIDENCE

**MISSING EVIDENCE — current exact SHA is NOT READY.**

Earlier structural gaps are now resolved at `95932bcc...`: permanent #77 validator/edge/smoke files exist and the accumulated workflow invokes them additively while retaining prior coverage.

The remaining release-critical gap is exact execution: there is no completed exact-SHA functional run for `95932bcc5a8b3e595e0d6fc8c3d97aba07671ab0`. Therefore A4 cannot claim the new tests or accumulated harness actually pass on this SHA.

No product defect is established by this missing evidence. A4 did not execute the suite independently and does not substitute source inspection for exact runtime evidence.

## DISPOSITION

**NOT READY for exact `95932bcc5a8b3e595e0d6fc8c3d97aba07671ab0` solely because the required complete exact-SHA functional gate has not yet been observed.**

Counterfactual: promoting this SHA now would freeze #77 based on test presence rather than executed proof. Once a complete exact-SHA run explicitly checks out/asserts this exact candidate and all accumulated architecture, edge/security and browser/mobile phases succeed, A4 may reassess that exact SHA. A later changed SHA requires a fresh review; no PASS transfers.

## TRIAGE RECONCILIATION

TRIAGE was read only after primary evidence inspection. It is stale: it still describes #76 as pre-implementation with no canonical branch or promotion, while live primary evidence proves #76 is frozen at v3.49 and #77 is active. TRIAGE provides no current #77 promotion authorization.

## STALENESS CONDITIONS

This report becomes candidate-stale immediately if `feature/v3-notification-center` advances from `95932bcc5a8b3e595e0d6fc8c3d97aba07671ab0`, if a dedicated #77 work candidate appears, if workflow/tests change, if exact run evidence appears, or if the authoritative #77 contract/inventory changes.

A4 modified no product/workflow/canonical branch/inventory/release/handoff/lease/CURRENT/TRIAGE/main/production state.