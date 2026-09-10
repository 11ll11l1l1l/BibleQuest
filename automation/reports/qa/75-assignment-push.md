# QA / Regression Report — #75 Assignment Push Workflow

Agent: `BQ-A4-QA`
Analyzed canonical branch: `feature/v3-assignment-push`
Analyzed HEAD: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`
Baseline frozen release: `release/v3.47-advanced-assignments` at `2523f85d47f59721eae81da10cf1007d29af4139`
Date: 2026-09-10 JST

## Recommendation

**NOT READY** for Implemented/Verified promotion. This is not an application failure: #75 application implementation is still Not started on the analyzed SHA, and there is no #75-specific validator, edge test, browser/mobile test, or exact candidate workflow run to audit yet. The current branch contains contract/status/handoff work only.

No external QA BLOCKER is established. The missing evidence is expected milestone work.

## Evidence classification

- **PASS — prior baseline only:** v3.47 bookkeeping run `34433120915` completed successfully. Independent inspection confirms its temporary verification workflow explicitly checked out and asserted exact SHA `2523f85d47f59721eae81da10cf1007d29af4139`, then completed accumulated architecture validators, edge regressions and browser/mobile regressions successfully.
- **MISSING EVIDENCE — #75:** GitHub reports no workflow runs for `feature/v3-assignment-push` at this audit. No earlier #74 run is accepted as proof of #75.
- **NOT AN APPLICATION DEFECT:** current #75 HEAD is three commits ahead of frozen v3.47 and those changes are only `ASSIGNMENT_PUSH_V3.md`, `DEVELOPMENT_HANDOFF_V3.md`, and `DEVELOPMENT_STATUS_V3.md`; implementation has not yet begun.
- **KNOWN PRIOR FIXTURE HISTORY, NON-BLOCKING:** the development ledger records earlier validator/fixture defects for Assignments/Advanced Assignments. Those are retained regression history, not current #75 application failures.

## Acceptance matrix

| Area | Required #75 acceptance | Evidence at analyzed SHA |
|---|---|---|
| Ownership | `src/app/assignments.js` remains sole assignment application owner; `src/core/api.js` remains sole browser cloud/trusted-function/Realtime boundary; presentation forwards events only | Contracted; implementation/evidence missing |
| Publisher authorization | Only active facilitator/leader/pastor/admin receive authoring capability; signed-out, local-preview, no-congregation, unknown-role and ordinary member cannot publish | Missing |
| Server authority | Publish invokes trusted `bq-assignment` `action:create`; browser role gating is never treated as authorization | Missing |
| Audience scopes | `all`, `member`, `team`, `group` normalize correctly; non-all targets require IDs | Missing |
| Target directory | Ministry user can select only active same-congregation member/team/group targets; valid active Journey Group not personally joined by leader is discoverable | Missing; architecture milestone requirement |
| Scope rejection | Cross-congregation, inactive, missing or malformed member/team/group target cannot create | Missing |
| Advanced fields | schedule/reminder/recurrence metadata, reflection requirement, quiz threshold, evidence type, due date, points, type, title/instructions and Scripture refs survive publish without changing #74 semantics | Missing |
| Exclusions | no #79 linked-activity browser publishing, no #77 notification/inbox implementation, no browser recurrence generation | Missing static proof |
| Truth reload | Successful create reloads server/RLS truth; no durable client-only assignment is synthesized | Missing |
| Receive | Eligible member receives the new server assignment through the existing assignment RLS/read/Realtime path | Missing |
| Complete | Recipient can open/start/complete through existing #73/#74 owner, including advanced requirements and idempotent scoring | Missing |
| Failure UX | create/load failure does not show false success, retain phantom assignment, strand disabled controls, or leak stale target data | Missing |
| Session/congregation transition | sign-out, identity change, congregation switch and feature teardown clear target state and do not duplicate subscriptions/listeners/timers | Missing |
| Mobile | 390px publish -> receive -> complete has no horizontal overflow, inaccessible controls, page errors or console errors | Missing |
| Accumulated regression | all retained #1-#74 architecture, edge and browser/mobile suites remain green on exact #75 candidate | Missing |

## Permanent regression tests required

### Architecture validator
Create a permanent #75 validator (expected naming consistent with current suite: `scripts/validate-v3-assignment-push.mjs`) proving at minimum:

1. sole owner remains `src/app/assignments.js` and sole browser cloud boundary remains `src/core/api.js`;
2. retained root `assignment-advanced.js` is not imported/executed as a second owner;
3. browser source has no direct INSERT/UPDATE/DELETE path to assignment, assignment-progress or score-event tables;
4. publish calls only the trusted assignment API/create boundary;
5. authoring role set is facilitator/leader/pastor/admin and fail-closed local capability is retained;
6. all/member/team/group are the retained audience scopes;
7. linked activity, Notification Center behavior and client recurrence generation remain outside #75;
8. target-directory access remains congregation-scoped and ministry-gated rather than weakening general Journey Group visibility.

### Edge regression
Create permanent `tests/v3-assignment-push-edge.mjs` coverage for:

- normalized valid create payload for each audience scope;
- non-all target ID required;
- invalid scope, malformed/empty title/instructions/reference metadata and out-of-bound values rejected according to retained server contract;
- ordinary member/signed-out/local-preview/no-congregation/unknown-role cannot invoke create;
- facilitator, leader, pastor and admin authoring paths are accepted locally but still pass through server authority;
- member/team/group directory contains only active same-congregation targets;
- an active same-congregation Journey Group not joined/owned by the leader is available to the publisher;
- foreign/inactive/missing target IDs are rejected by trusted create even if manually injected past the selector;
- publish success triggers reload from server truth rather than optimistic durable append;
- failed create preserves retryability and does not create a local phantom;
- delayed target-directory result from congregation A cannot populate congregation B after a switch;
- repeated load/watch/teardown does not duplicate Realtime subscriptions, listeners or timers;
- advanced fields retain #74 normalization and completion semantics;
- existing #73/#74 recipient start/complete/idempotent scoring behavior is reused, not reimplemented.

Trusted-function fixture tests must exercise server authorization/scope behavior or an exact faithful fixture of it. A client-only mock saying `success` is insufficient proof that cross-congregation target rejection exists.

### Browser/mobile regression
Create permanent browser coverage (expected naming `tests/v3-assignment-push-smoke.mjs`) with at least the retained required 390px end-to-end scenario:

1. authorized ministry identity enters Assignments and sees one publish surface;
2. selectors load active congregation targets without exposing unrelated data;
3. publish to `member`, then prove eligible recipient receives/open-start-completes the same server identity;
4. exercise `team` and `group` visibility/receipt contracts, including a valid group the publisher has not personally joined;
5. exercise `all` without requiring a target ID;
6. carry representative advanced metadata through publish and verify recipient-side #74 presentation/requirement behavior;
7. failed create visibly fails and can be retried without duplicate/phantom assignment;
8. ordinary member does not see/use publish controls;
9. no horizontal overflow, clipped dialog controls, unscrollable modal, page error or console error at 390px.

For regression resilience, also retain the suite's existing wider/narrower layout coverage where already present; #75 does not need bespoke screenshots at every width unless the authoring surface changes layout behavior there.

## Negative / failure cases required

- expired/invalid session during target load and during publish;
- congregation membership removed or role downgraded between opening the authoring UI and pressing Publish;
- direct manual target UUID from another congregation;
- inactive/deleted member or Journey Group selected from stale UI state;
- missing target for member/team/group and unexpected target supplied for all;
- trusted function/network failure before creation: no success state or phantom row;
- response/reload failure after a server create: UI must not invent completion; provide recoverable reload semantics without blind duplicate creation;
- double-click/repeated submit cannot create unintended duplicate client actions or leave the UI permanently busy;
- session/congregation switch while target request is in flight cannot leak or reuse previous congregation target labels/IDs;
- Realtime event after teardown must not update stale assignment UI;
- scheduled assignment still obeys #74 opening rule; required reflection/evidence/minimum-quiz checks remain intact after pushed creation;
- recurrence metadata never causes browser-generated duplicate assignments;
- reminder metadata never implies Notification Center/push delivery that #77 does not implement.

## Cross-feature regression risks

1. **Journey Groups privacy:** do not broaden general group RLS merely to populate the leader selector. QA must prove the target directory can include an eligible group not joined by the leader without making all group data generally readable.
2. **Congregation/session state:** stale target-directory responses must not cross selected-congregation or identity boundaries.
3. **Assignments #73:** publisher additions must not make ministry users accidentally eligible for member start/complete actions, nor alter recipient progress isolation.
4. **Advanced Assignments #74:** pushed assignments must preserve scheduled/open/overdue and reflection/evidence/quiz requirement behavior.
5. **Trusted scoring:** completion remains idempotent; publish must not introduce direct score writes.
6. **Realtime lifecycle:** reuse the single assignment refresh path and cleanup; no second channel/polling owner.
7. **Future milestone boundaries:** #77 notifications and #79 linked activity remain absent from #75; storing reminder/recurrence metadata is not evidence those features work.

## Accumulated suites required for promotion

The exact clean #75 functional candidate must execute the complete current accumulated workflow, extended to include the permanent #75 tests:

- all accumulated architecture validators #1-#74 plus #75 validator;
- all accumulated edge regressions #1-#74 plus #75 edge regression;
- all accumulated Playwright/browser-mobile regressions #1-#74 plus #75 browser regression.

A targeted #75 run is useful during implementation but is insufficient for `Verified` promotion.

After promotion bookkeeping changes inventory/status/handoff, the exact bookkeeping SHA must independently run the same complete accumulated suite with checkout and SHA assertion of that exact bookkeeping commit. Parent/candidate success does not substitute for bookkeeping-SHA evidence.

## Exact promotion evidence required

### Implemented
- exact canonical candidate SHA identified;
- #75 implementation and permanent validator/edge/browser tests present at that SHA;
- targeted tests actually executed and results recorded;
- no unresolved MILESTONE/BLOCKER from architecture/contract reports.

### Verified
- complete accumulated functional workflow run ID;
- workflow explicitly checks out/asserts the exact clean #75 functional candidate SHA;
- architecture, edge and browser/mobile phases all `success`;
- #75 browser scenario is part of the executed browser phase, not merely committed;
- any failure classified and root-caused as application, fixture, CI/environment or missing evidence before rerun; no pass inferred from partial reruns.

### Regression-tested
- #75 must later survive the complete functional suite of a subsequent milestone on that subsequent exact candidate. Freezing #75 alone does not make it Regression-tested.

## Current failures

No #75 application failure is asserted because #75 application code has not yet been implemented or executed.

## Missing evidence

- no #75 implementation candidate SHA;
- no permanent #75 validator;
- no permanent #75 edge regression;
- no permanent #75 browser/mobile regression;
- no trusted target-directory/create negative evidence for #75;
- no exact #75 functional workflow run;
- no #75 bookkeeping SHA or exact-bookkeeping workflow run.

## Final QA disposition

**NOT READY — MISSING EVIDENCE, not failed application.**

Agent 1 may continue implementing #75. QA promotion should be withheld until the exact implementation candidate carries the permanent tests above and the complete accumulated functional gate actually executes green. The architecture requirement identified for ministry-scoped congregation target discovery is part of #75 acceptance and must be proven by tests, but it is not an external stop condition.