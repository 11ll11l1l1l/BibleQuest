# BibleQuest v3 autonomous agent control

This branch is the durable control plane for five scheduled agents. GitHub and executed exact-SHA evidence are authoritative; chat memory is not.

## Absolute boundaries
- Never modify `main`, production v2, production Cloudflare, or production Supabase unless the user separately and explicitly authorizes it.
- Rebuild-and-verify only; never patch-and-accumulate.
- One source of truth per responsibility.
- No speculative fixes, unrelated refactors, cosmetic churn, or feature additions during parity reconstruction.
- Never claim tests, browser checks, backend behavior, or deployment state passed unless they actually executed or were directly inspected.
- Normal Actions must remain `workflow_dispatch`-only. Temporary `push:` triggers may exist only on isolated verification branches and must never enter a candidate, canonical milestone branch, frozen release, or safety ref.
- Never freeze a release until the exact clean bookkeeping SHA passes the complete accumulated required suite.
- Never begin canonical implementation of the next feature before the current milestone's functional and bookkeeping/release gates close.
- Speed is subordinate to correctness. Agents must not optimize for number of commits or milestones per run.

## Persistent startup state
Every agent must begin by reading, in this order:
1. `automation/MASTER_CONTROL.md` on `automation/v3-agent-control`.
2. Its own role file under `automation/agents/`.
3. `automation/CURRENT.md` and `automation/TRIAGE.md`.
4. `automation/WRITE_LEASE.md`.
5. `automation/SCHEDULE_AND_LOCKING.md`.
6. `DEVELOPMENT_HANDOFF_V3.md` from the actual currently active canonical v3 milestone branch.
7. Current remote branches, frozen release refs, open v3 PRs, workflow evidence, inventory, relevant contracts and tests.

If control-plane files disagree with the live repository, the live repository plus executed exact-SHA verification evidence wins. A stale control file is advisory only and must be refreshed by its owner; it must never override newer repository evidence.

## Recovery checkpoints
Do not modify, repurpose, delete, or force-update these recovery refs:
- `safety/pre-autonomous-agents-20260910-canonical`
- `safety/pre-autonomous-agents-20260910-advanced`
They are recovery anchors only. Existing frozen `release/v3.*` refs are also immutable after creation.

## Concurrency model
Only Agent 1 may modify autonomous product/release state. Agents 2-4 are read-only with respect to product implementation and each owns a separate report namespace. Agent 5 may modify only triage/control-plane files it owns; it must not patch product code.

File ownership:
- Agent 1: autonomous work branches, verified promotion of canonical feature branches, release bookkeeping, frozen v3 release creation, `DEVELOPMENT_HANDOFF_V3.md` only at verified promotion, `automation/CURRENT.md`, and `automation/WRITE_LEASE.md`.
- Agent 2: `automation/reports/contract/` only.
- Agent 3: `automation/reports/architecture/` only.
- Agent 4: `automation/reports/qa/` only.
- Agent 5: `automation/TRIAGE.md` and `automation/reports/triage/` only.

Do not overwrite another agent's report. If a shared-state update is needed outside your ownership, record a recommendation in your own report for Agent 5 or Agent 1.

## HARD SAFEGUARD 1 — writer lease
Textual 'single writer' authority is not enough. Before Agent 1 performs any product, test, workflow, canonical branch, release, bookkeeping, or canonical handoff write, it must hold the current lease in `automation/WRITE_LEASE.md`.

Lease protocol:
1. Re-read `automation/WRITE_LEASE.md` immediately before acquisition.
2. If it is `FREE`, or an unreleased lease is older than 80 minutes, acquire it by replacing the file using the exact current blob SHA. Record a unique run nonce, acquisition time, intended milestone, base SHA, and autonomous work branch.
3. If the conditional update fails because the file changed, another writer won; do not perform canonical/product writes. Re-read and yield.
4. Before every subsequent product/canonical write, re-read the lease and verify the same run nonce still owns it.
5. Release the lease to `FREE` before normal run exit.
6. If inheriting an expired lease, first reconcile all branches and unverified work left by the previous run. Never assume the abandoned work is valid.

A manual/normal ChatGPT development instance must not write concurrently with A1. If manual work is intentionally started while automation is active, the safest procedure is to disable A1 first. If it is not disabled, the manual writer must honor the same lease and live-state reconciliation rule.

## HARD SAFEGUARD 2 — autonomous quarantine branch
Agent 1 must not implement unverified product changes directly on the canonical v3 milestone branch.

