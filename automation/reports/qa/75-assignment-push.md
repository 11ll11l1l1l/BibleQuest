# QA / Regression Report — #75 Assignment Push Workflow

Agent: `BQ-A4-QA`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Canonical milestone branch: `feature/v3-assignment-push`
- Exact canonical HEAD: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`
- Quarantine work branch: `agent/a1-work/075-assignment-push`
- Exact candidate HEAD audited: `d13ba6b9729a02021ee5efab961c6c233a0b669e`
- Frozen base: `release/v3.47-advanced-assignments`
- Exact frozen SHA: `2523f85d47f59721eae81da10cf1007d29af4139`
- Retained prior exact green bookkeeping evidence: workflow run `34433120915` for frozen v3.47 only.
- Exact #75 candidate workflow evidence: **NONE**. GitHub Actions query for `agent/a1-work/075-assignment-push` returned zero workflow runs at this audit.
- Staleness condition: all candidate-specific findings below become stale immediately if `agent/a1-work/075-assignment-push` moves from `d13ba6b9729a02021ee5efab961c6c233a0b669e`.

Primary evidence inspected independently before TRIAGE: control/guardrail documents, exact branch refs, frozen ref, `ASSIGNMENT_PUSH_V3.md`, live `DEVELOPMENT_HANDOFF_V3.md`, candidate diff/commit history, `.github/workflows/v3-regression.yml`, `tests/v3-assignment-push-edge.mjs`, `tests/v3-assignment-push-smoke.mjs`, existing `tests/v3-assignments-smoke.mjs` change, and `supabase/functions/bq-assignment/index.ts`.

## QA DISPOSITION

**NOT READY FOR HIGH-RISK PROMOTION.**

This candidate is materially implemented and has permanent #75 validator/edge/browser coverage wired into the accumulated workflow, but there is no exact-candidate executed functional run. In addition, primary trusted-function inspection exposes one authorization defect that must be corrected and regression-proven before A4 can mark the exact candidate READY.

## FACTS

1. **#75 implementation now exists in quarantine.** Candidate `d13ba6b...` is ahead of canonical `606fa7a...`; canonical itself remains contract/status-only.
2. **Accumulated workflow wiring exists.** `.github/workflows/v3-regression.yml` remains `workflow_dispatch`-only and now invokes `scripts/validate-v3-assignment-push.mjs`, `tests/v3-assignment-push-edge.mjs`, and `tests/v3-assignment-push-smoke.mjs` while retaining the prior accumulated architecture, edge and browser/mobile lists visible in the workflow.
3. **Permanent #75 edge coverage exists.** It exercises all/member/team/group payloads, local unauthorized/signed-out/local-preview/no-congregation rejection, target validation, stale congregation target results, post-create refresh failure semantics, exclusion of linked activity, and static checks for trusted congregation-scoped target validation.
4. **Permanent 390px browser coverage exists.** It exercises ministry publish -> ordinary-member receive -> existing start/complete flow, advanced metadata carry-through, publisher visibility, ordinary-member publisher absence, no horizontal overflow and no page/console errors.
5. **Existing Assignments browser regression was modified intentionally** so ministry recipient responses remain read-only while the #75 publisher is present. This preserves the prior recipient read-only semantic rather than deleting it.
6. **No exact #75 workflow run has executed.** Therefore none of the new or accumulated tests can be claimed PASS on candidate `d13ba6b...`.

## APPLICATION / SECURITY FAILURE

### FAIL — ministry role can mutate recipient progress for an assignment not targeted to that user

Primary trusted-function evidence shows `assignmentVisible(admin, assignment, userId, role)` returns `true` immediately for any `facilitator`, `leader`, `pastor`, or `admin`. The same predicate is then used for both `action==='start'` and `action==='complete'`.

Concrete consequence: an active ministry-role user can directly invoke the trusted `bq-assignment` function to start or complete an assignment whose audience is another member/team/group. Completion upserts progress for the caller and can award the caller assignment points. The browser currently hides recipient Start/Complete controls for ministry users, but browser UI gating is not server authorization.

Classification: **APPLICATION / TRUST-BOUNDARY DEFECT**, source-demonstrated; runtime exploit test not yet executed.

Required correction behavior: server read/administrative visibility must be separated from recipient mutation eligibility. `start` and `complete` must require that the caller is actually in the assignment audience (`all`, exact member, team membership, or active group membership), regardless of ministry role. Ministry privilege may remain for legitimate administrative read/feedback/archive functions where separately authorized.

Required regression before closure: faithful trusted-boundary/server-level negative tests proving a ministry user cannot start/complete another user's targeted assignment, cannot receive points from it, and still can complete an assignment when that ministry user is genuinely included in the audience. A client-only mock or source-string assertion is insufficient as the sole proof when a faithful function fixture is feasible.

## ACCEPTANCE MATRIX

| Area | Candidate state at `d13ba6b...` | Evidence classification |
|---|---|---|
| Sole assignment owner / central API boundary | implementation appears to extend existing owners; no second retained owner observed in inspected path | STATIC / requires validator execution |
| Ministry publish controls | present in candidate browser path | STATIC / browser execution missing |
| Server publish authorization | trusted `targets` and `create` ministry-role checks present | STATIC / trusted runtime evidence still required |
| `all/member/team/group` targeting | implemented and edge-covered | STATIC TEST PRESENT, NOT EXECUTED |
| congregation-scoped target directory | trusted function queries active members/teams/groups by congregation | STATIC; execution missing |
| foreign/inactive target rejection | server create validation present; static edge checks present | STATIC; execution missing |
| advanced #74 metadata carry-through | edge + browser assertions present | TEST PRESENT, NOT EXECUTED |
| linked-activity exclusion | candidate edge test asserts omission | TEST PRESENT, NOT EXECUTED |
| server-truth reload after create | candidate edge test covers durable reload and refresh-failure case | TEST PRESENT, NOT EXECUTED |
| eligible member receive/complete | 390px smoke exercises same assignment identity through existing flow | TEST PRESENT, NOT EXECUTED |
| ministry recipient path read-only in UI | retained Assignments smoke explicitly asserts no Start/Complete while publisher exists | TEST PRESENT, NOT EXECUTED |
| ministry recipient mutation blocked on server | **FAIL in source**: ministry role bypasses audience predicate for start/complete | APPLICATION / SECURITY FAILURE |
| stale congregation target result | edge regression present | TEST PRESENT, NOT EXECUTED |
| signed-out/local-preview/no-congregation/ordinary-member publish | edge assertions present | TEST PRESENT, NOT EXECUTED |
| 390px layout/errors | smoke assertions present | TEST PRESENT, NOT EXECUTED |
| accumulated #1-#75 regression | workflow lists prior accumulated coverage plus #75 | WIRED, NOT EXECUTED |

## TEST-INTEGRITY AUDIT

- No evidence in the inspected workflow of removing or skipping the existing accumulated architecture, edge or browser phases to make #75 green.
- #75 invocations were added to all three appropriate accumulated phases.
- The modified `tests/v3-assignments-smoke.mjs` continues to assert ministry recipient read-only behavior and additionally expects the publisher surface; this is not an unexplained semantic weakening.
- Candidate #75 browser smoke uses browser-level mocks for API behavior. That is useful for UI flow but cannot establish trusted server authorization or RLS behavior by itself.
- Candidate edge regression contains several static source-string assertions against the Edge Function. Those checks are useful architecture guards but do not substitute for faithful execution of authorization negatives.

## REQUIRED NEGATIVE / FAILURE EVIDENCE BEFORE READY

1. Correct and execute a trusted-boundary test proving facilitator/leader/pastor/admin cannot start or complete an assignment unless personally included in its audience.
2. Prove unauthorized ministry completion cannot create `bible_assignment_progress` for the caller and cannot award a score event.
3. Retain positive recipient cases for all/member/team/group, including a ministry-role recipient who legitimately belongs to the target audience.
4. Execute foreign/inactive/missing target rejection through the trusted create boundary, not only client validation.
5. Execute session/role/congregation change negatives while target load/publish is in flight.
6. Execute post-create reload failure behavior and confirm retry/reload semantics do not encourage blind duplicate creation.
7. Execute teardown/realtime cleanup coverage and ensure publisher additions did not introduce a second assignment subscription owner.

## EXACT FUNCTIONAL GATE REQUIRED

For a future exact candidate SHA, A4 requires one complete functional workflow whose actual checkout is that SHA and whose executed steps include:

- all accumulated architecture validators including `validate-v3-assignment-push.mjs`;
- all accumulated edge regressions including `v3-assignment-push-edge.mjs` and a faithful trusted-boundary authorization regression for the ministry-recipient negative above;
- all accumulated browser/mobile regressions including `v3-assignment-push-smoke.mjs` and the retained `v3-assignments-smoke.mjs`;
- no cancelled, skipped, timed-out or silently removed prior coverage.

Because #75 is HIGH-RISK, a green run on a later SHA does not inherit this review. A4 must inspect that exact green candidate again before bookkeeping/promotion. Bookkeeping then requires its own exact complete accumulated run.

## TRIAGE RECONCILIATION

The TRIAGE snapshot read after provisional QA findings is stale for the current quarantine candidate: it states #75 implementation has not started and lists the prior A4 report as current at canonical SHA only. That remains true for canonical `606fa7a...` but no longer describes candidate `d13ba6b...`. This report supersedes the old A4 candidate status only; A5 retains final firewall authority.

## FINAL QA RESULT

**NOT READY — one source-demonstrated trusted authorization defect plus missing exact-candidate execution evidence.**

No PASS is transferred from v3.47 or any earlier SHA. The next valid promotion review target must be a new exact candidate containing the server authorization correction and permanent regression protection, followed by a complete exact-SHA accumulated functional run.