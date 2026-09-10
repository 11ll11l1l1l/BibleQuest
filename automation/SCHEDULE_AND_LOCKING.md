# Autonomous schedule and interference control

## Cycle
Five scheduled tasks run every hour, staggered by 10 minutes. This is intentionally aggressive: each role should use its full execution window and continue to additional useful work rather than stopping after one small task.

JST schedule:
- Agent 2 Contract Investigator: minute 28 of every hour.
- Agent 3 Architecture/Security Investigator: minute 38 of every hour.
- Agent 4 QA/Regression Investigator: minute 48 of every hour.
- Agent 5 Firewall/Triage Controller: minute 58 of every hour.
- Agent 1 Release Captain: minute 08 of every hour.

This ordering creates a rolling pipeline. A2-A4 prepare evidence, A5 filters it, and A1 consumes the newest safe conclusions on the following :08 pass. Because Agent 1 is the only canonical writer, the research agents can overlap without creating competing product implementations.

## Full-utilization rule
Every agent should continue doing useful work for its role until its execution window is exhausted or no safe work remains.

- A2 should investigate the active milestone when needed, then continue several milestones ahead.
- A3 should inspect active and upcoming ownership/data/security contracts and continue ahead when complete.
- A4 should audit current candidate evidence and prepare acceptance/regression contracts for upcoming milestones.
- A5 should process all new reports, mark stale evidence, resolve conflicts, and keep TRIAGE current; when no new findings exist it should verify the current decision basis rather than invent work.
- A1 should continue through as many safe canonical rebuild-and-verify steps and milestones as the execution permits. Completing one milestone is not a reason to stop if the next milestone can safely begin under the release-gate rules.

Agents must not manufacture changes simply to remain busy. Useful read-only reconnaissance and verification are preferred to unnecessary edits.

## Why overlap is safe
Only Agent 1 may write canonical product/release state. Agents 2-4 write different report directories. Agent 5 writes only TRIAGE/triage reports. Shared product implementation is therefore serialized even if scheduled runs overlap in wall-clock time.

## Writer lease rule
Before Agent 1 changes canonical product/release state, it must inspect the live branch and compare it with the state it read at startup. If another canonical writer or manual user change has moved the branch, it must rebase/reconcile from the live state rather than force-push or overwrite it. Force-resetting canonical or safety branches is forbidden.

## Stale-input rule
Every agent must re-read live repository state immediately before making any GitHub write. Reports must identify the milestone/SHA they analyzed. Agent 5 must mark reports stale when their analyzed SHA no longer matches current canonical state.

## No cross-role writes
- A1 does not edit A2/A3/A4/A5 report files.
- A2 writes only contract reports.
- A3 writes only architecture reports.
- A4 writes only QA reports.
- A5 writes only triage files.

## Recovery
If autonomous work becomes incorrect, do not repair by rewriting history. Stop/disable scheduled tasks, compare against the two `safety/pre-autonomous-agents-20260910-*` refs, and create a fresh recovery branch from the appropriate exact checkpoint. Safety refs are never moved.