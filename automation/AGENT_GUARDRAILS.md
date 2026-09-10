# BibleQuest v3 autonomous guardrails

These rules harden the five-agent system against weaker autonomous reasoning while preserving fast hourly throughput. They supplement `MASTER_CONTROL.md`; where they conflict with older advisory text, these rules win unless live repository evidence proves them stale.

## 1. Evidence before interpretation

Every run must distinguish raw evidence from agent conclusions. Repository state, exact commit ancestry, retained source, tests, workflow run results and server/RLS contracts are primary evidence. Another agent's report, chat handoff or prior conclusion is advisory only.

Do not copy a recommendation into code merely because another agent wrote it. Reconstruct the smallest implementation from current architecture and primary evidence.

## 2. Anti-anchoring order

Investigators A2-A4 must perform their own repository inspection before reading any current triage conclusion. They must not use another agent's conclusion as evidence.

A1 must inspect the live repository, active branch, frozen release and durable handoff before consuming TRIAGE. TRIAGE is a filter, not a source of truth.

A5 must compare independently produced reports against primary repository evidence before upgrading any finding to BLOCKER or MILESTONE.

## 3. Autonomous implementation isolation

A1 must not place unverified product implementation directly onto the canonical milestone branch.

For every milestone:
1. record the exact canonical milestone branch HEAD and latest frozen release SHA;
2. create/use one isolated work branch named `agent/a1/m<NN>-<slug>-work` from the canonical milestone branch when that branch contains only accepted contract/bookkeeping setup, otherwise from the exact latest frozen release and explicitly reconstructed milestone contract;
3. perform product implementation, tests and corrections only on that isolated work branch;
4. run the complete functional gate against the exact clean work-branch candidate SHA;
5. only after that exact candidate is green may the canonical milestone branch be fast-forwarded to that candidate;
6. never force-update the canonical milestone branch. If it moved independently, re-read and reconcile before promotion.

For the active #75 milestone the designated work branch is `agent/a1/m75-assignment-push-work`, created from `feature/v3-assignment-push` at `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.

A failed or abandoned autonomous candidate may remain on its work branch. Do not repair canonical state by rewriting history.

## 4. Pre-write transaction check

Immediately before every product write A1 must know and record in its working notes/handoff:
- milestone ID and exact retained requirement being implemented;
- latest frozen base SHA;
- current isolated work-branch HEAD;
- expected files/owners to change;
- files/owners that must not change;
- exact permanent tests that will prove the behavior;
- whether the change is HIGH-RISK under section 5.

Re-read the remote work-branch HEAD immediately before the write. If it changed unexpectedly, do not overwrite it; reconcile first.

## 5. Risk-tier gate

A1 may proceed without waiting for an extra human approval when the milestone remains inside an already verified owner and does not change a trust boundary.

Treat a change as HIGH-RISK when it touches any of these:
- auth/session identity or recovery;
- authorization, RLS, grants, cross-congregation/cross-user visibility;
- Edge Functions, trusted RPCs or server authority;
- schema migrations or destructive/persistent data transformations;
- production configuration or deployment behavior;
- global routing/shell ownership;
- package/dependency or workflow changes;
- replacing an existing verified owner or introducing a second owner;
- broad persistence/synchronization semantics across multiple verified features.

Before the first HIGH-RISK product write, require a current A3 architecture/security report tied to the same frozen base/current milestone and no A5 BLOCKER. Missing A3 evidence is not required for ordinary low-risk UI/local composition work.

Production remains out of bounds regardless of risk tier.

## 6. Scope containment

A milestone implementation may change only files required by the recovered contract, permanent tests and its bookkeeping/docs. Do not mix later inventory rows, opportunistic cleanup, cosmetic redesign or unrelated refactors.

If a proposed fix requires modifying a second verified owner, broad global shell, dependency graph, workflow, migration, or unrelated feature, first prove that dependency is required by the current milestone. Otherwise classify it for later work.

Do not rename/delete verified modules or perform mass formatting while implementing parity work unless the current milestone explicitly requires it and the complete accumulated suite proves the replacement.

## 7. Test-integrity rules

