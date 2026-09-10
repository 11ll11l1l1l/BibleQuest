# A5 firewall triage — #79 Linked Activities high-risk reconciliation

Agent: `BQ-A5-FIREWALL`
Date: 2026-09-10 JST

## Exact live state
- Canonical: `feature/v3-linked-activities` @ `270d58a5e34b69b99af87abade3c53099348168e`.
- Dedicated work candidate: `agent/a1-work/079-linked-activities` not found.
- Frozen base: `release/v3.51-workspace` @ `caf9425fcdfef935560e1d65ff13823c60a7f529`.
- `release/v3.52-linked-activities`: not found.
- Functional product candidate: `debc386328d4655977681fcb08b7a345346ea3fc`.
- Functional exact run: `34468348888` completed success; its isolated workflow explicitly checked out/asserted `debc3863...` and invoked accumulated architecture, edge/security and browser/mobile suites including #79 coverage.
- Bookkeeping candidate: `270d58a5e34b69b99af87abade3c53099348168e`.
- Bookkeeping exact run: `34468933900` failed in accumulated architecture validators after exact checkout/assertion; later phases were skipped.

## Primary evidence / facts
- `DEVELOPMENT_STATUS_V3.md` at `270d58a5...` records #79 Verified by functional run `34468348888`, #78 promoted to Regression-tested, and provisional parity 79/100 / stability 78/100 pending bookkeeping green.
- `scripts/validate-v3-assignments.mjs` at `270d58a5...` still contains a hard assertion that inventory #79 must remain `Not started` until its milestone begins.
- Current bookkeeping advances #79 out of `Not started`, so the accumulated validator and current lifecycle state conflict.
- `scripts/validate-v3-linked-activities.mjs` accepts any valid #79 lifecycle state and preserves fixed-route, existing Assignments ownership and workflow-invocation assertions.
- The #79 lineage modifies shared `src/app/router.js` to add central navigation-request ownership.
- The #79 lineage also changes the pre-existing accumulated `tests/v3-assignments-smoke.mjs` fixture after historical browser failure `34467523354`.
- Control rules classify global router/shell ownership as HIGH-RISK. They separately state that any modification to an existing accumulated validator/test is automatically HIGH-RISK and requires documented root cause plus exact-candidate A4/A5 review before promotion.
- No dedicated `agent/a1-work/079-linked-activities` branch exists despite the quarantine invariant.
- Writer lease was FREE during this A5 inspection; A5 did not modify it.

## Source-report freshness
- A2 #79 contract report: missing.
- A3 #79 report analyzed `b446ea26c190905efa6af2f45727f920eb643cb9`; stale after canonical movement and before final functional/bookkeeping evidence.
- A4 #79 report analyzed `debc386328d4655977681fcb08b7a345346ea3fc` before exact run `34468348888` completed; its NOT READY premise about missing exact execution is stale, but no later exact-candidate A4 READY review exists.
- Prior TRIAGE described #77 and was stale before this reconciliation.

## Classification

### BLOCKER
1. Current bookkeeping SHA `270d58a5...` is not promotable because exact run `34468933900` failed before edge/browser execution. Counterfactual: freezing it would violate the exact bookkeeping-SHA complete-green release gate.
2. #79 must be treated HIGH-RISK. Counterfactual: NORMAL-RISK treatment would bypass mandatory independent review for a global Router-owner change and a pre-existing accumulated-test modification.
3. Autonomous promotion path must reconcile the absence of the mandated `agent/a1-work/079-linked-activities` quarantine branch. Counterfactual: continuing unverified product/test/bookkeeping writes directly on canonical defeats the quarantine invariant.

### MILESTONE
1. Preserve `launch linked activity; completion handoff` without broadening assignment authority or destination completion rights.
2. Resolve the stale #73 validator lifecycle assertion only as a documented validator defect while keeping all original #73 ownership/security semantics. Because the accumulated validator itself must change, the corrected exact state remains HIGH-RISK.

### DEFER
#80 Personality Profile, #81 Psychometrics, #43 Live Rooms, #15 Japanese furigana and Kids #38–40.

### IGNORE
- Stale NORMAL-RISK characterization from earlier SHA-bound reports.
- A4's earlier missing-exact-run premise after run `34468348888` completed; it does not become READY automatically.
- Lack of a direct `head_sha` Actions run for the product commit where isolated verification explicitly pins/asserts the product SHA.

## Promotion readiness
**NO PROMOTION RECOMMENDATION.**

The exact functional product SHA has green execution evidence, but the current bookkeeping SHA is red and the now-proven HIGH-RISK barrier is unsatisfied. Fresh A3 trust-boundary review and A4 READY review must attach to the exact corrected candidate after the stale validator issue is fixed and the full accumulated suite passes. A5 must then reassess that same SHA before bookkeeping/promotion.

## Staleness
This report becomes stale immediately if canonical/work/frozen refs move, a `agent/a1-work/079-...` branch appears, the stale validator is corrected, a new exact run completes, A3/A4 refresh against the new exact candidate, or `release/v3.52-linked-activities` appears.
