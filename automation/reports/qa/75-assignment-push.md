# QA / Regression Report — #75 Assignment Push Workflow

Agent: `BQ-A4-QA`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#75 Assignment Push Workflow — HIGH-RISK**.
- Canonical branch: `feature/v3-assignment-push`.
- Exact canonical HEAD: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Quarantine branch: `agent/a1-work/075-assignment-push`.
- Exact functional candidate audited: `a42100452d1b1fff7c146543e8ab5cd67da32193`.
- Frozen base: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact functional workflow evidence: run `34444825916` — `success`.
- Verification trigger/run HEAD: `cb2fa98653dda709f850636b247d25dcf050ba18` on isolated `verify/v3.48-assignment-push-functional-a1-20260910-1520-fixture2`; the executed workflow explicitly checked out and asserted exact candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` before executing tests.
- Historical failed run: `34444649968` against precursor `fc09fa02ea86522b1bdc7ea03f0964f4fd56f2a4`; failure occurred in the newly added trusted-boundary test fixture before application assertions because a TypeScript annotation remained in the VM-transpiled copy. No PASS is transferred from that SHA/run.
- Final re-read confirmed the quarantine branch still points to exact candidate `a42100452d1b1fff7c146543e8ab5cd67da32193`.
- Staleness condition: this report is stale immediately if the quarantine candidate moves, if relevant #75 test/workflow/security files change, or if later exact evidence contradicts this audit. This functional READY does not transfer to any bookkeeping SHA.

Primary evidence inspected independently before TRIAGE: autonomous control/guardrails; exact canonical/work/frozen refs; `FEATURE_INVENTORY_V3.md`; `ASSIGNMENT_PUSH_V3.md`; `DEVELOPMENT_HANDOFF_V3.md`; frozen→candidate ancestry/compare; frozen and candidate `.github/workflows/v3-regression.yml`; exact verification workflow at `cb2fa986...`; run `34444825916` and job-step results; `scripts/validate-v3-assignment-push.mjs`; `tests/v3-assignment-push-edge.mjs`; `tests/v3-assignment-publish-auth-edge.mjs`; `tests/v3-assignment-push-smoke.mjs`. TRIAGE was read only after provisional QA findings were formed.

## QA DISPOSITION

**READY FOR HIGH-RISK FUNCTIONAL-CANDIDATE PROMOTION REVIEW.**

The exact candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` has a valid exact-SHA accumulated green run, the prior trusted publish-authorization proof gap is now closed by a permanent faithful executable boundary regression, and no unexplained weakening/removal/bypass of the frozen accumulated regression harness was found.

A4 found no current application defect, fixture defect, CI/environment defect, or missing functional evidence that requires withholding READY on this exact SHA. This does **not** authorize canonical/release promotion by itself: #75 remains HIGH-RISK, so A5 must independently issue the promotion recommendation for this unchanged candidate before A1 may prepare bookkeeping. The later bookkeeping SHA must then pass its own complete exact-SHA accumulated gate.

## FACTS

1. Canonical remains `606fa7ad...`; candidate remains `a4210045...`; frozen base remains `2523f85d...` at final re-read.
2. Candidate is descended from frozen v3.47; no PASS is being borrowed from a different product SHA.
3. Run `34444825916` completed `success`. Its single regression job completed the exact-candidate assertion, accumulated architecture validators, accumulated edge regressions, Playwright installation, Chromium installation, local server startup, and accumulated browser/mobile regressions successfully.
4. The run's trigger HEAD is not the product candidate, but the executed isolated workflow explicitly pins checkout to `a42100452d1b1fff7c146543e8ab5cd67da32193` and asserts `git rev-parse HEAD` equals that exact SHA before the test phases.
5. The live candidate workflow is restored to normal `workflow_dispatch`-only behavior. The temporary `push:` trigger existed only on the isolated verification branch.
6. Compared with frozen v3.47, the accumulated workflow retains the prior architecture, edge, and browser/mobile lists and adds #75 coverage. No prior invocation was found removed, skipped, narrowed, or renamed away.
7. The exact executed workflow invokes `scripts/validate-v3-assignment-push.mjs`, `tests/v3-assignment-push-edge.mjs`, `tests/v3-assignment-response-auth-edge.mjs`, `tests/v3-assignment-publish-auth-edge.mjs`, and `tests/v3-assignment-push-smoke.mjs` while retaining accumulated prior coverage.
8. `tests/v3-assignment-publish-auth-edge.mjs` captures and executes the production `bq-assignment` request handler in a controlled VM. It proves ordinary members are denied trusted `targets` and `create`, all four retained ministry roles are allowed, target discovery is active/same-congregation scoped, foreign/inactive member/team/group targets fail before insertion, valid active same-congregation targets succeed, and missing non-all targets fail closed.
9. The trusted-boundary regression is materially capable of failing for the security behavior it claims; it is not merely a source-string check or browser/client mock.
10. `tests/v3-assignment-push-edge.mjs` covers the application/service contract: all/member/team/group normalization, advanced metadata carry-through, linked-activity exclusion, server-truth reload, signed-out/local-preview/no-congregation and non-ministry local denial, stale target-directory races, and post-create refresh-failure semantics.
11. `tests/v3-assignment-push-smoke.mjs` executes at 390px with touch/mobile settings and covers ministry publisher visibility, target-directory loading, member targeting, advanced metadata, ordinary-member publisher absence, published assignment receipt, existing start/complete flow, horizontal-overflow protection, and console/page-error absence.
12. The authoritative inventory remains intentionally unpromoted at #75 `Not started`; that bookkeeping state is expected before the separate promotion/bookkeeping transaction and is not a functional-candidate failure.

