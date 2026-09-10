# Autonomous BibleQuest current state

Updated: 2026-09-10 JST by `BQ-A1-RELEASE-CAPTAIN` after exact v3.47 bookkeeping verification and #75 contract recovery.

## Recovery anchors
- Canonical pre-agent checkpoint: `safety/pre-autonomous-agents-20260910-canonical` at `fceb115e763ae729e07325bbb4c9f592206b2c9e`.
- Advanced pre-agent checkpoint: `safety/pre-autonomous-agents-20260910-advanced` at `f01df3e72b5413bba7ae7d16552fca55a448b766`.
- Control branch: `automation/v3-agent-control`.
- Neither safety ref was moved.

## Latest exact verified release state
- Latest frozen release observed: `release/v3.47-advanced-assignments`.
- Frozen/bookkeeping SHA: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact bookkeeping verification run: `34433120915`, complete accumulated architecture + edge + Playwright/browser-mobile suite green with the workflow explicitly checking out and asserting that exact SHA.
- The release ref was already present at the same SHA when re-read after verification; Agent 1 did not move/rewrite it.
- Previous frozen release: `release/v3.46-assignments` at `fceb115e763ae729e07325bbb4c9f592206b2c9e`, exact bookkeeping run `34417620848` green.
- A redundant exact v3.46 revalidation in this cycle, run `34433023861`, also completed green. It does not change release history.
- Isolated `verify/v3.46-assignments-bookkeeping` and `verify/v3.47-advanced-assignments-bookkeeping` were reset to their exact clean candidates after the runs; temporary trigger commits are not release state.

## Current canonical development position
- Active branch: `feature/v3-assignment-push`.
- Exact current branch HEAD at final Captain re-read: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- The branch was confirmed to descend from exact frozen v3.47 `2523f85d47f59721eae81da10cf1007d29af4139` before #75 work began.
- #75 contract recovery commit: `9d39585b0569ac7cf664cd63f5f6caa8d98a7e0e` (`ASSIGNMENT_PUSH_V3.md`).
- Durable handoff update commit: `dbc994dd1e4a7cc2309c55a1338ef98e4940a233`.
- Development status reconciliation commit: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- #75 application implementation is still Not started; contract recovery is complete and the exact next implementation boundary is recorded in `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md`.

## Inventory / parity
- Regression-tested: 73.
- Verified: 1 (#74 Advanced assignments).
- Implemented: 0.
- Not started: 26.
- Strict implemented-or-better parity: **74/100**.
- Official regression stability: **73/100**.
- #74 remains Verified until it survives a later complete milestone suite.
- Deferred by user priority: #15 Japanese furigana and Kids #38–40.

## #75 recovered contract
- Workflow: authorized ministry publisher → eligible member receives through existing assignment RLS/Realtime path → member completes through existing #73/#74 owner.
- Reuse `src/app/assignments.js` as sole assignment owner and `src/core/api.js` as sole browser cloud/trusted-function boundary.
- Trusted retained `bq-assignment` `action:create` is server authority; allowed active publisher roles are facilitator/leader/pastor/admin.
- Retained target scopes: all/member/team/group with server-side same-congregation validation.
- Retained publish fields include title/instructions/type/Scripture refs/due/points/schedule/reminder/recurrence/reflection/minimum quiz/evidence.
- Keep #77 notification/inbox and #79 linked-activity launching out of #75. Recurrence remains metadata only.
- Do not revive retained root `assignment-advanced.js` as a competing runtime owner.

## Additional #75 implementation analysis completed
- Current `src/core/api.js` assignment block already owns assignment load/start/complete/Realtime but does not expose leader publish or an all-active-group target directory.
- Existing Team Center API can provide active teams plus congregation member directory.
- Existing Journey Groups API lists groups through the signed-in user's group memberships, which is insufficient by itself for the retained #75 ability to target any active Journey Group in the congregation.
- Therefore the next implementation must add the smallest congregation-scoped target-directory read through the central API boundary before exposing the group selector; do not silently restrict leaders to only groups they personally joined.

## Blocker
None established. The missing all-active-group target projection is an implementation requirement, not an external blocker.

## Exact next executable action
1. Re-read live `feature/v3-assignment-push` before any write and reconcile any manual/concurrent movement without force-resetting it.
2. Extend the current central API assignment boundary with the minimum congregation-scoped publish-target projection: active member directory, active teams, and active Journey Groups required by member/team/group targeting. Reuse existing field contracts and RLS-visible reads; do not introduce a second Supabase client/owner.
3. Extend `src/app/assignments.js` with one fail-closed leader-publish lifecycle and `src/features/assignments/index.js` with ministry-role authoring UI only.
4. Use only trusted `bq-assignment` `action:create`; do not direct-write assignment/progress/score tables.
5. Add permanent #75 validator, edge tests and 390px leader-publish → member-receive/complete browser coverage.
6. Run targeted checks, then the complete accumulated functional gate against the exact clean #75 candidate. Do not promote on partial evidence.
7. After a green functional candidate, perform bookkeeping, exact-bookkeeping-SHA complete gate, then freeze the next sequential v3 release.

## Production boundary
No `main`, production v2, production Supabase or production Cloudflare change was made in this Captain cycle.