For each milestone:
1. Confirm the canonical milestone branch descends cleanly from the latest frozen verified v3 release and reconcile any legitimate already-approved contract/docs-only state.
2. Create or resume a dedicated autonomous work branch named under `agent/a1-work/` from that reconciled canonical milestone HEAD.
3. All implementation, tests, candidate workflow changes, and defect corrections occur on the autonomous work branch or isolated `verify/` branches — not on the canonical milestone branch.
4. The exact autonomous work-branch candidate must pass the complete functional gate.
5. Agent 4 and Agent 5 must have an opportunity to inspect that exact candidate on the next review cycle before autonomous promotion. A1 may continue diagnosis/testing while waiting, but may not promote a candidate that has not had this independent review opportunity unless the user explicitly directs a manual override.
6. Promotion bookkeeping must also be prepared off-canonical. The exact bookkeeping SHA must pass the complete accumulated gate.
7. Only after the exact bookkeeping SHA is green may Agent 1 fast-forward/promote the canonical milestone branch to that exact verified SHA and freeze the next sequential release at that same SHA.
8. Failed, abandoned, or superseded work branches remain non-canonical evidence and may be deleted only when clearly safe; never rewrite canonical or safety history to hide them.

This makes autonomous mistakes disposable until both implementation and bookkeeping have passed exact-SHA gates.

## HARD SAFEGUARD 3 — fresh evidence only
Every A2/A3/A4 report must identify at minimum:
- active milestone;
- analyzed canonical milestone HEAD;
- analyzed autonomous candidate SHA when one exists;
- frozen base release and SHA;
- evidence paths/contracts inspected;
- FACT vs INFERENCE/RECOMMENDATION;
- missing evidence;
- what repository movement would make the report stale.

Agent 5 must write at the top of `automation/TRIAGE.md`:
- generated-at time;
- active milestone;
- observed canonical milestone HEAD;
- observed autonomous candidate SHA, if any;
- frozen base SHA;
- source report filenames and their analyzed SHAs;
- explicit stale-report warnings.

A1 may treat BLOCKER/MILESTONE items as mandatory only when TRIAGE is fresh for the exact state being acted on. Stale TRIAGE may be useful context but cannot override direct current evidence. Before promotion, A1 must independently re-check every BLOCKER/MILESTONE claim against the candidate being promoted.

## HARD SAFEGUARD 4 — deterministic scope and review barrier
- Work only one canonical milestone at a time.
- Select the next milestone from the authoritative inventory/dependency order and current durable status. Do not reorder merely because another task looks easier or more interesting.
- Explicit user deferrals remain deferred until their turn is necessary for final 100/100 completion.
- Investigator reconnaissance should prioritize the active milestone and at most the next two dependency-likely milestones. Deep speculation farther ahead is low value because evidence will stale.
- A1 may implement after directly recovering the contract even if an investigator report is missing, but it may not lower acceptance standards because a report failed to arrive.
- Autonomous promotion requires: exact candidate identified; required permanent tests present; complete functional gate green; no unresolved fresh BLOCKER/MILESTONE findings; independent A4/A5 review opportunity; exact bookkeeping SHA complete gate green; canonical branch/release advanced only to that exact green SHA.

## Milestone lifecycle
The canonical release loop is:
contract recovery -> architecture/RLS recovery -> isolated implementation -> permanent tests -> complete exact functional gate -> independent QA/triage review -> off-canonical promotion bookkeeping -> exact-bookkeeping-SHA complete gate -> promote canonical branch -> frozen release -> next milestone.

Agent 1 must remain on a milestone when product tests fail, identify the root cause, correct only verified defects, retain regression protection, and rerun required gates. Ordinary failures are not reasons to ask the user to continue.

Do not start another verification run for the same candidate while a required run is still in progress. A cancelled/incomplete run is not green evidence.

## Triage classes
Every finding that could affect canonical implementation must be classified as exactly one of:
- BLOCKER: cannot safely/correctly proceed.
- MILESTONE: required for the current milestone parity/stability contract.
- DEFER: real but unrelated to the current milestone.
- IGNORE: speculative, duplicate, cosmetic-only, obsolete, already handled, stale, or too low-impact.
Only fresh BLOCKER and MILESTONE items may interrupt Agent 1's current work.

## Stop conditions
Agents should not stop simply because one assigned item is complete, but 'continue' means continue useful work within the safety model, not create more changes. Read-only investigation, reconciliation, test planning, or waiting for a required external gate is preferable to speculative implementation.

Agent 1 may stop early only for a genuine blocker requiring destructive production action, unavailable permissions/credentials, irreconcilable authoritative contract ambiguity, lost writer lease, conflicting manual canonical work that cannot be reconciled safely, or an external verification limitation that prevents a required gate. Before stopping, it must leave an exact durable handoff in the control plane.

## Completion definition
BibleQuest v3 is complete only when all parity inventory items are Regression-tested, strict parity is 100/100, regression stability is 100/100, required accumulated architecture/edge/browser-mobile suites pass, the exact final bookkeeping SHA passes, the final v3 release is frozen at that exact SHA, and production remains untouched until separately authorized.