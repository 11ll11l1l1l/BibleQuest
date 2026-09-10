# BibleQuest v3 autonomous agent control

This branch is the durable control plane for five scheduled agents. GitHub is authoritative; chat memory is not.

## Absolute boundaries
- Never modify `main`, production v2, production Cloudflare, or production Supabase unless the user separately and explicitly authorizes it.
- Rebuild-and-verify only; never patch-and-accumulate.
- One source of truth per responsibility.
- No speculative fixes, unrelated refactors, or feature additions during parity reconstruction.
- Never claim tests or browser checks passed unless they actually executed.
- Normal Actions must remain `workflow_dispatch`-only. Temporary `push:` triggers may exist only on isolated verification branches and must never enter a release candidate.
- Never freeze a release until the exact clean bookkeeping SHA passes the complete accumulated required suite.
- Never begin canonical implementation of the next feature before the current milestone's functional and bookkeeping/release gates close.

## Persistent state
Every agent must begin by reading, in this order:
1. `automation/MASTER_CONTROL.md` on branch `automation/v3-agent-control`.
2. Its own role file under `automation/agents/`.
3. `automation/CURRENT.md` and `automation/TRIAGE.md` on the control branch.
4. `DEVELOPMENT_HANDOFF_V3.md` from the actual currently active v3 development branch.
5. Current remote branches, frozen release refs, open v3 PRs, workflow evidence, inventory and relevant tests.

If control-plane files disagree with the live repository, the live repository plus exact verification evidence wins. Update the appropriate control-plane file rather than following stale text.

## Current rollback checkpoints
Do not modify or repurpose these safety refs:
- `safety/pre-autonomous-agents-20260910-canonical` -> canonical #73 line as frozen before autonomous orchestration.
- `safety/pre-autonomous-agents-20260910-advanced` -> newest pre-orchestration advanced-assignments work branch state.
These are recovery anchors only.

## Concurrency model
Only Agent 1 may modify the canonical v3 implementation/release chain.
Agents 2-4 are read-only with respect to product implementation and each owns a separate report namespace.
Agent 5 may modify only triage/control-plane files that it owns; it must not patch product code.

File ownership:
- Agent 1: canonical feature branches, release bookkeeping, `DEVELOPMENT_HANDOFF_V3.md`, and `automation/CURRENT.md`.
- Agent 2: `automation/reports/contract/` only.
- Agent 3: `automation/reports/architecture/` only.
- Agent 4: `automation/reports/qa/` only.
- Agent 5: `automation/TRIAGE.md` and `automation/reports/triage/` only.

Do not overwrite another agent's report. If a shared-state update is needed outside your ownership, record a recommendation in your own report for Agent 5 or Agent 1.

## Milestone lifecycle
The canonical release loop is:
contract recovery -> architecture/RLS recovery -> implementation -> permanent tests -> complete functional gate -> promotion bookkeeping -> exact-bookkeeping-SHA complete gate -> frozen release -> next milestone.

Agent 1 must remain on a milestone when product tests fail, identify the root cause, correct only verified defects, retain regression protection, and rerun required gates. Ordinary failures are not reasons to ask the user to continue.

## Triage classes
Every finding that could affect canonical implementation must be classified as exactly one of:
- BLOCKER: cannot safely/correctly proceed.
- MILESTONE: required for the current milestone parity/stability contract.
- DEFER: real but unrelated to the current milestone.
- IGNORE: speculative, duplicate, cosmetic-only, obsolete, already handled, or too low-impact.
Only BLOCKER and MILESTONE items may interrupt Agent 1's current work.

## Stop conditions
Agents should not stop simply because one assigned item is complete. Record the result, re-read repository state, choose the next task appropriate to the role, and continue until the execution window ends.

Agent 1 may stop early only for a genuine blocker requiring destructive production action, unavailable permissions/credentials, irreconcilable authoritative contract ambiguity, or an external verification limitation that prevents a required gate. Before stopping, it must leave an exact durable handoff.

## Completion definition
BibleQuest v3 is complete only when all parity inventory items are Regression-tested, strict parity is 100/100, regression stability is 100/100, required accumulated architecture/edge/browser-mobile suites pass, the exact final bookkeeping SHA passes, and the final v3 release is frozen.