# BibleQuest v3 autonomous guardrails

These rules harden the five-agent system against weaker autonomous reasoning while preserving fast hourly throughput. They supplement `MASTER_CONTROL.md`; live repository state and executed exact-SHA evidence remain authoritative.

## 1. Evidence before interpretation

Repository state, exact commit ancestry, retained source, executable tests, workflow run results, schema/RLS/server contracts and frozen releases are primary evidence. Another agent's report, chat handoff or prior conclusion is advisory only.

No agent may turn another agent's recommendation directly into code without re-checking the underlying repository evidence.

## 2. Anti-anchoring / independent investigators

A2-A4 must inspect the live repository and form provisional findings before reading current TRIAGE. They must not use another investigator's conclusion as evidence.

A1 must inspect the live canonical/work branches, frozen release and durable handoff before using TRIAGE as an action filter.

A5 compares independently produced findings against primary evidence. Agreement between agents is not itself proof.

## 3. Writer lease

A1 is the only autonomous product/release writer and must hold `automation/WRITE_LEASE.md` before product, test, workflow, canonical branch, bookkeeping, handoff or release writes.

Lease acquisition uses the exact current lease-file blob SHA and a unique run nonce. A failed conditional update means another writer won and A1 must yield. A1 re-checks the lease before every later product/canonical write. Expired leases require reconciliation before takeover.

Manual/normal-chat development should pause A1 first. If it does not, it must not write to A1's work/canonical branches concurrently.

## 4. Quarantine implementation branch

Unverified autonomous implementation must never land directly on the canonical milestone branch.

For each milestone A1:
1. records the exact canonical milestone HEAD and latest frozen release SHA;
2. creates/resumes one isolated branch under `agent/a1-work/<milestone-id>-<slug>` from the reconciled canonical milestone HEAD;
3. performs implementation, tests and corrections only there;
4. runs the complete functional gate against the exact clean work-branch candidate SHA;
5. prepares bookkeeping off-canonical;
6. runs the complete accumulated gate against the exact bookkeeping SHA;
7. fast-forwards the canonical milestone branch only to an exact state authorized by the review rules below;
8. never force-updates canonical or safety refs.

For active #75 the designated work branch is `agent/a1-work/075-assignment-push`, created from canonical `feature/v3-assignment-push` SHA `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.

The earlier `agent/a1/m75-assignment-push-work` branch is non-canonical and must not be used for new autonomous writes.

## 5. Risk tier

Classify the milestone before the first product write.

### HIGH-RISK
Any change touching one or more of:
- auth/session identity, sign-in, recovery or account switching;
- authorization, RLS, grants, cross-user/cross-congregation visibility;
- Edge Functions, trusted RPCs or other server authority;
- schema migrations or persistent-data transformations;
- production/deployment configuration;
- global router/shell/runtime ownership;
- package/dependency or GitHub workflow changes;
- replacing an already verified owner or introducing a second owner;
- broad persistence/synchronization semantics across multiple verified features.

Before first HIGH-RISK product write, A1 requires a current A3 architecture/security report for the active milestone/frozen base and no current A5 BLOCKER. After the exact functional candidate is green, that exact candidate must receive a fresh A4 review and A5 promotion recommendation before bookkeeping/promotion.

### NORMAL-RISK
A bounded change that stays inside already verified owners, does not alter a trust boundary, and has adequate executable regression coverage.

A1 may complete functional gate -> bookkeeping -> exact bookkeeping gate -> promotion in the same execution window without waiting for a later A4/A5 exact-candidate cycle, provided:
- the milestone contract and acceptance criteria were already recovered;
- no current A5 BLOCKER/MILESTONE remains unresolved;
- required permanent tests exist and the complete exact gates actually pass;
- no HIGH-RISK condition appears during implementation.

A4/A5 may audit the promoted NORMAL-RISK milestone on the following cycle. A newly discovered real regression stops the next milestone and is repaired from the latest frozen/canonical state using rebuild-and-verify.

