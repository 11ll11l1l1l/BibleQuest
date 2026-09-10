# BibleQuest v3 autonomous guardrails

These rules harden the five-agent system against weaker autonomous reasoning while preserving fast hourly throughput. They supplement `MASTER_CONTROL.md`; live repository state and executed exact-SHA evidence remain authoritative.

## 1. Evidence before interpretation
Repository state, exact commit ancestry, retained source, executable tests, workflow run results, schema/RLS/server contracts and frozen releases are primary evidence. Another agent's report, chat handoff or prior conclusion is advisory only. No agent may turn another agent's recommendation directly into code without re-checking the underlying evidence.

## 2. Anti-anchoring / independent investigators
A2-A4 inspect the live repository and form provisional findings before reading current TRIAGE. They do not use another investigator's conclusion as evidence. A1 inspects live canonical/work branches, frozen release and durable handoff before using TRIAGE as an action filter. A5 compares independent findings against primary evidence; agreement is not proof.

## 3. Writer lease
A1 is the only autonomous product/release writer and must hold `automation/WRITE_LEASE.md` before product, test, workflow, canonical branch, bookkeeping, handoff or release writes. Acquisition uses the exact current lease-file blob SHA and a unique run nonce. A failed conditional update means another writer won. A1 re-checks the lease before every later write. Expired leases require reconciliation before takeover. Manual development should pause A1 first.

## 4. Quarantine implementation branch
Unverified autonomous implementation never lands directly on the canonical milestone branch. A1 creates/resumes one branch under `agent/a1-work/<milestone-id>-<slug>`, implements/tests there, runs the exact functional gate, prepares bookkeeping off-canonical, runs the exact bookkeeping gate, and only then fast-forwards canonical state when review requirements are satisfied. Never force-update canonical/safety/release refs.

Active #75 work branch: `agent/a1-work/075-assignment-push`, created from canonical `feature/v3-assignment-push` SHA `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.

The older `agent/a1/m75-assignment-push-work` branch is non-canonical and must not receive new autonomous writes.

## 5. Risk tier
Classify before first product write.

HIGH-RISK includes auth/session, authorization/RLS/grants, Edge Functions/trusted RPC/server authority, schema/data migrations, production/deployment configuration, global router/shell ownership, package/dependency/workflow changes, replacement of a verified owner, or broad cross-feature persistence/synchronization semantics.

Before first HIGH-RISK write, A1 requires a current A3 report for the active milestone/frozen base and no A5 BLOCKER. After exact functional green, that exact candidate requires fresh A4 review plus A5 promotion recommendation before bookkeeping/promotion.

NORMAL-RISK is bounded work inside already verified owners with no trust-boundary change. A1 may complete functional -> bookkeeping -> exact bookkeeping -> promotion in the same execution window when contract/tests are complete and no unresolved current BLOCKER/MILESTONE exists. A4/A5 audit it on the next cycle. If implementation enters a HIGH-RISK area, reclassify before continuing.

#75 is HIGH-RISK because it requires trusted server/authorization scope for publishing targets.

## 6. Pre-write transaction check
Before product writes A1 records/verifies: milestone requirement, risk tier/reason, frozen base SHA, canonical HEAD, work-branch HEAD, expected files/owners to change, owners/files that must not change, and permanent tests that will prove the behavior. Re-read remote branch and lease immediately before writing. Unexpected movement requires reconciliation, never overwrite.

## 7. Scope containment
Only change files required by the current contract, permanent tests and bookkeeping. No later inventory rows, opportunistic cleanup, cosmetic redesign, mass formatting or unrelated refactor. If a fix unexpectedly requires another verified owner, global shell, dependency/workflow, migration or unrelated feature, prove the dependency and reclassify before continuing. Do not revive retired compatibility implementations as parallel owners.

## 8. Test integrity
Passing tests count only when they could realistically fail for the claimed missing behavior.
- New tests assert observable behavior, state, authorization, data flow or ownership.
- Source-string checks alone are not sufficient runtime proof when executable coverage is feasible.
- Never weaken/delete/skip/narrow existing regressions to obtain green.
- Existing-test changes require a documented `TEST/FIXTURE DEFECT` reason and preservation of the original semantic assertion.
- Security/scope behavior requires faithful server/trusted-boundary evidence; a browser mock returning success is not proof of authorization.
- No pass transfers across SHAs.

## 9. Candidate invariants
Before functional gate verify candidate ancestry, no unrelated/main merge, no unexpected owner/workflow/dependency changes, required milestone validator/edge/browser coverage exists, accumulated prior tests remain present, and no production deployment/change occurred. Functional and bookkeeping green are separate transactions. Release refs may be created only at the exact green bookkeeping SHA and are immutable afterward.

## 10. Report provenance/freshness
A2-A4 reports record milestone, canonical branch/HEAD, work candidate SHA, frozen base, date/time, primary evidence, FACT vs INFERENCE/RECOMMENDATION, missing evidence and staleness conditions. Candidate-specific claims stale when candidate HEAD changes. A5 TRIAGE always states exact canonical/candidate/frozen SHAs and source-report freshness.

## 11. Firewall threshold
A5 uses BLOCKER/MILESTONE only with primary evidence and the direct counterfactual: what concrete acceptance, security, data-integrity, ownership or regression failure happens if A1 ignores it now. Severe-sounding unverified claims are not blockers.

## 12. Speed discipline
Safety must not become idle bureaucracy. Once current evidence and risk-tier requirements are satisfied, A1 implements/tests/corrects/continues in the same execution window. A2-A4 cover active milestone first and at most next two likely milestones. A5 keeps TRIAGE short.

## 13. Recovery
Control-plane recovery anchor before hardening: `safety/pre-agent-control-hardening-20260910` at `d2de4cf57be4e9ab6b7476698b7ca77e8aca526a`. Product recovery uses verified frozen releases and existing `safety/pre-autonomous-agents-20260910-*` refs. Never move a safety or frozen release ref.