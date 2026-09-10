# A4 QA / regression investigation — #76 Ministry Hub

Agent: `BQ-A4-QA`
Inspected: 2026-09-10 JST

## STATE / PROVENANCE

- Active recovery target: **#76 Ministry Hub**.
- #76 canonical branch: **absent** at inspection (`feature/v3-ministry-hub` not found).
- #76 A1 quarantine candidate: **absent** at inspection (`agent/a1-work/076-ministry-hub` not found).
- Last canonical milestone branch: `feature/v3-assignment-push` at exact `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Latest frozen release/base: `release/v3.48-assignment-push` at exact `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Frozen-base exact run: GitHub Actions `34450088492`, completed `success`; job `102783621514` completed exact-SHA assertion, accumulated architecture validators, accumulated edge regressions, Playwright/Chromium/local-server setup, and accumulated browser/mobile regressions.
- Authoritative inventory at v3.48: #76 `Ministry Hub` = `Not started`, verification phrase **`open tools; role guard; navigation`**. #77 Notification Center, #78 Workspace, and #79 Linked Activities are separate later milestones.

Because no #76 candidate exists, this is an **acceptance-definition / pre-implementation QA report**, not READY/PASS evidence. No PASS transfers from v3.48 to a future #76 SHA.

## PRIMARY EVIDENCE — FACT

1. `FEATURE_INVENTORY_V3.md` at frozen v3.48 requires #76 `open tools; role guard; navigation` and keeps #77–#79 separate.
2. `DEVELOPMENT_HANDOFF_V3.md` at the frozen product SHA is historically stale about #75 closure, but live canonical/frozen refs and control state show #75 is closed at v3.48.
3. `.github/workflows/v3-regression.yml` at exact v3.48 is `workflow_dispatch`-only and invokes the full accumulated architecture, edge, and browser/mobile lists through #75. There is no #76 validator/edge/smoke invocation yet.
4. Exact run `34450088492` is a successful baseline run. Its job records successful exact-bookkeeping-SHA assertion plus all accumulated phases. This evidence proves only the frozen v3.48 baseline.
5. No #76 branch/candidate/run exists at inspection time, so there is no exact #76 implementation evidence to audit and no valid basis for READY.

## PROVISIONAL ACCEPTANCE MATRIX

The following is the minimum QA contract supported by primary evidence and current verified ownership boundaries. It must be demonstrated on the exact future candidate SHA.

| Area | Required acceptance |
|---|---|
| Open path | Ministry Hub can be reached through the current v3 navigation/router and renders without creating a parallel shell/router/runtime. |
| Ordinary member | An authenticated active congregation member can open the hub unless stronger authoritative contract evidence changes this behavior; ordinary member must not receive ministry-only controls merely because the hub is readable. |
| Ministry role guard | Existing normalized congregation role state is used. Facilitator/Leader/Pastor/Admin receive only the ministry affordances proven by the recovered contract; unsupported/unknown/missing role state fails closed for ministry-only controls. |
| Signed-out / missing membership | No privileged controls or authority leak. Behavior must be deterministic and safe through the existing session/membership owners. |
| Navigation | Supported tool links navigate through the existing router to current verified destinations. A deferred/unavailable destination must not silently masquerade as implemented. |
| Scope isolation | #43 Live Rooms and #77/#78/#79 are not silently implemented or counted as #76 unless new authoritative evidence proves a required dependency. |
| Trust boundary | UI role visibility is not treated as authorization. Any privileged mutation must remain with an already verified trusted server owner; a portal-only #76 should not add browser privileged DML/storage writes. |
| Mobile/touch | At minimum the hub entry, role-aware controls, and supported navigation work at the project's established 390px mobile acceptance width without inaccessible/clipped controls. |
| Keyboard/navigation | Hub controls and links remain keyboard reachable and do not break existing history/back navigation behavior. |
| Failure state | Missing/failed congregation context or unavailable destination fails safely without exposing privileged controls or breaking the shell. |
| Cross-feature | Existing Assignments, Journey Groups, congregation membership, router, shell, and accumulated regressions continue passing unchanged. |

## PERMANENT REGRESSIONS REQUIRED FOR FUTURE CANDIDATE

