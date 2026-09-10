# A4 QA / Regression — #93 Admin Operations

STATE/PROVENANCE
- Agent: `BQ-A4-QA`.
- Inspected: 2026-09-11 JST.
- Active canonical: `feature/v3-admin-operations` @ `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`.
- Required autonomous quarantine candidate `agent/a1-work/093-admin-operations`: NOT FOUND.
- Latest frozen base: `release/v3.63-admin-console` @ `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`.
- Earlier exact functional product SHA: `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`; complete accumulated functional run `34531751123` = SUCCESS for that SHA only.
- Earlier bookkeeping run `34532442314` = FAILURE after bookkeeping assertions because retained #92 validation pinned #93 to `Not started`.
- Current corrected bookkeeping SHA: `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`.
- Exact corrected bookkeeping verifier run `34532823188` = SUCCESS. Verifier commit `5917baf418dd6cc78619a39837e6bfe390bc3735` is a direct child of `56fe2469...`; its one-shot workflow explicitly checks out and asserts `56fe2469...` before bookkeeping validation and the complete accumulated suite.
- Stale immediately if canonical/candidate/frozen SHA changes; #93 service/backend/trust-boundary code changes; accumulated workflow/tests change; or newer exact run evidence supersedes this state.

PRIMARY EVIDENCE INSPECTED BEFORE TRIAGE
FACT:
- `FEATURE_INVENTORY_V3.md` at current canonical records 90 Regression-tested, 1 Verified, 0 Implemented, 9 Not started; #92 is Regression-tested, #93 is Verified, and #94 is Not started.
- Authoritative #93 verification contract is `operational actions; role guard; error recovery`.
- `DEVELOPMENT_HANDOFF_V3.md` records #93 ownership, functional candidate `2e93349e...`, run history, bookkeeping lifecycle correction, and #94 exclusion.
- Permanent `.github/workflows/v3-regression.yml` is `workflow_dispatch` only and invokes `scripts/validate-v3-admin-operations.mjs`, `tests/v3-admin-operations-edge.mjs`, and `tests/v3-admin-operations-smoke.mjs` in addition to all prior accumulated validators, edge/security tests, and browser/mobile tests.
- No unexplained removal, skip, narrowing, renamed-away coverage, timeout reduction, or bypass of prior accumulated suites was found in the current permanent workflow.
- `tests/v3-admin-operations-edge.mjs` meaningfully exercises client/service behavior: Owner/Admin projection, signed-out no-call behavior, authorization-before-dashboard sequencing, unauthorized/error states, client-error identifier stripping, Owner-only deletion delegation, self-delete refusal at service level, Admin delete refusal, and unconfirmed-delete handling.
- `tests/v3-admin-operations-smoke.mjs` meaningfully exercises rendered operational sections, poll aggregates, congregation filtering, identifier non-rendering, explicit refresh delegation, 390px no-overflow, 44px button target, guest standalone containment/no legacy Supabase runtime, and composed Owner account deletion from Admin Console with exact typed confirmation behavior.
- The current permanent #93 edge test injects a mocked API. It does NOT execute the real `supabase/functions/bq-admin-ops/index.ts` JWT -> platform-role -> privileged server/service-role boundary or destructive deletion guards.
- Exact corrected bookkeeping verifier commit `5917baf4...` added only an isolated one-shot workflow and has parent `56fe2469...`. That workflow explicitly checks out `56fe2469...`, asserts exact HEAD equality, validates bookkeeping state, then runs the accumulated architecture, edge/security and browser/mobile lists.
- Run `34532823188` completed SUCCESS. Job steps show exact-SHA assertion, bookkeeping validation, accumulated architecture, accumulated edge regressions, Playwright/Chromium setup, local server and accumulated browser/mobile regressions all completed successfully.

