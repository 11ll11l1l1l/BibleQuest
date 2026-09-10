# QA / Regression Report — #75 Assignment Push Workflow

Agent: `BQ-A4-QA`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#75 Assignment Push Workflow — HIGH-RISK**.
- Canonical branch: `feature/v3-assignment-push`.
- Exact canonical HEAD: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Quarantine branch: `agent/a1-work/075-assignment-push`.
- Exact functional candidate audited: `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`.
- Frozen base: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact functional workflow evidence: run `34438690160` — `success`.
- Verification trigger commit/run HEAD: `bd3455e1252b77d5a5527e83c52b9e6ccb286be3` on isolated `verify/v3.48-assignment-push-functional-a1-20260910-1349`; its workflow explicitly checked out and asserted exact candidate `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4` before executing tests.
- Staleness condition: every candidate-specific conclusion in this report is stale immediately if `agent/a1-work/075-assignment-push` moves from `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4`, if the relevant workflow/test files change, or if later exact evidence contradicts this audit.

Primary evidence inspected independently before TRIAGE: control/guardrail documents; exact canonical/work/frozen refs; `FEATURE_INVENTORY_V3.md`; `ASSIGNMENT_PUSH_V3.md`; `DEVELOPMENT_HANDOFF_V3.md`; frozen→candidate compare; candidate `.github/workflows/v3-regression.yml`; exact verification workflow at `bd3455e...`; run `34438690160` and job/step results; `supabase/functions/bq-assignment/index.ts`; `tests/v3-assignment-push-edge.mjs`; `tests/v3-assignment-response-auth-edge.mjs`; `tests/v3-assignment-push-smoke.mjs`; frozen and candidate `tests/v3-assignments-smoke.mjs`. TRIAGE was read only after provisional QA findings.

## QA DISPOSITION

**NOT READY FOR HIGH-RISK PROMOTION — functional candidate is exact-green, prior authorization defect is corrected, but one required trusted-boundary evidence gap remains.**

There is no current source-demonstrated #75 application defect in the inspected paths. Run `34438690160` is valid exact-candidate functional evidence: its isolated workflow pinned checkout to `78fa191f...`, asserted that SHA, and all accumulated architecture, edge and browser/mobile phases completed successfully. The previously identified ministry-response authorization defect is corrected and has a faithful executable regression that evaluates the production recipient helper.

However, #75's HIGH-RISK surface also includes **server-side publish target authorization/scope**. The permanent #75 edge test currently proves foreign/inactive member/team/group rejection only by source-string inspection of the trusted Edge Function; its actual publish calls use a mocked client API and therefore cannot fail if the trusted server's target validation behaves incorrectly at runtime. Guardrails explicitly require faithful server/trusted-boundary evidence for security/scope behavior when stronger evidence is feasible. A4 therefore withholds READY until a faithful executable trusted-boundary regression exercises `targets`/`create` authorization and target-scope rejection using the production trusted-function logic or an equivalently faithful extracted boundary.

## FACTS

