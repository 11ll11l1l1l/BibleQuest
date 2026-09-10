# Autonomous schedule and interference control

## Cycle
Five scheduled tasks run every hour, staggered by 10 minutes.

JST schedule:
- Agent 2 Contract Investigator: minute 28.
- Agent 3 Architecture/Security Investigator: minute 38.
- Agent 4 QA/Regression Investigator: minute 48.
- Agent 5 Firewall/Triage Controller: minute 58.
- Agent 1 Release Captain: minute 08 of the following review window.

The intended pipeline is A2 -> A3 -> A4 -> A5 -> A1. Investigators prepare evidence, A5 filters it, and A1 consumes only fresh current-state conclusions.

## Safety-first utilization
Agents should use available execution time productively, but must never optimize for number of commits, reports, or milestones.

- A2: active milestone first, then at most the next two dependency-likely milestones.
- A3: active milestone/candidate first, then at most the next two architecture/security contracts.
- A4: audit any active exact candidate first, then prepare the active/next acceptance contract.
- A5: reconcile all fresh reports against the current exact state and keep TRIAGE current. Do not invent work when no new evidence exists.
- A1: one canonical milestone at a time. It may continue multiple safe steps in a run, but unverified implementation stays quarantined off-canonical.

Read-only reconnaissance, test planning, branch reconciliation and evidence review are valid productive work. Agents must not manufacture changes merely to stay busy.

## Writer lease
`automation/WRITE_LEASE.md` is the serialization primitive for Agent 1 product/canonical writes.

- A1 must atomically acquire the lease using the current file/blob SHA before any product/test/workflow/canonical/release write.
- The lease records a unique run nonce, active milestone, base SHA and work branch.
- A1 must re-read and verify the same nonce before every later product/canonical write.
- A conditional update conflict means another writer won; A1 must yield.
- Normal exit releases the lease to FREE.
- An unreleased lease may be treated as expired only after 80 minutes. Before taking over an expired lease, reconcile all in-progress branches/evidence left by the prior run.
- A manual chat should disable A1 before doing canonical BibleQuest development. If not disabled, it must honor the same lease.

## Autonomous quarantine
A1 implementation does not land directly on the canonical milestone branch.

1. Reconcile canonical milestone HEAD against the latest frozen release.
2. Create/resume `agent/a1-work/<milestone>` from the reconciled canonical HEAD.
3. Implement and test there.
4. Run the complete exact functional gate on the work candidate.
5. Allow A4/A5 the next review cycle to inspect that exact candidate.
6. Prepare bookkeeping off-canonical and run the exact bookkeeping gate.
7. Only then advance the canonical milestone branch and frozen release to the exact green bookkeeping SHA.

A failed autonomous branch cannot damage the last canonical/frozen verified state unless somebody intentionally promotes it in violation of this protocol.

## Freshness rule
Every investigator report must state the exact canonical HEAD and exact candidate SHA it analyzed. A5 must state these exact values at the top of TRIAGE.

A report is stale when the exact state it analyzed is no longer the state being acted on. A stale report may be contextual evidence but cannot by itself block or promote work. Before promotion, A1 independently verifies all fresh BLOCKER/MILESTONE items against the exact candidate.

## No cross-role writes
- A1: work/canonical/release state, CURRENT, WRITE_LEASE.
- A2: contract reports only.
- A3: architecture reports only.
- A4: QA reports only.
- A5: TRIAGE and triage reports only.

No agent edits another role's report.

## Verification interference
Do not launch a second required verification for the same candidate while the first is running. `cancelled`, `skipped`, `timed_out`, partial, or unexecuted phases are not successful evidence.

Temporary `push:` trigger commits are permitted only on isolated `verify/` branches. The workflow must explicitly checkout/assert the intended clean SHA. Trigger commits are never candidates, canonical branch tips, releases, or safety refs and must be removed/reset after use.

## Recovery
If autonomous work becomes incorrect:
1. disable all five BibleQuest scheduled agents;
2. inspect the latest exact frozen verified release and current lease;
3. compare the bad autonomous work branch with the frozen release and `safety/pre-autonomous-agents-20260910-*` refs;
4. discard or supersede the autonomous work branch rather than rewriting verified history;
5. create a fresh recovery/work branch from the appropriate exact checkpoint.

Safety refs and frozen releases are never moved to hide a mistake.