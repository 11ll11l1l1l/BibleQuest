# A4 QA / regression investigation — #77 Notification Center

Agent: `BQ-A4-QA`
Inspected: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#77 Notification Center/inbox**.
- Canonical branch: `feature/v3-notification-center` at exact `99abc0a28916c671784e13ad1c3aa7ec80e782f0`.
- Dedicated `agent/a1-work/077-...` candidate: not found at inspection.
- Frozen base: `release/v3.49-ministry-hub` at exact `e17d0096489a5f76a025f4fbb8b52f7d1ec7a3e0`.
- Base exact bookkeeping run: `34461217180` completed success and explicitly checked out/asserted v3.49 exact SHA.
- No Actions run exists with head SHA `99abc0a28916c671784e13ad1c3aa7ec80e782f0`.

## PRIMARY EVIDENCE — FACT

1. `FEATURE_INVENTORY_V3.md` defines #77 as `load; read/unread; open target; refresh`.
2. `NOTIFICATION_CENTER_V3.md` narrows navigation to allowlisted existing routes and requires signed-out fail-closed behavior, own-row normalization, read/unread state, mark-all-read, refresh, supported/unsupported target handling, 390px browser coverage, full accumulated regression execution and separate exact functional/bookkeeping gates.
3. Current #77 branch is 10 commits ahead of frozen v3.49 and modifies/adds Notification Center application/UI/API files. It also changes `src/core/api.js` and `src/app/bootstrap.js`, so ownership and boundary effects must be verified carefully even though no schema/RLS/grant/RPC/Edge change is claimed by the contract.
4. Permanent `tests/v3-notification-center-edge.mjs` and `scripts/validate-v3-notification-center.mjs` exist on the branch.
5. No `tests/v3-notification-center-smoke.mjs` exists in the current branch diff from frozen v3.49.
6. `.github/workflows/v3-regression.yml` at exact `99abc0a...` is still the frozen-v3.49 workflow: it invokes #76 Ministry Hub coverage but does not invoke either #77 validator or #77 edge test and contains no #77 browser/mobile smoke invocation.
7. No exact functional workflow run exists for SHA `99abc0a...`.

## PROVISIONAL ACCEPTANCE / NEGATIVE CASES

The exact candidate must prove at minimum:

- signed-out route fails closed without remote inbox access;
- authenticated own rows load newest-first with expiry/cross-user rejection;
- unread count/state are correct and own-row read/unread changes persist remotely;
- mark-all-read mutates only current-user rows and reports failure honestly;
- refresh reloads authoritative remote state rather than only repainting local state;
- supported action allowlist routes assignment -> assignments, ministry -> ministry-hub, recognition -> recognition, media -> media;
- unknown/blank/malformed/deferred action kinds never become arbitrary routes/URLs/HTML/commands;
- opening a supported target marks it read first, and failed read-state mutation must not falsely navigate as success;
- 390px real-route browser test covers load, unread state transition, refresh, safe target routing, unsupported target rejection and horizontal-overflow guard;
- existing #1–#76 accumulated validators, edge/security and browser/mobile regressions remain invoked and unchanged except for additive #77 coverage.

## FAILURES / MISSING EVIDENCE

**MISSING EVIDENCE — current exact SHA is NOT READY.**

- No #77 browser/mobile smoke test is present in the current branch diff.
- Current accumulated workflow does not invoke the new #77 validator or edge regression.
- No exact-SHA functional run exists for `99abc0a28916c671784e13ad1c3aa7ec80e782f0`.
- Therefore the current branch cannot satisfy the contract's executable browser/mobile and complete accumulated-suite requirements, regardless of source implementation quality.

These are milestone-completion gaps, not proof of an application defect. A4 has not executed or claimed runtime failure of the implementation itself.

## DISPOSITION

**NOT READY for exact `99abc0a28916c671784e13ad1c3aa7ec80e782f0`.**

Counterfactual: promoting this SHA now would freeze #77 without its required real-route 390px browser evidence, without executing its new validator/edge regression in the accumulated workflow, and without any complete exact-SHA functional gate. That would violate both the recovered #77 contract and accumulated-harness rules.

A future SHA may become reviewable once permanent #77 browser coverage exists, the accumulated workflow additively invokes all #77 tests while retaining all prior coverage, and a complete exact-SHA run succeeds. No PASS transfers from v3.49 or from this report to that future SHA.

## TRIAGE RECONCILIATION

TRIAGE was read only after primary evidence inspection. It is stale: it still says #76 has no canonical branch/candidate and no promotion recommendation, while live GitHub proves #76 is frozen at v3.49 and #77 is already active at `99abc0a...`. Its earlier bounded #76 findings are historical only and provide no authorization for #77.

## STALENESS CONDITIONS

This report becomes candidate-stale immediately if `feature/v3-notification-center` advances from `99abc0a28916c671784e13ad1c3aa7ec80e782f0`, if a dedicated #77 work branch appears, if #77 browser/workflow coverage is added or altered, if exact run evidence appears, or if the authoritative #77 contract/inventory changes.

A4 modified no product/workflow/canonical branch/inventory/release/handoff/lease/CURRENT/TRIAGE/main/production state.