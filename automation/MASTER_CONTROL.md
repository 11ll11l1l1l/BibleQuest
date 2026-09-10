# BibleQuest v3 autonomous agent control

This branch is the durable control plane for five scheduled agents. GitHub state and executed exact-SHA evidence are authoritative; chat memory and agent opinions are not.

## Absolute boundaries
- Never modify `main`, production v2, production Cloudflare, or production Supabase unless the user separately and explicitly authorizes it.
- Rebuild-and-verify only; never patch-and-accumulate.
- One source of truth per responsibility.
- No speculative fixes, unrelated refactors, cosmetic churn, or feature additions during parity reconstruction.
- Never claim tests, browser checks, backend behavior, deployment state, or security behavior passed unless actually executed/inspected.
- Normal Actions remain `workflow_dispatch`-only. Temporary `push:` triggers may exist only on isolated `verify/` branches and never enter a candidate, canonical branch, release, or safety ref.
- Never freeze until the exact clean bookkeeping SHA passes the complete accumulated required suite.
- Never begin the next canonical feature while the current milestone release gate is incomplete.
- Do not optimize for commit count or milestone count. Optimize for verified progress.

## Mandatory control files
Every agent first reads:
1. `automation/MASTER_CONTROL.md`.
2. `automation/AGENT_GUARDRAILS.md`.
3. its own role file under `automation/agents/`.
4. `automation/WRITE_LEASE.md` and `automation/SCHEDULE_AND_LOCKING.md` as relevant to the role.

After that, follow the role-specific startup order. In particular, investigators must inspect primary repository evidence before reading TRIAGE, and A1 must inspect live product state before using TRIAGE as an action filter.

If control text disagrees with live repository state or executed exact-SHA evidence, live evidence wins. Refresh the stale control file rather than following it blindly.

## Immutable recovery points
Never move, repurpose, delete, or force-update:
- `safety/pre-autonomous-agents-20260910-canonical`
- `safety/pre-autonomous-agents-20260910-advanced`
- `safety/pre-agent-control-hardening-20260910`
- any existing frozen `release/v3.*` ref.

Recovery creates a new branch from an exact known-good checkpoint; it never rewrites verified history.

## Concurrency and ownership
Only A1 may perform autonomous product/release writes. A2-A4 are product-read-only. A5 is product-read-only and owns triage.

Control-plane ownership:
- A1: autonomous work branches, verified promotion of canonical milestone branches, release bookkeeping, release refs, `automation/CURRENT.md`, `automation/WRITE_LEASE.md`, and canonical `DEVELOPMENT_HANDOFF_V3.md` only through verified bookkeeping promotion.
- A2: `automation/reports/contract/` only.
- A3: `automation/reports/architecture/` only.
- A4: `automation/reports/qa/` only.
- A5: `automation/TRIAGE.md` and `automation/reports/triage/` only.

No agent edits another role's report.

## Hard safeguard 1 — writer lease
Before any product, test, workflow, canonical branch, bookkeeping, handoff, or release write, A1 must hold the lease in `automation/WRITE_LEASE.md`.

Lease protocol:
1. Re-read the exact current lease file.
2. If FREE, acquire it by conditional update using the current blob SHA. Record a unique run nonce, milestone, base SHA and work branch.
3. If the update conflicts, another writer won; do not perform product/canonical writes.
4. Re-read and verify the same nonce before every later product/canonical write.
5. Release to FREE on normal exit.
6. A lease is stale only after the configured expiry; takeover requires full branch/run reconciliation first.

Manual/normal-chat development should disable A1 before writing. If not disabled, it must not concurrently edit A1's canonical/work branches.

## Hard safeguard 2 — autonomous quarantine
A1 never implements unverified product changes directly on the canonical milestone branch.

Per milestone:
1. reconcile the exact canonical milestone HEAD against the latest frozen release;
2. create/resume one work branch under `agent/a1-work/<milestone-id>-<slug>` from the reconciled canonical HEAD;
3. implement, add tests, and fix defects only on that work branch;
4. run the complete exact functional gate there;
5. prepare bookkeeping off-canonical and run the exact bookkeeping gate;
6. only then fast-forward the canonical milestone branch to an authorized exact green SHA;
7. never force-update canonical, release, or safety refs.

Active #75 work branch: `agent/a1-work/075-assignment-push`, created from canonical `feature/v3-assignment-push` at `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.

The older `agent/a1/m75-assignment-push-work` branch is non-canonical and must not receive new autonomous work.

