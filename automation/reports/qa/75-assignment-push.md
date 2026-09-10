# QA / Regression Report — #75 Assignment Push Workflow

Agent: `BQ-A4-QA`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#75 Assignment Push Workflow — HIGH-RISK**.
- Canonical branch: `feature/v3-assignment-push`.
- Exact canonical HEAD: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Quarantine/bookkeeping branch: `agent/a1-work/075-assignment-push`.
- Exact bookkeeping candidate audited: `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Previous exact functional candidate: `a42100452d1b1fff7c146543e8ab5cd67da32193`; its PASS/reviews are baseline only and are not transferred to the bookkeeping SHA.
- Frozen base: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact bookkeeping workflow evidence: run `34450088492` — `success`.
- Verification trigger/run HEAD: `b1aac8df1b6e49715d1d0e0547c77af9987e7447` on isolated `verify/v3.48-assignment-push-bookkeeping-a1-20260910-1628-fix2`; the executed workflow explicitly checked out and asserted exact candidate `e725e5dee5a46fcaebf05200301efdb93f868b22` before test execution.
- Normal candidate workflow is restored to `workflow_dispatch` only.
- Staleness: this report becomes stale immediately if canonical, quarantine candidate, relevant #75 product/test/workflow files, the modified accumulated Assignments validator, or exact contradictory run evidence changes.

Primary evidence inspected independently before TRIAGE: autonomous control/guardrails/role/schedule/lease; live canonical/work/frozen refs; `ASSIGNMENT_PUSH_V3.md`; `FEATURE_INVENTORY_V3.md`; `DEVELOPMENT_HANDOFF_V3.md`; exact run `34450088492` and job steps; workflow file at exact run trigger SHA; current candidate and frozen accumulated workflows; frozen/current `scripts/validate-v3-assignments.mjs`; permanent trusted-boundary regression `tests/v3-assignment-publish-auth-edge.mjs`; functional→bookkeeping ancestry. TRIAGE was read only after provisional QA findings were formed.

## QA DISPOSITION

**READY — EXACT BOOKKEEPING CANDIDATE `e725e5dee5a46fcaebf05200301efdb93f868b22`.**

A4 finds no current application defect, test/fixture defect, CI/environment defect, unexplained accumulated-regression weakening, or material missing evidence that requires withholding HIGH-RISK bookkeeping promotion review for this exact SHA.

The modified pre-existing Assignments validator is a justified stale-future-state correction rather than regression weakening: all existing #73 owner/boundary assertions remain, #74 still accepts only valid lifecycle states, #75 now accepts only valid lifecycle states because #75 is the active milestone, and #79 remains explicitly required to stay `Not started`. The complete accumulated workflow then executed successfully against the exact bookkeeping SHA.

This A4 READY is SHA-bound and does not alone authorize canonical/release movement. A5 must independently reconcile this exact candidate and recommend or withhold promotion before A1 performs the final canonical/release transaction.

## FACTS

1. Live canonical remains `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`; candidate remains `e725e5dee5a46fcaebf05200301efdb93f868b22`; frozen v3.47 remains `2523f85d47f59721eae81da10cf1007d29af4139` at this audit.
2. Candidate bookkeeping represents #74 as `Regression-tested`, #75 as `Verified`, and #76–#79 as `Not started`; the represented totals are 74 Regression-tested, 1 Verified, 25 Not started.
3. Run `34450088492` completed successfully. Its regression job completed exact-bookkeeping-SHA assertion, accumulated architecture validators, accumulated edge regressions, Playwright/Chromium setup, local server startup, and accumulated browser/mobile regressions.
4. The run's GitHub trigger HEAD is not the bookkeeping candidate, but its executed isolated workflow explicitly used `actions/checkout@v4` with `ref: e725e5dee5a46fcaebf05200301efdb93f868b22` and immediately asserted `git rev-parse HEAD` equals that SHA.
5. The exact executed workflow invokes `scripts/validate-v3-assignment-push.mjs`, `tests/v3-assignment-push-edge.mjs`, `tests/v3-assignment-response-auth-edge.mjs`, `tests/v3-assignment-publish-auth-edge.mjs`, and `tests/v3-assignment-push-smoke.mjs` in addition to prior accumulated coverage.
6. Comparing frozen v3.47's accumulated workflow to the current #75 workflow shows the prior architecture, edge and browser/mobile lists retained, with #75 tests added. No prior invocation is visibly removed, skipped or renamed away and the 12-minute job / 240-second per-browser-test limits are retained.
7. Frozen `scripts/validate-v3-assignments.mjs` required #75 and #79 both to remain `Not started`, because both were future rows when #73 was frozen.
8. Candidate `scripts/validate-v3-assignments.mjs` changes only that future-state lifecycle section: #75 may be `Not started`, `Implemented`, `Verified`, or `Regression-tested`; #79 must still remain `Not started`. Existing #73 ownership/API/bootstrap/community/contract/workflow assertions remain unchanged, and #74 continues to require a valid lifecycle state.
9. This change is semantically necessary for an accumulated #73 validator to remain runnable after #75 legitimately enters its own lifecycle. Retaining the old #75 `Not started` assertion would make correct #75 bookkeeping impossible rather than protecting a #73 invariant.
10. The permanent trusted publish-authorization test still captures and executes the production `bq-assignment` request handler. It rejects ordinary publishers; accepts facilitator/leader/pastor/admin; scopes target discovery to active same-congregation entities; rejects foreign/inactive member/team/group targets before insertion; accepts valid active same-congregation targets; and rejects missing targeted IDs.
11. The exact executed edge phase includes that trusted-boundary test and the exact browser phase includes #75's 390px publish→receive→complete smoke.
12. No PASS from `a42100452d...` is used as the bookkeeping result; run `34450088492` is the exact evidence for `e725e5dee5...`.

## ACCEPTANCE MATRIX

| Requirement | Result on exact bookkeeping SHA | Evidence |
|---|---|---|
| Exact SHA pinned/asserted | PASS | run workflow + successful assertion step |
| Accumulated architecture validators | PASS | run `34450088492` |
| Modified #73 Assignments validator preserves original semantic owner/boundary assertions | PASS | frozen/current validator comparison |
| #75 lifecycle correction is bounded to stale future-state assertion | PASS | frozen/current validator comparison |
| #79 future linked-activity guard remains `Not started` | PASS | current validator |
| Accumulated edge/security regressions | PASS | run `34450088492` |
| Trusted publish authorization executes production handler | PASS | permanent test + accumulated edge invocation |
| Prior frozen architecture/edge/browser invocations retained | PASS | frozen/current workflow comparison |
| #75 architecture validator invoked | PASS | exact executed workflow |
| #75 service edge invoked | PASS | exact executed workflow |
| #75 recipient auth invoked | PASS | exact executed workflow |
| #75 publish auth invoked | PASS | exact executed workflow |
| #75 390px publish→receive→complete invoked | PASS | exact executed workflow |
| Playwright/Chromium/local server setup | PASS | run job steps |
| Accumulated browser/mobile regressions | PASS | run `34450088492` |
| Normal candidate workflow manual-only | PASS | current candidate workflow |
| Canonical/release promotion | NOT YET | requires fresh A5 decision and A1 final transaction |

## TEST-INTEGRITY AUDIT

- The exact run workflow was inspected at trigger SHA `b1aac8df...`, not inferred from the current cleaned verification branch.
- It pins/asserts `e725e5dee5...`, so the successful result is valid exact-SHA evidence despite the verification branch having a different trigger HEAD.
- Frozen v3.47 and current candidate accumulated workflows were inspected directly. #75 additions are additive; prior visible architecture, edge and browser/mobile invocations remain present.
- No unexplained workflow conditional, skipped phase, reduced timeout, removed prior test, or renamed-away prior invocation was found.
- The one modified prior validator was inspected directly against frozen source. The original semantic assertions about #73's owner/API/UI/bootstrap/community/contract/workflow remain untouched. Only the obsolete assumption that row #75 must forever remain pre-milestone was generalized to the repository's finite lifecycle states, while #79's future-state boundary remains strict.
- Counterfactual: if the validator correction had instead removed #73 ownership checks, allowed arbitrary #75 text, or also released #79's future-state guard, A4 would classify it as coverage weakening and mark NOT READY. None of those conditions is present.

## FAILURE / EVIDENCE CLASSIFICATION

- **APPLICATION DEFECT:** none established on exact candidate `e725e5dee5...`.
- **CURRENT TEST/FIXTURE DEFECT:** none established after the bounded validator correction; exact replacement candidate is green.
- **CI/ENVIRONMENT DEFECT:** none established in run `34450088492`.
- **MISSING REQUIRED QA EVIDENCE:** none material for A4's exact bookkeeping gate.
- **HISTORICAL FAILED EVIDENCE:** earlier bookkeeping candidates/runs that failed before this exact candidate do not count as PASS and are not transferred.
- **STALE TRIAGE:** TRIAGE still targets functional candidate `a42100452d...`, so its promotion recommendation is stale for current bookkeeping SHA `e725e5dee5...` and cannot authorize final promotion.

## FACT / INFERENCE / RECOMMENDATION

**FACT:** Exact candidate `e725e5dee5a46fcaebf05200301efdb93f868b22` has a successful complete accumulated run `34450088492` whose executed workflow explicitly checked out/asserted that SHA.

**FACT:** The existing Assignments validator change preserves its original #73 architecture/ownership assertions and #79 future-state guard; it changes only #75 from a fixed future-state assertion to a bounded valid lifecycle assertion now that #75 is active.

**FACT:** The exact executed workflow includes all visible frozen v3.47 accumulated invocations plus #75 validator/security/browser additions, and its phases all completed successfully.

**INFERENCE:** The validator correction is a genuine stale-test-state repair, not a means of making incorrect #75 product behavior pass. The old assertion's counterfactual behavior would reject every legitimate #75 bookkeeping state other than `Not started`, including the authoritative `Verified` state.

**RECOMMENDATION:** A5 should independently review exact bookkeeping candidate `e725e5dee5a46fcaebf05200301efdb93f868b22`, run `34450088492`, and the Assignments-validator semantic correction. If A5 finds no BLOCKER/MILESTONE and recommends promotion, A1 may recheck live refs/lease/workflow state and perform the final non-force canonical fast-forward and immutable v3.48 release creation at this unchanged exact SHA.

## TRIAGE RECONCILIATION

TRIAGE was read only after the provisional audit. It targets previous functional candidate `a42100452d...` and therefore is stale for the current bookkeeping candidate. Its requirement for a separate exact bookkeeping-SHA complete gate has now been satisfied by run `34450088492`, but its earlier functional-candidate promotion recommendation does not transfer across the SHA change. Fresh A5 reconciliation is required.

## FINAL QA RESULT

**READY — exact HIGH-RISK bookkeeping candidate `e725e5dee5a46fcaebf05200301efdb93f868b22` satisfies A4's QA/regression gate based on exact run `34450088492`.**

No product/workflow/canonical/work-branch/inventory/release/handoff/lease/CURRENT/TRIAGE/`main`/production state was modified by A4. Only this QA report was updated on the control branch.