1. Candidate `78fa191f...` remains unchanged at final re-read; canonical remains `606fa7ad...`; frozen base remains `2523f85d...`.
2. Candidate descends from frozen v3.47 and is 22 commits ahead with no behind commits. The candidate changes the existing assignment owner/API/presentation and trusted assignment function, adds #75 validator/edge/browser tests, and modifies the accumulated workflow plus the existing Assignments smoke.
3. Exact run `34438690160` completed successfully. Job steps for exact candidate assertion, accumulated architecture validators, accumulated edge regressions, Playwright/Chromium setup, local server, and accumulated browser/mobile regressions all completed `success`.
4. The exact verification workflow pinned checkout to `78fa191f1bc8505b020d8548abd0bb48bbf6a8e4` and asserted that SHA before test execution. The run HEAD being the isolated trigger commit therefore does not transfer execution to a different product SHA.
5. Candidate workflow retains normal `workflow_dispatch` only. The temporary `push:` trigger exists only in the isolated verification commit used for run `34438690160`.
6. Candidate accumulated workflow adds `validate-v3-assignment-push.mjs`, `v3-assignment-push-edge.mjs`, `v3-assignment-response-auth-edge.mjs`, and `v3-assignment-push-smoke.mjs` while retaining the prior architecture, edge, and browser/mobile lists inspected from frozen v3.47.
7. The existing `v3-assignments-smoke.mjs` semantic assertion was not weakened: frozen v3.47 required ministry recipient controls to remain read-only; candidate still requires no Start/Complete and additionally requires the #75 publisher for ministry users.
8. The trusted function now uses `assignmentRecipient()` for `start`/`complete`. That helper checks `all`, exact member target, team membership, or active group membership. Ministry role alone no longer authorizes recipient mutation.
9. `v3-assignment-response-auth-edge.mjs` faithfully executes the production `assignmentRecipient()` helper against positive/negative all/member/team/group fixtures and explicitly denies a non-recipient ministry identity. This is materially stronger than a source-string-only check for the prior defect.
10. `v3-assignment-push-smoke.mjs` executes at 390px and covers ministry publisher visibility, selected member targeting, advanced metadata carry-through, ordinary-member publisher absence, receive→start→complete flow, no horizontal overflow, and no page/console errors.
11. `v3-assignment-push-edge.mjs` covers service-level all/member/team/group normalization, invalid/missing client targets, unauthorized local roles, signed-out/local-preview/no-congregation states, stale congregation target results, post-create refresh failure semantics, linked-activity exclusion, and server-truth reload behavior.
12. `v3-assignment-push-edge.mjs` does **not** execute the production trusted `targets` or `create` action for ministry-role authorization or foreign/inactive target rejection. Those server assertions are currently static `source.includes(...)` checks.

## ACCEPTANCE MATRIX

| Requirement | Exact candidate result | Evidence |
|---|---|---|
| Sole existing assignment owner / central API boundary | PASS | candidate source + validator executed green |
| Ministry-only publish surface | PASS | service edge + 390px browser smoke executed green |
| Ordinary member/signed-out/local-preview/no-congregation local publish denial | PASS | edge regression executed green |
| Four scopes `all/member/team/group` normalize correctly | PASS | edge regression executed green |
| Advanced #74 metadata carried through publish | PASS | edge + browser regression executed green |
| Linked activity excluded from #75 browser publish | PASS | edge regression executed green |
| Successful publish reloads server truth | PASS | edge regression executed green |
| Stale target-load congregation race fails closed | PASS | edge regression executed green |
| Post-create refresh failure distinguishes created-vs-refresh-failed | PASS | edge regression executed green |
| Member receive→start→complete at 390px | PASS | browser regression executed green |
| Ministry recipient UI remains read-only | PASS | modified prior Assignments smoke executed green |
| Server recipient mutation eligibility | PASS | production helper executed by `v3-assignment-response-auth-edge.mjs`; run green |
| Server `targets` ministry authorization | **MISSING EXECUTABLE EVIDENCE** | production source inspected; only static assertion in current regression |
| Server `create` ministry authorization | **MISSING EXECUTABLE EVIDENCE** | production source inspected; browser/service test uses mock API |
| Server foreign/inactive member/team/group rejection | **MISSING EXECUTABLE EVIDENCE** | production source inspected; current test uses source-string checks rather than executing trusted action |
| 390px overflow and page/console errors | PASS | browser regression executed green |
| Accumulated #1–#75 architecture/edge/browser harness | PASS for functional SHA | exact workflow/run execution verified |
| Exact bookkeeping-SHA gate | NOT APPLICABLE YET | must occur only after HIGH-RISK review authorization |

## TEST-INTEGRITY AUDIT