At minimum, #76 should add meaningful executable coverage that can fail for incorrect behavior:

- architecture validator for one Ministry Hub owner/composition path, existing router/membership owner reuse, and absence of forbidden competing owner/direct backend shortcuts;
- edge/runtime test for role projection and fail-closed unknown/missing membership behavior at the actual Ministry Hub boundary;
- browser/mobile smoke at 390px proving hub open, ordinary-member vs ministry-role presentation, supported tool navigation, and safe handling of at least one deferred/unavailable destination if such a destination is rendered;
- if any privileged mutation enters #76, faithful trusted-boundary executable authorization coverage is required; browser mocks/source-string checks alone are insufficient.

If A1 changes an existing accumulated validator/test or alters `.github/workflows/v3-regression.yml` beyond adding the new #76 invocation, the candidate becomes HIGH-RISK under the control rules and requires reproduced `TEST/FIXTURE DEFECT` justification plus fresh exact-candidate A4/A5 review.

## ACCUMULATED HARNESS BASELINE

At frozen v3.48, `.github/workflows/v3-regression.yml` invokes:

- accumulated architecture validators through `scripts/validate-v3-assignment-push.mjs` plus the existing post-assignment validators;
- accumulated edge regressions including the #75 assignment push/response/publish authorization tests and all prior edge suites;
- accumulated browser/mobile regressions including #75 assignment-push smoke and all prior listed smoke suites.

For a future #76 PASS, A4 must compare the candidate workflow against this exact baseline and verify that the executed exact-SHA workflow actually invokes the new #76 coverage **and** retains all prior invocations. Unexplained deletion, narrowing, renamed-away tests, timeout reduction, skip, exclusion, or bypass is NOT READY.

## QA RISK / NEGATIVE CASES

- Do not confuse `can(..., 'ministry')` client presentation state with server authorization.
- Do not require ministry role merely to open the hub if the retained/authoritative contract continues to support ordinary member readability.
- Unknown/unsupported role must not default to ministry access.
- Navigation must not create duplicate router ownership or direct location hacks that bypass current route/history behavior.
- Deferred #43/#77/#78/#79 surfaces must not be represented as verified merely because a button exists.
- If legacy messages/polls/calendar/media behavior is later pulled into #76, QA scope and risk must be re-opened; those workflows are not proven by the current narrow inventory phrase and may require trusted-server/storage/security evidence.

## FAILURES

- None established in product code because no #76 implementation exists yet.

## MISSING EVIDENCE

- No #76 canonical HEAD.
- No `agent/a1-work/076-...` candidate SHA.
- No exact #76 functional or bookkeeping run ID.
- No #76 validator, edge regression, or browser/mobile smoke in the accumulated workflow.
- No exact executed proof of role guard/navigation on #76.
- No dedicated #76 milestone contract resolving whether retained messages/devotionals, polls, calendar, or media belong to #76 versus later work.

## DISPOSITION

**NOT READY — pre-implementation acceptance only.**

There is no #76 candidate to approve or reject. The frozen v3.48 baseline is green and suitable as the known-good starting point, but that PASS is non-transferable. A future candidate should be audited first at its exact SHA, with permanent #76 tests and a complete accumulated workflow execution before any PASS/READY statement.

## TRIAGE / OTHER-REPORT RECONCILIATION

TRIAGE was read only after the independent primary-evidence pass. It is stale for the current milestone because it still describes #75 as active and #76 as deferred pending #75 closure; live refs/control state show #75 is already frozen at v3.48. It supplies no current #76 blocker or authorization.

A2 and A3 reports were also read only after the provisional QA findings were formed. Their bounded portal/navigation interpretation is consistent with the independently inspected inventory, but their conclusions are advisory rather than proof.

## STALENESS CONDITIONS

This report becomes candidate-stale immediately if a #76 canonical/work branch appears or advances. It also becomes stale if the frozen base changes, authoritative #76 contract/inventory changes, router/congregation-role ownership changes, #76 introduces schema/RLS/grant/trusted-function/storage/dependency/workflow changes, permanent #76 tests appear/change, or new exact #76 workflow evidence is produced.

A4 made no product, workflow, canonical/work branch, inventory, release, handoff, lease, CURRENT, TRIAGE, `main`, or production-system modification.