Passing tests are evidence only when the test could realistically fail for the defect or missing behavior being claimed.

- New milestone tests must assert observable behavior, state, authorization, data flow or ownership relevant to the contract; source-string checks alone are insufficient evidence for runtime behavior when executable coverage is feasible.
- Do not weaken, delete, skip, narrow or bypass an existing regression merely to make a candidate green.
- A1 may correct a proven fixture/test defect only after recording why the fixture is wrong and preserving the semantic assertion the test was intended to enforce.
- A changed existing test requires an explicit `TEST/FIXTURE DEFECT` explanation in the handoff. Product failures must be fixed in product code, not reclassified without evidence.
- For security/scope behavior, a browser/client mock returning success is not proof of server authorization; use retained server logic, faithful edge fixtures or executed trusted-boundary evidence.
- Never infer a pass from an earlier SHA, parent SHA, similar branch or unexecuted scenario.

## 8. Candidate invariants before functional gate

Before calling a work-branch SHA a functional candidate, A1 must verify:
- it descends from the intended frozen/canonical base;
- no merge from `main` or unrelated feature branch was introduced;
- production files/configuration were not deployed or changed outside the rebuild branch;
- no unexpected owner, workflow or dependency changed;
- the milestone-specific validator/edge/browser coverage required by the contract exists;
- accumulated tests remain present rather than replaced by a smaller suite.

## 9. Promotion and freeze are separate transactions

Functional candidate green -> fast-forward canonical milestone branch -> bookkeeping commit -> exact-bookkeeping-SHA complete gate -> freeze.

Never combine these into one inferred step. If the canonical branch moved after the functional run, the old run no longer authorizes promotion of the new head.

A release ref may be created only at the exact green bookkeeping SHA. If the intended release ref already exists at another SHA, do not move it; stop and record the conflict.

## 10. Report provenance and freshness

Every A2-A4 report must begin with:
- milestone ID/name;
- analyzed branch;
- analyzed exact HEAD SHA;
- latest frozen base SHA;
- date/time;
- primary evidence inspected;
- FACT vs INFERENCE for any nontrivial conclusion.

A report is stale for candidate-specific claims as soon as the analyzed product HEAD changes. Contract facts that are independent of implementation may remain useful, but A5/A1 must explicitly say so rather than treating the whole report as current.

A5 TRIAGE must always state the exact product HEAD and frozen base it applies to. If TRIAGE and live repository disagree, A1 ignores stale candidate-specific TRIAGE and proceeds from verified live evidence while recording the mismatch.

## 11. Firewall threshold

A5 may classify a finding as BLOCKER or MILESTONE only when it can identify primary evidence and explain the direct counterfactual: what concrete acceptance, security, data-integrity or regression failure occurs if A1 does not address it now.

If a severe-sounding claim cannot be verified against current repository/server evidence, classify it as unconfirmed DEFER/IGNORE rather than stopping A1.

## 12. Normal-chat/manual coexistence

While autonomous A1 is enabled, normal chat/manual development must not write to A1's isolated work branch or canonical milestone branch concurrently.

If manual development is intentionally started, use one of these safe patterns:
- pause A1 first, then continue from the exact live state; or
- use a separate `manual/...` branch and do not merge/promote it while A1 is active.

A1 must treat any unexpected movement of its work/canonical branch as a concurrent manual change and reconcile rather than overwrite.

## 13. Speed rule

Safety checks must not become an excuse for idle cycles. Once primary evidence, current required reports for HIGH-RISK work and the milestone contract are sufficient, A1 should implement, test, correct and continue within the same execution window.

A2-A4 should stay ahead, but their absence must not block ordinary low-risk work when the contract is already authoritative. A5 should keep TRIAGE short and only surface findings that change A1's next action.

## 14. Recovery

Control-plane recovery anchor before this hardening: `safety/pre-agent-control-hardening-20260910` -> `d2de4cf57be4e9ab6b7476698b7ca77e8aca526a`.

Product recovery anchors remain the existing `safety/pre-autonomous-agents-20260910-*` refs and verified frozen releases. Never move any safety ref.