# BibleQuest Agent Triage

This file is an analysis-only handoff for the primary BibleQuest development process.

It lives on the dedicated `agent-analysis` branch and must never be merged automatically into `main`.

## Rules

- Investigators are read-only and may not modify GitHub, Supabase, Cloudflare, workflows, branches, PRs, issues, or files.
- Only the firewall/triage agent may update this file, and only on `agent-analysis`.
- Current `main` is the observed implementation truth. Old agent instructions are evidence only and may be obsolete.
- Findings do not become development work merely because they exist.
- P3/P4 findings are suppressed from the active development queue.
- The current milestone remains higher priority than newly discovered P2/P3/P4 issues. Only P0/P1 may interrupt it.
- No test may be reported PASS unless it was actually executed.

## Priority definitions

- **P0 — Stop:** security/privacy/data corruption, materially dangerous doctrinal/content behavior, or core app unusable.
- **P1 — Release blocker:** a required core flow or explicit current acceptance criterion fails.
- **P2 — Important regression:** meaningful user-facing failure with material impact, but not a current release blocker.
- **P3 — Minor:** small bug, edge case, cosmetic issue, or workaround exists; record but do not interrupt development.
- **P4 — Observation:** cleanup, style, speculative improvement, theoretical risk, or non-impacting code issue; suppress.

## Impact gate

A finding can enter the actionable queue only if evidence shows at least one of the following:

1. Prevents a normal user from completing a current core BibleQuest journey.
2. Risks data loss/corruption, privacy, authentication, or security.
3. Produces materially incorrect Scripture/content/doctrinal behavior.
4. Violates an explicit current release acceptance criterion.
5. Is a demonstrated regression from previously verified behavior.
6. Affects a meaningful portion of normal users.
7. Blocks the current milestone.

If none apply, classify P3/P4 and suppress it from the active queue.

## Current actionable queue

_No triaged findings yet._

## Deferred / suppressed findings

_No triaged findings yet._

## Triage history

_No triage cycles recorded yet._
