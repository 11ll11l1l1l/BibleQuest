# BibleQuest autonomous triage

Owner: Agent 5 (`BQ-A5-FIREWALL`).

This file is intentionally concise. Agent 1 consumes only BLOCKER and MILESTONE items as mandatory current-work inputs.

## Active position at setup
- Current canonical transition: close #73 Assignments bookkeeping/release, then #74 Advanced Assignments.
- Latest known frozen release from handoff: `release/v3.45-congregation-recognition`.
- #73 exact functional run `34417012845` was green.
- Protected pre-agent branches preserve both canonical and newer advanced work.

## BLOCKERS
- None established at orchestration setup. Re-evaluate against live repository and new reports.

## MILESTONE REQUIREMENTS
- Reconcile the canonical `feature/v3-assignments` line and the newer `feature/v3-advanced-assignments` work before promoting #74.
- #73 must complete exact bookkeeping-SHA verification and v3.46 freeze before canonical #74 implementation can proceed.
- Existing #74 work may be reused only after verifying compatibility with the frozen v3.46 base and recovered #74 retained contract.

## DEFER
- #15 Japanese furigana and Kids #38-40 remain deferred by prior user priority but must eventually be completed for full 100/100 parity.

## IGNORE
- Do not create work merely from stale branches, cosmetic differences or speculative refactors.

## Next safe action
Agent 1 should reconcile live state, finish #73 release bookkeeping if still pending, then move to #74 only from the verified frozen v3.46 base. Agents 2-4 should prepare #74 and subsequent milestone evidence in parallel.