# BibleQuest autonomous completion plan

This document summarizes the current five-agent operating plan. `MASTER_CONTROL.md`, role files, the live repository, and executed exact-SHA evidence take precedence.

## Objectives
1. Preserve rollback points and frozen verified releases.
2. Continue the v3 rebuild without repeated manual `continue` messages.
3. Keep weaker autonomous agents away from unreviewed canonical product state.
4. Serialize all autonomous implementation through one writer and a lease.
5. Keep contract, architecture/security, QA and triage review ahead of promotion.
6. Preserve strict rebuild-and-verify until parity and regression stability both reach 100/100.

## Recovery baseline
Do-not-move recovery refs:
- `safety/pre-autonomous-agents-20260910-canonical` -> `fceb115e763ae729e07325bbb4c9f592206b2c9e`.
- `safety/pre-autonomous-agents-20260910-advanced` -> `f01df3e72b5413bba7ae7d16552fca55a448b766`.
Recovery uses a new branch from an exact checkpoint; safety refs and frozen releases are never rewritten.

## Five identities
- A1 `BQ-A1-RELEASE-CAPTAIN`: sole autonomous implementation/release writer.
- A2 `BQ-A2-CONTRACT`: retained behavior and parity contract investigator.
- A3 `BQ-A3-ARCH-SECURITY`: architecture, Supabase/RLS, auth/privacy and lifecycle investigator.
- A4 `BQ-A4-QA`: acceptance/regression/evidence investigator.
- A5 `BQ-A5-FIREWALL`: evidence triage and noise firewall.

## Hourly schedule, Asia/Tokyo
- A2 :28
- A3 :38
- A4 :48
- A5 :58
- A1 :08

The review cycle intentionally places A2-A5 before the next A1 writer pass.

## Current canonical position at this plan revision
The latest durable state is recorded in `automation/CURRENT.md` and the live `DEVELOPMENT_HANDOFF_V3.md`. At the time the safety model was hardened, the project was at frozen v3.47 Advanced Assignments, strict parity 74/100, regression stability 73/100, with #75 Assignment Push contract recovery complete and application implementation not yet started. Always re-read live state; these numbers will become stale.

## Isolation model
A1 does not put unverified implementation directly on the canonical milestone branch.

For one milestone at a time:
1. Reconcile the canonical milestone branch against the latest frozen verified release.
2. Acquire `automation/WRITE_LEASE.md` using a conditional update and unique run nonce.
3. Create/resume `agent/a1-work/<milestone>` from the reconciled canonical state.
4. Recover the contract and implement only that milestone on the work branch.
5. Add permanent architecture, edge and browser/mobile regression protection.
6. Run targeted checks and then the complete functional gate against the exact work candidate SHA.
7. Leave the exact candidate available for the next A4/A5 review cycle; do not promote merely because A1 believes it is correct.
8. Resolve only evidence-backed defects and rerun until green.
9. Prepare promotion bookkeeping off-canonical.
10. Run the complete accumulated suite against the exact bookkeeping SHA.
11. Only after green, advance the canonical milestone branch to that exact SHA and freeze the next sequential release at the same SHA.
12. Update durable handoff/current state, release the writer lease, then select the next dependency-safe milestone.

Failed autonomous branches are disposable; verified frozen history is not.

## Investigator pipeline
A2-A4 prioritize the active milestone/candidate. They may prepare at most the next two dependency-likely milestones so useful work stays ahead without building a large stale speculative backlog.

Reports must record exact canonical/candidate SHAs, frozen base SHA, evidence inspected, facts versus inferences, missing evidence and staleness conditions.

A5 reconciles reports against current repository evidence. TRIAGE must declare the exact state it covers. Only fresh evidence-backed BLOCKER/MILESTONE findings may interrupt A1.

## Independent review barrier
A1 may implement and run tests in its own cycle, but autonomous promotion waits for the next A4/A5 review opportunity of the exact candidate. This deliberately trades a small amount of latency for a separate check by agents whose roles cannot modify product code.

A missing investigator report does not permit weaker standards. If a report is unavailable, A1 continues safe investigation/testing but does not fabricate independent approval.

## Failure/recovery policy
Ordinary test failures stay inside the current milestone and are root-caused. Missing permissions, destructive production requirements, lost writer lease, irreconcilable authoritative ambiguity, conflicting manual canonical work, or unavailable required verification are legitimate stop conditions.

If autonomous work looks unsafe:
1. disable all five scheduled agents;
2. inspect `automation/WRITE_LEASE.md` and the latest autonomous work branch;
3. compare with the latest frozen verified release and safety refs;
4. discard/supersede the bad work branch;
5. resume from a fresh branch based on the exact verified checkpoint.

## Completion
Autonomous operation is complete only when the authoritative inventory reaches 100/100 Regression-tested, parity is 100/100, regression stability is 100/100, the required accumulated architecture/edge/browser-mobile suites pass against the exact final bookkeeping SHA, the final v3 release is frozen at that SHA, and production remains untouched until separately authorized.