ACCEPTANCE MATRIX
- Operational dashboard render/data projection: PASS on executed exact current SHA via accumulated run `34532823188`.
- Role guard at client orchestration level: PASS.
- Signed-out no privileged request: PASS.
- Error/authorization recovery distinction: PASS.
- Owner-only delete UI/service orchestration: PASS.
- Admin denial at client/service layer: PASS.
- Privacy projection of privileged client-error identifiers: PASS.
- Congregation filtering: PASS.
- 390px mobile overflow/touch target: PASS.
- Legacy/duplicate Supabase runtime exclusion on standalone page: PASS.
- Permanent accumulated workflow retention/invocation: PASS.
- Real server authorization/destructive trust-boundary execution: MISSING EVIDENCE.
- Governance-required exact `agent/a1-work/093-*` candidate review: MISSING; branch absent.

PERMANENT REGRESSIONS / TEST QUALITY
FACT:
- New #93 validator, edge and browser/mobile tests are permanently wired into the accumulated workflow.
- Current executed one-shot verifier mirrors those accumulated lists and all three phases passed for exact product SHA `56fe2469...`.
- The browser test can realistically fail for missing sections, leakage, broken filtering/refresh, mobile overflow, undersized buttons, legacy runtime loading and broken delete composition.
- The service edge test can realistically fail for client-state/normalization/authorization sequencing defects.

MISSING EVIDENCE
1. No faithful permanent test executes the real `bq-admin-ops` trusted boundary for missing/invalid JWT, ordinary user, inactive platform role, active Admin vs Owner authority, forged client role data, self-delete, deletion of another active Owner, congregation/group ownership blockers, audit-before-delete behavior, and final Auth deletion ordering.
2. Required HIGH-RISK quarantine branch `agent/a1-work/093-*` is absent, so there is no governance-compliant exact functional candidate on which A4 can issue the mandatory pre-bookkeeping READY review.
3. Because #93 is HIGH-RISK, current exact bookkeeping green does not retroactively satisfy the required candidate-stage A4 READY barrier.

FAILURES
- No test failure exists in current exact run `34532823188`; all accumulated phases are green.
- Earlier run `34532442314` failed due to the retained #92 lifecycle assertion; the current corrected SHA has now cleared that exact bookkeeping failure through run `34532823188`.

QA DISPOSITION
**NOT READY for autonomous promotion/freeze despite exact current bookkeeping green.**

Reason:
- Exact current SHA `56fe2469...` now has complete accumulated green and correct permanent #93 invocation/retention.
- However #93 is HIGH-RISK and still lacks the required quarantine-candidate lifecycle plus faithful executable server/trust-boundary authorization evidence. A client mock is not equivalent to authorization proof.
- Therefore A4 cannot issue the mandatory exact-candidate READY decision for autonomous #93 promotion/freeze.

RECOMMENDATION
- Do not weaken or rerun the already-green accumulated suite merely to manufacture a different result.
- Establish/reconcile the required `agent/a1-work/093-*` candidate lineage under the control rules.
- Add faithful permanent trusted-boundary regression coverage without broadening product scope.
- Run the complete exact functional gate on the final candidate and obtain fresh same-SHA A3 satisfaction plus A4 READY before bookkeeping/promotion.
- After any bookkeeping changes, require a separate complete exact bookkeeping-SHA gate. Existing run `34532823188` is valid only for `56fe2469...`.

TRIAGE COMPARISON — READ AFTER PROVISIONAL QA FINDINGS
FACT:
- `automation/TRIAGE.md` is materially stale: it still identifies #92 Admin Console as active, says v3.63 is not frozen, and defers #93. Live primary evidence shows frozen `release/v3.63-admin-console` @ `8a759218...`, active #93 canonical @ `56fe2469...`, and successful exact corrected bookkeeping run `34532823188`.
- TRIAGE was not used as evidence for the QA findings above.

REPORT FRESHNESS
- Exact-SHA QA conclusions apply only to canonical `56fe2469f9c27e925b92afa9b07d7c12998bb7b7` and frozen base `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`.
- If canonical/candidate/frozen SHA, trusted backend, permanent #93 tests, or accumulated workflow changes, this report must be re-audited before it can block or authorize later lifecycle actions.
