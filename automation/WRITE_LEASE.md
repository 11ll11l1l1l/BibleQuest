# BibleQuest autonomous writer lease

STATUS: REVOKED_FOR_CONTROL_HARDENING
OWNER: none
RUN_NONCE: revoked-bq-a1-20260910T1309-075-f3a1
ACQUIRED_AT_JST: 2026-09-10 13:09 JST
EXPIRES_AFTER_MINUTES: 80
MILESTONE: #75 Assignment Push Workflow
BASE_SHA: 606fa7adfd0ebf8ba1277aa4a89931f5db77a53c
WORK_BRANCH: agent/a1-work/075-assignment-push
LAST_RELEASED_AT_JST: 2026-09-10

## Protocol

This lease was administratively revoked while the scheduled agents were disabled so the control plane could be safely hardened. A1 must treat any OWNER/RUN_NONCE mismatch as loss of lease and stop product/canonical writes.

Do not acquire a new lease until this file is deliberately returned to STATUS: FREE after reconciliation of the in-flight work branch and live repository state.

Normal autonomous protocol after reconciliation: only `BQ-A1-RELEASE-CAPTAIN` may acquire the FREE lease by conditional update using the exact current blob SHA; while held it re-checks the same run nonce before every product/test/workflow/canonical/release write; expired leases require branch/run reconciliation before takeover.

Manual BibleQuest development should disable A1 before writing.