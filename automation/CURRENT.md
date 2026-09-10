# Autonomous BibleQuest current state

Updated: 2026-09-10 JST during autonomous-safety hardening.

## Control / recovery
- Live control branch after rollout: `automation/v3-agent-control`.
- Control-plane pre-hardening recovery: `safety/pre-agent-control-hardening-20260910` at `d2de4cf57be4e9ab6b7476698b7ca77e8aca526a`.
- Product recovery anchors remain `safety/pre-autonomous-agents-20260910-canonical` and `safety/pre-autonomous-agents-20260910-advanced`.
- Writer lease is expected FREE before scheduled A1 resumes; A1 must acquire `automation/WRITE_LEASE.md` before any product/test/workflow/canonical/release write.
- Unverified autonomous implementation must use `agent/a1-work/...` quarantine branches.

## Latest exact verified release
- Latest frozen release: `release/v3.47-advanced-assignments`.
- Frozen/bookkeeping SHA: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact bookkeeping verification run: `34433120915`, complete accumulated architecture + edge + browser/mobile suite green with exact checkout/assertion of that SHA.
- Previous frozen release: `release/v3.46-assignments` at `fceb115e763ae729e07325bbb4c9f592206b2c9e`, exact bookkeeping run `34417620848` green.
- Frozen release refs are immutable.

## Current canonical / quarantine position
- Active milestone: **#75 Assignment Push Workflow**.
- Risk tier: **HIGH-RISK** because implementation requires trusted server/authorization scope for publishing target discovery/creation.
- Canonical milestone branch: `feature/v3-assignment-push`.
- Canonical HEAD at hardening: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- That canonical branch contains #75 contract/status/handoff recovery only; #75 application implementation was Not started at this SHA.
- Designated A1 quarantine branch: `agent/a1-work/075-assignment-push`, created from exact canonical SHA `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Older branch `agent/a1/m75-assignment-push-work` is non-canonical and must not receive new autonomous work.
- A1 must not put unverified #75 product code directly on `feature/v3-assignment-push`.

## Inventory / parity
- Regression-tested: 73.
- Verified: 1 (#74 Advanced Assignments).
- Implemented: 0.
- Not started: 26.
- Strict implemented-or-better parity: **74/100**.
- Official regression stability: **73/100**.
- #74 remains Verified until it survives a later complete milestone suite.
- Deferred by user priority: #15 Japanese furigana and Kids #38-40.

## #75 authoritative contract summary
- Authorized ministry publisher -> eligible member receives through existing assignment RLS/Realtime -> member completes through existing #73/#74 owner.
- `src/app/assignments.js` remains sole assignment application owner.
- `src/core/api.js` remains sole browser cloud/trusted-function boundary.
- Retained `bq-assignment` `action:create` remains server mutation authority; allowed active roles are facilitator/leader/pastor/admin.
- Retained target scopes: all/member/team/group with server-side same-congregation validation.
- Retained fields include title/instructions/type/Scripture refs/due/points/schedule/reminder/recurrence/reflection/minimum quiz/evidence.
- #77 notification/inbox and #79 linked-activity launch/completion remain outside #75. Recurrence remains metadata only.
- Do not revive retained root `assignment-advanced.js` as a competing runtime owner.

## Current #75 architecture finding
Existing Team Center reads can provide active teams/member directory, but current Journey Groups listing is membership-based and cannot safely provide every eligible active congregation Journey Group to a ministry publisher.

#75 therefore requires the minimum ministry-authorized, congregation-scoped publish-target projection through the existing central API/trusted-server boundary. Do not broaden general Journey Group RLS merely for selector convenience.

## High-risk review state at hardening
- A3 architecture report for #75 exists and identifies the trusted target-directory requirement with no external blocker.
- A4 pre-implementation QA contract exists and correctly reports #75 NOT READY only because implementation/evidence is not yet present.
- A5 TRIAGE was refreshed to #75 at canonical SHA `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c` with no established BLOCKER.
- These pre-implementation reports authorize beginning bounded high-risk implementation under the guardrails, but they do **not** authorize promotion of a future candidate.
- After exact #75 functional candidate is green, A4 must review that exact candidate SHA and A5 must issue a fresh promotion recommendation before bookkeeping/promotion.

## Exact next executable action
1. A1 acquires the writer lease with unique nonce, milestone #75, canonical/base SHA and work branch `agent/a1-work/075-assignment-push`.
2. Re-read canonical `feature/v3-assignment-push`, the quarantine branch and frozen v3.47; if any moved unexpectedly, reconcile without force.
3. Perform #75 implementation only on `agent/a1-work/075-assignment-push`.
4. Add the smallest trusted congregation-scoped publishing-target projection, preserving the existing assignment/API owners and server authorization.
5. Extend `src/app/assignments.js` with one fail-closed leader-publish lifecycle and `src/features/assignments/index.js` with ministry authoring UI only.
6. Use trusted `bq-assignment action:create`; no direct assignment/progress/score table writes.
7. Add meaningful permanent #75 architecture validator, edge/security regressions and 390px publish -> receive -> existing completion browser coverage.
8. Run targeted checks then the complete accumulated functional gate against the exact clean quarantine candidate.
9. Because #75 is HIGH-RISK, hold the exact green functional candidate for fresh A4 exact-SHA review and A5 promotion recommendation.
10. Then prepare bookkeeping off-canonical, run the complete exact bookkeeping-SHA gate, and only afterward fast-forward the canonical branch and freeze the next release at the exact green SHA.

## Production boundary
No `main`, production v2, production Supabase or production Cloudflare change is authorized during this rebuild.