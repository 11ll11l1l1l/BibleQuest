# V7 workspace cleanup — 2026-10-27

Owner request: clean V7 and consolidate instructions/information before V8.

Baseline: `main` at `87cb9dd4c3b60b9679e0acecda519300194b6d55`. Task branch: `chore/v7-workspace-cleanup-20261027`. Single executor; documentation-only scope. Live PR #1550 was read and confirms merged V7.1 and its sealed release evidence. Open artwork PRs contain distinct unmerged candidate/evidence work and remain preserved.

## Changes

- Replaced accumulated AGENTS instructions with one concise entry point and links to binding policy.
- Reconciled README, documentation/work indexes, release navigation and current status with shipped V7.1.
- Preserved prior AGENTS/status/V7 plan snapshots and archived 51 old task handoffs plus three unreferenced September release narratives. Relative Markdown links follow moved files.
- Removed duplicate artwork prescriptions from the rulebook; maintained privacy, Scripture, rights, data and exact-SHA protections.
- Reconciled the provisional V8 plan with the conversation/realtime features already shipped in V7.1. No feature implementation or release certification claimed.

## Preservation

Runtime, data/corpus, approved/candidate artwork, immutable rejection hashes, tests, workflows, migrations, lockfile and rollback refs are unchanged. Older root documents with executable references remain at their original paths. No remote branch/PR deletion, production deployment, account/data mutation or automation change.

## Verification and handoff

Validation: all changed/moved Markdown local links resolve (0 broken); documentation-only path boundary and archive preservation checks pass; `git diff --check` passes. Two legacy V3 documentation tests were attempted and fail on historical exact-SHA assertions (`priority missing cumulative exact-green SHA`, `status is missing the promoted release commit`). Every document and test read by those checks is byte-identical to the starting baseline; these are pre-existing failures, not cleanup regressions. Node used locally: 24.22.1, not pinned release certification. No test or historical evidence was weakened to make them pass. New runtime certification is unnecessary for this documentation-only task and is not claimed. Next: use current status and V8 P0 to assign bounded remaining work from the released baseline.
