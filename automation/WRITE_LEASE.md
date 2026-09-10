# BibleQuest autonomous writer lease

STATUS: HELD
OWNER: BQ-A1-RELEASE-CAPTAIN
RUN_NONCE: a1-075-bookkeeping-20260910-1617-jst-7c41
ACQUIRED_AT_JST: 2026-09-10 16:17 JST
EXPIRES_AFTER_MINUTES: 80
MILESTONE: #75 Assignment Push Workflow
BASE_SHA: a42100452d1b1fff7c146543e8ab5cd67da32193
WORK_BRANCH: agent/a1-work/075-assignment-push
LAST_RELEASED_AT_JST: 2026-09-10

## Protocol

Only `BQ-A1-RELEASE-CAPTAIN` may acquire this lease for autonomous BibleQuest product/canonical writes.

Acquisition must replace this file using the exact current blob SHA. If the conditional update fails, another writer or controller changed the lease and the run must not perform product/canonical writes.

While held, Agent 1 must re-read this file before every product/test/workflow/canonical/release write and verify that `OWNER` and `RUN_NONCE` still match its run.

Normal exit replaces the state above with `STATUS: FREE` and clears owner/run/milestone/base/work-branch fields.

An unreleased lease is considered stale only after 80 minutes. Before taking an expired lease, reconcile all live canonical/work/verify branches and exact workflow evidence left by the previous run. Never assume abandoned work is correct.

Manual BibleQuest development should disable A1 before writing. If A1 remains enabled, the manual writer must honor the same lease/reconciliation model.