- **No unexplained accumulated regression removal/bypass found.** Frozen v3.47 and candidate workflows were compared directly. Prior validators/tests remain invoked; #75 coverage is additive.
- Candidate `.github/workflows/v3-regression.yml` remains `workflow_dispatch`-only. The isolated verification workflow added only the required temporary branch `push:` trigger plus exact SHA checkout/assertion.
- Existing `tests/v3-assignments-smoke.mjs` changed because the old assertion expected ministry read-only text with no publisher; #75 legitimately adds publisher capability while preserving no Start/Complete. The semantic safety assertion is stricter, not weaker.
- The earlier failing run `34438622148` is correctly classified as a TEST/FIXTURE defect because the new recipient-auth fixture itself failed to execute; PASS was not inferred from it. Candidate `78fa191f...` contains the fixture-only execution correction and replacement run `34438690160` is green.
- The new recipient authorization regression is meaningful: changing `assignmentRecipient()` back to ministry-wide response visibility or making non-recipient member/team/group cases true would fail it.
- The current target-directory/create security checks are not equivalently strong. A source-string test can remain green while query semantics, mock behavior, or the trusted action's executable authorization result is wrong.

## FAILURE CLASSIFICATION

- **APPLICATION DEFECT:** none newly established on exact candidate `78fa191f...`.
- **FIXTURE DEFECT:** historical run `34438622148`; corrected before `78fa191f...`; not a current blocker by itself.
- **CI/ENVIRONMENT DEFECT:** none established in run `34438690160`.
- **MISSING EVIDENCE:** faithful executable trusted-boundary coverage for `targets`/`create` ministry authorization and foreign/inactive member/team/group rejection.
- **STALE EVIDENCE:** all prior A4 dispositions on `d13ba6b...` are stale for promotion of `78fa191f...`; the old authorization defect itself was independently rechecked and is corrected in current source.

## EXACT EVIDENCE REQUIRED TO BECOME READY

A new candidate SHA is required if test code is added. Before A4 can mark that new exact SHA READY:

1. Add a permanent faithful trusted-boundary regression that executes production `bq-assignment` target/create authorization logic (or an extracted production helper used by that function) rather than only source-string checks.
2. Prove at minimum: ordinary `member` cannot call `targets` or `create`; facilitator/leader/pastor/admin can; `member` target must be an active same-congregation membership; `team` target must exist, be active, and belong to the same congregation; `group` target must exist, be active, and belong to the same congregation; missing/foreign/inactive targets fail closed before insert.
3. Retain the current recipient-response authorization regression and all current #75 service/browser coverage.
4. Execute the complete accumulated workflow against the resulting exact candidate SHA, with explicit checkout/assertion of that exact SHA and no skipped/cancelled/timed-out phases.
5. Re-audit accumulated harness integrity because any SHA movement makes this candidate-specific review stale.

If that exact candidate is fully green and no new primary-evidence defect appears, A4 can issue READY for HIGH-RISK promotion review. A5 must then independently recommend promotion. Bookkeeping remains a separate SHA and requires its own complete accumulated exact-SHA gate.

## TRIAGE RECONCILIATION

TRIAGE correctly identifies canonical `606fa7ad...`, candidate `78fa191f...`, frozen `2523f85d...`, and exact functional run `34438690160`. Its statement that the prior A4 report was stale was accurate when written. This refreshed A4 report now covers exact candidate `78fa191f...`.

A4 does **not** adopt TRIAGE's implied expectation that a fresh review will necessarily become READY. Independent primary-evidence review found the trusted target/create authorization evidence gap above. This is not a manufactured new product requirement: it follows the existing #75 contract's server-side audience validation requirement and the control-plane rule that HIGH-RISK security/scope claims require executable or faithful trusted-boundary evidence when feasible.

## FINAL QA RESULT

**NOT READY — exact functional run is green and the prior recipient-authorization defect is fixed, but trusted publish-target authorization/scope remains insufficiently proven at the executable server boundary.**

Do not promote or begin bookkeeping from `78fa191f...`. The next safe product-writing action for A1 is a narrowly scoped permanent trusted-boundary test addition on the quarantine branch, followed by a new exact accumulated functional run and fresh A4/A5 review. No implementation change is justified unless that faithful regression reproduces an application defect.