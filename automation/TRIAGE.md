# BibleQuest autonomous triage

Owner: Agent 5 (`BQ-A5-FIREWALL`)
Updated: 2026-09-10 12:57 JST

Agent 1 consumes only BLOCKER and MILESTONE items as mandatory current-work inputs.

## Active position
- Active milestone: **#75 Assignment Push Workflow**.
- Canonical branch observed: `feature/v3-assignment-push` at `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Frozen base: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`; exact bookkeeping run `34433120915` is the retained green #74 evidence.
- #75 implementation remains Not started at the observed SHA; current branch work is contract/handoff/status recovery only.

## BLOCKER
- **None established.** No report or repository evidence shows an external condition preventing safe #75 implementation.

## MILESTONE
- **Trusted congregation-scoped publish target directory.** #75 must support `all/member/team/group` targeting without weakening general Journey Group privacy. Current `src/core/api.js` Journey Group listing starts from the signed-in user's active group memberships, while current `bible_groups` RLS allows reads only to owners/active group members. Therefore a leader cannot safely discover every eligible active Journey Group through that existing read path. Add the minimum ministry-authorized, congregation-scoped target projection through the existing central API/trusted-server boundary; keep `src/app/assignments.js` as sole assignment owner and `src/core/api.js` as sole browser cloud boundary. This is required milestone implementation, not a stop condition.
- **#75 permanent proof before promotion.** Add and actually execute the #75 architecture validator, edge/security regressions, and 390px publish -> eligible receive -> existing #73/#74 completion browser flow. Required negative coverage includes unauthorized roles, foreign/inactive targets, stale congregation/session results, failed create/reload behavior, and duplicate lifecycle/subscription prevention. Then run the complete accumulated #1-#75 gate on the exact functional candidate and again on the exact bookkeeping SHA before freeze. Missing evidence now is expected because implementation has not started; it is not an application failure.

## DEFER
- #15 Japanese furigana and Kids #38-40 remain deferred by user priority and must not delay #75.
- #77 Notification Center/inbox delivery and #79 linked-activity launching remain future milestone scope; #75 may preserve reminder/recurrence metadata only as recovered contract data.

## IGNORE
- Do not revive root `assignment-advanced.js` as a competing owner, broaden Journey Group RLS merely for selector convenience, add direct browser assignment/progress/score writes, or treat local role checks as authorization.
- Do not import the old v2/main broad progress-snapshot overwrite finding into current v3 without new v3 evidence; A3 reports that path is not present in the inspected v3 account/device service.
- Missing #75 workflow runs at the pre-implementation SHA are not a defect and must not interrupt implementation.

## Report freshness
- Agent 2 contract report: **MISSING** under `automation/reports/contract/`; do not invent Agent 2 findings. Agent 1's durable `ASSIGNMENT_PUSH_V3.md` contract recovery remains repository evidence, not a substitute Agent 2 report.
- Agent 3 `automation/reports/architecture/75-assignment-push.md`: **CURRENT**, analyzed SHA `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Agent 4 `automation/reports/qa/75-assignment-push.md`: **CURRENT**, analyzed SHA `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Prior TRIAGE setup state for #73/#74 is stale and superseded by the frozen v3.47 base and active #75 branch above.

## Firewall decision
Counterfactual/dependency/scope tests support **0 BLOCKER, 2 MILESTONE requirements, no new DEFER/IGNORE item requiring Agent 1 interruption**. A3 and A4 agree: the target-directory boundary belongs inside #75 and the absent #75 test evidence is expected pre-implementation state.

## Next safe action
Agent 1 should continue #75 from live `feature/v3-assignment-push`: implement the minimum trusted ministry-scoped target-directory boundary first, then extend the existing assignment owner/presentation, add permanent #75 tests, and run the exact accumulated functional/bookkeeping gates. Do not modify production services during rebuild verification.