## Hard safeguard 3 — risk-aware independent review
A1 must classify the milestone before its first product write.

HIGH-RISK includes auth/session, authorization/RLS/grants, trusted Edge/RPC/server authority, schema/data migrations, production/deployment configuration, global router/shell ownership, package/dependency/workflow changes, replacing a verified owner, or broad cross-feature persistence/sync semantics.

For HIGH-RISK work:
- before first product write: require a current A3 architecture/security report for the active milestone/frozen base and no A5 BLOCKER;
- after exact functional green: require A4 to review that exact candidate and A5 to recommend promotion for that exact candidate before bookkeeping/promotion.

NORMAL-RISK work stays inside already verified owners and does not change a trust boundary. It may complete functional -> bookkeeping -> exact bookkeeping -> promotion in the same A1 execution window when all exact gates pass and no unresolved current BLOCKER/MILESTONE exists. A later A4/A5 audit may stop the next milestone if a real regression is discovered.

If NORMAL-RISK implementation unexpectedly touches a HIGH-RISK area, reclassify before continuing.

#75 Assignment Push is HIGH-RISK because it requires trusted server/authorization scope for publish-target discovery/creation.

## Hard safeguard 4 — report independence, provenance, freshness
A2-A4 independently inspect primary evidence before reading TRIAGE. They must not cite another agent's opinion as proof.

Every A2-A4 report records:
- milestone;
- canonical branch and exact HEAD;
- work candidate SHA when present;
- frozen base release/SHA;
- primary evidence inspected;
- FACT vs INFERENCE/RECOMMENDATION;
- missing evidence;
- exact changes that would make the report stale.

A5 TRIAGE records exact canonical/candidate/frozen SHAs and source-report freshness. Candidate-specific claims are stale when candidate HEAD changes.

Only fresh, evidence-backed BLOCKER/MILESTONE findings can stop current work or authorize HIGH-RISK promotion. Agreement between agents is not evidence by itself.

## Hard safeguard 5 — scope and test integrity
One canonical milestone at a time. Work only the recovered current contract plus permanent tests/bookkeeping.

Do not mix later inventory rows, opportunistic cleanup, cosmetic redesign, mass formatting, unrelated refactors, retired parallel owners, or broad architecture changes.

If a fix unexpectedly requires another verified owner, a global shell, dependency/workflow, migration, or unrelated feature, prove the dependency and reclassify scope/risk before continuing.

Tests must be capable of detecting the claimed missing behavior. Never weaken/delete/skip/narrow an existing regression to make green. Existing-test changes require a documented `TEST/FIXTURE DEFECT` explanation that preserves the intended semantic assertion. Runtime/security claims require executable or faithful trusted-boundary evidence, not source-string checks or client mocks alone when stronger evidence is feasible.

## Canonical milestone lifecycle
contract recovery -> architecture/security recovery as applicable -> isolated implementation -> permanent tests -> exact complete functional gate -> HIGH-RISK independent review if required -> off-canonical bookkeeping -> exact bookkeeping-SHA complete gate -> canonical fast-forward -> frozen release -> next milestone.

A product failure keeps A1 on the milestone. Reproduce, identify root cause, fix only verified causes, retain regression protection, rerun.

Do not start duplicate required verification for the same candidate while one is running. Cancelled, partial, timed-out, skipped, or unexecuted phases are not green.

## Triage classes
Every material finding is exactly one of:
- BLOCKER — active milestone cannot safely/correctly proceed.
- MILESTONE — required inside the active milestone contract.
- DEFER — real but later/unrelated.
- IGNORE — speculative, stale, duplicate, cosmetic-only, obsolete, already protected, or immaterial.

A5 may use BLOCKER/MILESTONE only with primary evidence and a concrete counterfactual showing what acceptance, security, ownership, data-integrity or regression failure occurs if not handled now.

## Stop/yield conditions
Do not stop merely because one subtask finished. Continue useful work within the safety model.

A1 may yield for genuine external/destructive production requirements, missing permissions/credentials, irreconcilable authoritative ambiguity, lost lease, conflicting manual branch movement that cannot be reconciled safely, or unavailable required verification. Leave an exact durable handoff before exit.

Read-only investigation/test planning is preferable to speculative code when blocked.

## Completion
BibleQuest v3 is complete only when the authoritative inventory is 100/100 Regression-tested, strict parity is 100/100, regression stability is 100/100, all required accumulated architecture/edge/browser-mobile suites pass against the exact final bookkeeping SHA, the final v3 release is frozen at that SHA, and production remains untouched until separately authorized.