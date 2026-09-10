# Autonomous schedule and interference control

## Cycle
Five scheduled tasks run on a staggered three-hour cycle. Agent 1 runs first so current canonical work resumes immediately; Agents 2-5 then prepare the next cycle's research/QA/triage. The following Agent 1 run consumes those outputs.

Planned JST offsets per cycle:
- Agent 1 Release Captain: minute 00 of its cycle anchor.
- Agent 2 Contract: +15 minutes.
- Agent 3 Architecture/Security: +30 minutes.
- Agent 4 QA/Regression: +45 minutes.
- Agent 5 Firewall/Triage: +60 minutes.

Each task repeats every 3 hours from its own first start.

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