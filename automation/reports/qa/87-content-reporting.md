# A4 QA — #87 Content Reporting

Agent: `BQ-A4-QA`
Generated: 2026-09-11 JST
Disposition: **NOT READY — exact current canonical failed accumulated verification; HIGH-RISK review incomplete**

## STATE / PROVENANCE

- Active milestone: **#87 Content Reporting**.
- Canonical milestone branch: `feature/v3-content-reporting`.
- Exact canonical HEAD inspected: `2d9341a87fa410ce25557c6675e239fa59b0213b`.
- Dedicated `agent/a1-work/087-*` candidate: **none found**.
- Latest frozen base: `release/v3.59-accessibility-support`.
- Frozen SHA: `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- Canonical is 15 commits ahead of the frozen base at inspection time.
- Exact one-shot verifier branch: `verify/v3.60-content-reporting-functional-2d9341a-20260911` at wrapper SHA `6245c352adcee21761a6957f93b71cd7f0fe215a`, whose parent is exact product SHA `2d9341a87fa410ce25557c6675e239fa59b0213b`.
- Exact accumulated verification run: `34510492091` — **FAILURE**.
- No PASS is transferred from frozen v3.59 or from any earlier #87 SHA.

## Primary evidence / FACT

1. The authoritative inventory still bounds #87 to `submit report; validation; success/error` and keeps #88 Content Moderation and #91 Content Review separate. At canonical `2d9341a...`, #87 is still recorded `Not started`; #86 remains `Verified`.
2. `CONTENT_REPORTING_V3.md` now records a recovered #87 contract: authenticated current congregation membership, bounded content/report fields, explicit success/error behavior, 390px mobile usability, reportable-surface privacy exclusions, and no #88 moderation scope.
3. The current implementation has permanent #87 coverage wired into `.github/workflows/v3-regression.yml`: `scripts/validate-v3-content-reporting.mjs`, `tests/v3-content-reporting-edge.mjs`, and `tests/v3-content-reporting-smoke.mjs`. The existing prior accumulated validator, edge/security, and browser/mobile lists remain present; I found no unexplained removal or skipping in the permanent workflow definition.
4. The #87 edge regression exercises owner validation, signed-out rejection, disappearing membership rejection, invalid reason/content rejection, repeated reports, exact payload preservation, backend error propagation, and explicit success ID handling. It mocks `api.submit` and therefore does **not** prove the real database authorization boundary.
5. The #87 browser/mobile smoke executes at 390x844 with touch enabled and covers launcher visibility, signed-out recovery UI, Reader/Transform exclusion, successful submission UI, visible failure plus retry, private form/note snapshot exclusion, and horizontal-overflow protection. Its reporting service is mocked for the submission portion and therefore does **not** prove database authorization.
6. The real shared API boundary performs `client.from('bible_content_reports').insert(row)` directly from the browser client.
7. The retained/current `20260905_content_review_and_reports.sql` grants authenticated users INSERT on `bible_content_reports`. Its INSERT RLS policy requires `reporter_id = auth.uid()` and congregation membership, but the row also contains `status`, `reviewed_by`, and `reviewed_at`; the INSERT policy shown in primary evidence does not constrain those moderation/reviewer fields at insert time.
8. Therefore the current permanent #87 tests do not contain a faithful negative database-boundary regression proving an ordinary member cannot forge initial moderation/reviewer fields. This is **MISSING SECURITY EVIDENCE** for a HIGH-RISK milestone, independent of whether the UI normally omits those fields.
9. Exact verifier run `34510492091` asserted the intended #87 product SHA successfully, then failed in `Run accumulated architecture validators`. All later edge/browser phases were skipped as a consequence. It is not a complete green and cannot authorize bookkeeping/promotion.
10. The latest canonical commit `2d9341a...` changes only `src/app/bootstrap.js` relative to parent `027213e7...`; the exact accumulated run against this new SHA still failed, so no earlier result can be carried forward.
11. No dedicated `agent/a1-work/087-*` branch was found. The current implementation lineage is on canonical rather than an auditable quarantine candidate branch, so there is no authorized exact candidate for the mandatory HIGH-RISK A4 READY review.

## QA acceptance matrix

- Submit report through intended #87 surface/path: **implemented evidence present; exact accumulated PASS missing**.
- Input validation: **covered by permanent edge regression**.
- Explicit success state requiring backend report ID: **covered by owner/browser tests**.
- Recoverable visible failure; no false success: **covered by owner/browser tests**.
- Current congregation membership loss fails closed: **covered by edge regression**.
- Signed-out behavior: **covered by edge + browser smoke**.
- 390px touch/mobile interaction and no horizontal overflow: **covered by browser smoke definition; not executed in the latest failed full run because browser phase was skipped**.
- Reader/Transform exclusion and privacy snapshot protections: **covered by browser smoke definition; not executed in latest failed full run**.
- #88 moderation separation: **contracted and structurally separate in inventory/contract; exact promotion evidence still missing**.
- Faithful server/database authorization negatives: **NOT SATISFIED**. Current tests mock the API and do not exercise malicious authenticated INSERT attempts against the database/RLS boundary.
- Exact full accumulated candidate green: **FAIL** (`34510492091`).
- Exact-candidate A4 HIGH-RISK review eligibility: **NOT SATISFIED** because there is no `agent/a1-work/087-*` candidate and the current exact canonical SHA is red.

## Permanent regression integrity

FACT: The permanent `v3-regression.yml` at `2d9341a...` explicitly invokes the new #87 validator, edge test, and browser smoke while retaining prior accumulated lists. No unexplained deletion, rename-away, narrowing, or timeout weakening was observed in the inspected workflow.

FACT: Presence in the workflow is not execution evidence. Run `34510492091` stopped at the architecture phase; edge and browser/mobile phases were skipped.

RECOMMENDATION: Do not weaken or remove any accumulated validator to obtain green. Reproduce the architecture failure and fix only the demonstrated root cause while preserving the intended semantic assertion.

## FAILURES

1. **Exact accumulated run failure:** `34510492091` failed during accumulated architecture validators after successfully asserting product SHA `2d9341a...`; edge/security and browser/mobile phases did not run.
2. **HIGH-RISK authorization evidence gap:** the real direct INSERT/RLS path is not covered by a faithful negative regression for forged moderation/reviewer fields (`status`, `reviewed_by`, `reviewed_at`). Client mocks are insufficient proof of server authorization.
3. **Quarantine/provenance gap:** no `agent/a1-work/087-*` exact candidate exists for the required HIGH-RISK post-functional-green A4 review.

## MISSING EVIDENCE

- Exact root-cause output identifying which accumulated architecture validator failed in run `34510492091` was not available through the inspected job metadata; the phase failure itself is definitive, but the specific assertion still needs reproduction/log evidence.
- A corrected exact #87 candidate on the authorized work branch.
- A faithful backend/RLS regression demonstrating that a normal authenticated member cannot forge review/moderation authority on initial report insertion, plus reporter/cross-congregation negatives as applicable to the chosen trusted boundary.
- A complete exact-SHA accumulated green that actually executes architecture, edge/security, Playwright/mobile, and all prior accumulated coverage.
- Fresh A3 trust-boundary satisfaction and A5 promotion recommendation for that same exact HIGH-RISK candidate SHA before bookkeeping/promotion.
- Separate complete exact bookkeeping-SHA green after any bookkeeping transaction.

## TRIAGE comparison — read after independent findings

`automation/TRIAGE.md` was read only after the primary-evidence QA findings above were formed. It is SHA-stale: TRIAGE still describes canonical/frozen `5594f980...` with no implementation candidate, while live canonical has advanced to `2d9341a...` and now has an exact failed accumulated verifier. Its pre-implementation `0 BLOCKER` state cannot be used to authorize the current lineage.

## Recommendation

**NOT READY. Do not promote or freeze #87.** First reproduce the architecture-validator failure on exact `2d9341a...` or its reconciled quarantine descendant, preserve all accumulated coverage, close the real database authorization negative-test gap, and obtain a complete exact-SHA functional green. Because #87 is HIGH-RISK, A4 should review that exact green `agent/a1-work/087-*` candidate before bookkeeping; no PASS may transfer if the SHA changes.

## FACT vs INFERENCE / RECOMMENDATION

FACT: exact canonical/frozen SHAs, branch absence, permanent test/workflow contents, direct API INSERT, migration RLS/grants, run `34510492091` phase results, and current inventory/contract state are directly inspected repository/Actions evidence.

INFERENCE: the unconstrained insert-time moderation columns constitute a security acceptance risk because the inspected RLS checks reporter/membership but not those authority fields; this should be confirmed by an executable faithful database-boundary negative test rather than treated as proven exploit behavior from source inspection alone.

RECOMMENDATION: enforce and test a backend-authoritative submission boundary without broadening #88/#91 scope, and do not weaken accumulated regressions to get green.

## Staleness conditions

This report becomes stale if any of the following changes: `feature/v3-content-reporting` HEAD; creation/movement of `agent/a1-work/087-*`; latest frozen release/SHA; #87 inventory/contract; `CONTENT_REPORTING_V3.md`; reporting owner/UI/API/schema/RLS/grants/trusted path; any #87 or prior accumulated validator/test/workflow invocation; exact run evidence; or current A3/A5 review state.