#75 is HIGH-RISK because its retained implementation requires trusted server/authorization scope for publishing targets.

## 6. Pre-write transaction check

Immediately before product writes A1 must know and record:
- milestone ID and exact requirement being implemented;
- risk tier and why;
- latest frozen base SHA;
- canonical milestone HEAD;
- isolated work-branch HEAD;
- expected files/owners to change;
- owners/files that must not change;
- permanent tests that will prove the behavior.

Re-read remote branch and lease state immediately before the write. Unexpected movement requires reconciliation, never overwrite.

## 7. Scope containment

Only change files required by the current recovered contract, its permanent tests and bookkeeping/docs. No later inventory row, opportunistic cleanup, cosmetic redesign, mass formatting or unrelated refactor.

If the fix unexpectedly requires a second verified owner, global shell, dependency, workflow, migration or unrelated feature, reclassify risk/scope before continuing. Do not quietly expand the milestone.

Do not rename/delete verified modules or revive retired compatibility implementations as parallel owners unless the current contract explicitly requires a verified replacement.

## 8. Test integrity

Passing tests count only when they could realistically fail for the missing behavior or defect being claimed.

- New tests must assert observable behavior, state, authorization, data flow or ownership relevant to the contract.
- Source-string checks alone are not sufficient proof of runtime behavior when executable coverage is feasible.
- Never weaken, delete, skip, narrow or bypass an existing regression simply to get green.
- A changed existing test requires an explicit `TEST/FIXTURE DEFECT` explanation and must preserve the semantic assertion it was intended to enforce.
- Product failures are fixed in product code; do not reclassify them as fixtures without evidence.
- Security/scope behavior requires faithful server/trusted-boundary evidence; a browser mock returning success is not proof of authorization.
- No pass transfers across SHAs.

## 9. Candidate invariants

Before functional gate A1 verifies:
- candidate descends from the intended canonical/frozen base;
- no merge from `main` or unrelated feature branch;
- no unexpected owner/workflow/dependency changes;
- required milestone validator/edge/browser coverage exists;
- accumulated prior tests remain present;
- no production deployment/change occurred.

Functional green and bookkeeping green are separate transactions. A changed SHA requires its own exact evidence.

A release ref may be created only at the exact green bookkeeping SHA. Existing release refs are immutable; never move one to repair a mistake.

## 10. Report provenance and freshness

Every A2-A4 report records milestone, canonical branch/HEAD, work candidate SHA when present, frozen base SHA, date/time, primary evidence inspected, FACT vs INFERENCE/RECOMMENDATION, missing evidence and staleness conditions.

Candidate-specific claims become stale when candidate HEAD changes. Contract facts independent of implementation may remain usable only when explicitly identified as such.

A5 TRIAGE always states the exact canonical/candidate/frozen SHAs it covers and source-report freshness. Stale candidate-specific TRIAGE cannot block or authorize promotion.

## 11. Firewall threshold

A5 may classify BLOCKER/MILESTONE only when it can identify primary evidence and the direct counterfactual: what concrete acceptance, security, data-integrity, ownership or regression failure happens if A1 does not address it now.

Severe-sounding but unverified claims are not blockers. Put them in DEFER/IGNORE or mark them unconfirmed.

## 12. Speed discipline

Safety is not a reason for idle cycles. Once current primary evidence and the risk-tier requirements are satisfied, A1 should implement, test, correct and continue within the same execution window.

A2-A4 investigate the active milestone first and at most the next two likely milestones. A5 keeps TRIAGE short. No agent creates work merely to appear productive.

## 13. Recovery

Control-plane recovery anchor before hardening: `safety/pre-agent-control-hardening-20260910` at `d2de4cf57be4e9ab6b7476698b7ca77e8aca526a`.

Product recovery uses verified frozen releases and existing `safety/pre-autonomous-agents-20260910-*` refs. Never move a safety or frozen release ref.