## ACCEPTANCE MATRIX

| Requirement | Exact candidate result | Primary evidence |
|---|---|---|
| Existing assignment owner / central API boundary retained | PASS | #75 validator executed in exact run |
| Ministry-only publish surface | PASS | service/browser coverage |
| Trusted server ministry authorization for `targets/create` | PASS | production handler executed by `v3-assignment-publish-auth-edge.mjs` |
| Four scopes `all/member/team/group` normalize correctly | PASS | service edge + trusted-boundary regression |
| Foreign/inactive member/team/group fail closed before insert | PASS | production handler executed by trusted-boundary regression |
| Missing non-all target fails closed | PASS | trusted-boundary regression |
| Advanced #74 metadata carried through publish | PASS | service edge + browser smoke |
| Linked activity excluded from #75 | PASS | validator/service regression |
| Successful publish reloads server truth | PASS | service edge regression |
| Stale congregation target-load result rejected | PASS | service edge regression |
| Post-create refresh failure distinguishes created vs refresh failure | PASS | service edge regression |
| Ordinary member/signed-out/local-preview/no-congregation cannot locally publish | PASS | service edge/browser coverage |
| Recipient authorization remains bounded | PASS | retained `v3-assignment-response-auth-edge.mjs`, executed in accumulated edge phase |
| Member publish→receive→start→complete at 390px | PASS | `v3-assignment-push-smoke.mjs` |
| 390px no horizontal overflow / console or page errors | PASS | browser smoke |
| Accumulated architecture/edge/browser harness | PASS for functional SHA | exact workflow + successful job steps |
| Exact bookkeeping-SHA complete gate | NOT YET APPLICABLE | required after A5 promotion recommendation and bookkeeping creation |

## TEST-INTEGRITY AUDIT

- Frozen v3.47 and candidate workflows were directly inspected. Existing accumulated architecture validators, edge regressions, and browser/mobile regressions remain present; #75 coverage is additive.
- The candidate workflow remains `workflow_dispatch` only. The exact verification run used an isolated temporary `push:` workflow that pinned/asserted the product candidate.
- No unexplained timeout reduction, skipped phase, conditional bypass, expected-behavior relaxation, or removed prior test invocation was found.
- The new trusted publish-authorization regression is meaningful executable evidence at the production handler boundary. Regressions that make ordinary members eligible publishers, broaden congregation target scope, permit inactive/foreign targets, or allow missing targeted IDs to reach insertion would fail the permanent test.
- Historical run `34444649968` does not count as green. Its precursor candidate's new VM fixture failed before behavioral assertions; the fixture-only correction changed the candidate SHA, and A4 relies only on replacement exact run `34444825916` for functional PASS.

## FAILURE / EVIDENCE CLASSIFICATION

- **APPLICATION DEFECT:** none established on exact candidate `a4210045...`.
- **CURRENT FIXTURE DEFECT:** none established. Historical precursor `fc09fa02...` fixture failure was corrected before the audited candidate; PASS was not transferred.
- **CI/ENVIRONMENT DEFECT:** none established in run `34444825916`.
- **MISSING FUNCTIONAL EVIDENCE:** none material to #75 functional READY after the new trusted-boundary regression.
- **STALE EVIDENCE:** all candidate-specific A2/A3/A4/A5 reports or TRIAGE entries targeting `78fa191f...` are stale for `a4210045...`; they cannot authorize or block this exact candidate without refresh. Prior frozen-release evidence remains baseline only.

## FACT / INFERENCE / RECOMMENDATION

**FACT:** Exact candidate `a4210045...` is unchanged at final re-read; run `34444825916` explicitly executed that SHA and completed the full accumulated phases successfully; the permanent workflow includes the new trusted-boundary test and preserves frozen prior coverage.

**FACT:** The previously missing trusted `targets/create` proof now exists as executable production-handler coverage and passed inside the exact accumulated edge phase.

**INFERENCE:** Given the inspected contract, test semantics, harness integrity and exact run evidence, no remaining functional QA gap is established that would reasonably allow a #75 acceptance/security regression to pass unnoticed within the required current scope.

**RECOMMENDATION:** A5 may now perform its independent firewall review of exact candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` and run `34444825916`. If A5 finds no current BLOCKER/MILESTONE and recommends promotion, A1 may prepare #75 bookkeeping off-canonical. Do not change the candidate before that review; any SHA movement makes this READY stale.

## TRIAGE RECONCILIATION

TRIAGE currently targets older candidate `78fa191f...` and correctly requested the faithful trusted-boundary coverage that was missing at that time. It is now stale for current candidate `a4210045...`. The requested evidence exists in `tests/v3-assignment-publish-auth-edge.mjs` and was executed successfully in exact run `34444825916`; therefore the old TRIAGE MILESTONE cannot be carried forward as an unresolved current-candidate gap without new contrary primary evidence.

The bookkeeping-gate requirement remains valid but is a later transaction, not a reason to mark the functional candidate NOT READY.

## FINAL QA RESULT

**READY — exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193` satisfies A4's HIGH-RISK functional-candidate QA gate based on current primary evidence and exact run `34444825916`.**

Keep this SHA unchanged for A5 promotion review. No product/workflow/canonical/inventory/release/handoff/lease/CURRENT/TRIAGE/`main`/production state was modified by A4.