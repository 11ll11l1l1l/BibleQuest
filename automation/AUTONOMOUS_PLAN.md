# BibleQuest autonomous completion plan

This document defines the current five-agent operating plan. It supplements, but does not override, `MASTER_CONTROL.md` or the live v3 repository evidence.

## Objectives
1. Preserve a guaranteed rollback point before autonomous work.
2. Resume canonical development immediately from the exact live state.
3. Prevent parallel agents from editing the same product ownership area.
4. Keep research, architecture/security analysis, QA planning and triage ahead of the single canonical implementer.
5. Remove the need for manual `continue` messages by scheduling repeated autonomous cycles.
6. Preserve strict rebuild-and-verify and exact-SHA release gates until 100/100 parity and stability.

## Recovery baseline
Two do-not-move safety refs were created before orchestration:
- `safety/pre-autonomous-agents-20260910-canonical` -> `fceb115e763ae729e07325bbb4c9f592206b2c9e`.
- `safety/pre-autonomous-agents-20260910-advanced` -> `f01df3e72b5413bba7ae7d16552fca55a448b766`.
The first preserves the observed canonical Assignments line; the second preserves the newer Advanced Assignments line. Recovery must use a new branch from one of these refs; never rewrite the safety refs.

## Five autonomous scheduled identities
Existing five active BibleQuest scheduled slots were repurposed rather than adding a second competing set.

- A1 `BQ-A1-RELEASE-CAPTAIN`: canonical implementation/release writer.
- A2 `BQ-A2-CONTRACT`: retained behavior and parity contract investigator.
- A3 `BQ-A3-ARCH-SECURITY`: architecture, Supabase/RLS, auth/privacy and lifecycle investigator.
- A4 `BQ-A4-QA`: acceptance/regression/evidence investigator.
- A5 `BQ-A5-FIREWALL`: evidence triage and noise firewall.

## Schedule, Asia/Tokyo
Initial starts on 2026-09-10:
- A1 12:20, then every 3 hours.
- A2 12:35, then every 3 hours.
- A3 12:50, then every 3 hours.
- A4 13:05, then every 3 hours.
- A5 13:20, then every 3 hours.

This ordering intentionally lets A1 resume the already-known #73 release work immediately. A2-A5 then prepare/filter #74 and later work before A1's next cycle at 15:20. Future cycles preserve the same 15-minute staggering.

## Interference prevention
Canonical writes are serialized by authority, not by assuming tasks never overlap. Only A1 may change product/release state. A2-A4 write only separate report trees. A5 writes only triage. Every writer must re-read live state immediately before writing and must not force-reset over concurrent/manual changes.

## Canonical milestone algorithm
For every remaining inventory item A1 repeats:
1. Reconcile live state and latest frozen release.
2. Read contract/architecture/QA/triage evidence.
3. Recover the authoritative retained contract.
4. Implement on a feature branch derived from the latest verified frozen v3 release.
5. Add permanent regression protection.
6. Run complete functional gate against exact candidate SHA.
7. Fix verified defects and rerun until green; distinguish test-fixture/CI failures.
8. Update inventory/bookkeeping/handoff, producing a new exact SHA.
9. Run the complete suite against that exact bookkeeping SHA.
10. Freeze only that exact green SHA as the next release.
11. Update durable handoff/current state.
12. Immediately proceed to the next eligible milestone within the same run if execution remains available.

## Investigator pipeline
A2-A4 should normally stay two to five milestones ahead. Their work is advisory until A5 filters it. A5 allows only evidence-backed BLOCKER/MILESTONE items to interrupt A1; DEFER/IGNORE findings are prevented from causing scope drift.

## Current first transition
At setup, the durable handoff reports #73 Assignments functionally green with run `34417012845`, strict parity 73/100 and regression stability 72/100, with final #73 bookkeeping/freeze still required. A newer Advanced Assignments branch also exists. A1 must reconcile these without bypassing the #73 exact bookkeeping gate. #74 becomes canonical only after the v3.46 Assignments release is verified/frozen.

## Failure/recovery policy
If an autonomous run encounters an ordinary test failure, it continues diagnosis within its role. If it encounters missing permissions, destructive production requirements, unrecoverable contract ambiguity, or unavailable authoritative verification, it records the exact blocker and next action instead of inventing success.

If the agents produce unsafe or low-quality work:
1. disable the five scheduled tasks;
2. inspect the exact latest frozen verified release;
3. compare against the two safety refs;
4. create a fresh recovery branch from the appropriate safety/frozen SHA;
5. do not repair by rewriting history or moving safety refs.

## Completion
Autonomous operation ends only when the authoritative inventory is 100/100 Regression-tested, parity is 100/100, stability is 100/100, required accumulated suites are green against the exact final bookkeeping SHA, the final v3 release is frozen, and the durable handoff records that state.