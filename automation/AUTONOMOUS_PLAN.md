# BibleQuest autonomous completion plan

This summarizes the five-agent operating plan. `MASTER_CONTROL.md`, `AGENT_GUARDRAILS.md`, role files, live repository state and executed exact-SHA evidence take precedence.

## Objectives
1. Preserve rollback points and immutable verified releases.
2. Continue without repeated manual `continue` messages.
3. Keep weaker autonomous reasoning away from canonical code until exact gates pass.
4. Serialize autonomous product writes through one writer lease.
5. Use independent investigators as evidence checks rather than parallel implementers.
6. Avoid unnecessary review latency for bounded low-risk milestones.
7. Reach 100/100 parity and 100/100 regression stability using rebuild-and-verify.

## Recovery baseline
Immutable refs include:
- `safety/pre-autonomous-agents-20260910-canonical` -> `fceb115e763ae729e07325bbb4c9f592206b2c9e`
- `safety/pre-autonomous-agents-20260910-advanced` -> `f01df3e72b5413bba7ae7d16552fca55a448b766`
- `safety/pre-agent-control-hardening-20260910` -> `d2de4cf57be4e9ab6b7476698b7ca77e8aca526a`

Recovery creates a new branch from a known-good checkpoint; never rewrite safety/frozen refs.

## Five roles
- A1 Release Captain — sole autonomous implementation/release writer.
- A2 Contract — independent retained behavior/parity investigator.
- A3 Architecture/Security — independent trust-boundary/ownership investigator.
- A4 QA — independent exact evidence/test reviewer.
- A5 Firewall — independent triage/noise/promotion filter.

## Hourly pipeline
A2 :28 -> A3 :38 -> A4 :48 -> A5 :58 -> A1 :08 JST.

A2-A4 perform primary-evidence analysis before consulting TRIAGE so multiple agents do not merely repeat the same anchored conclusion.

## Current position at hardening
At this revision the latest frozen release is v3.47 Advanced Assignments, strict parity 74/100 and regression stability 73/100. #75 Assignment Push contract recovery is complete and application implementation has not begun on the canonical branch. Always re-read live state because these numbers will become stale.

Canonical #75 branch at hardening: `feature/v3-assignment-push` @ `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.

Designated autonomous #75 work branch: `agent/a1-work/075-assignment-push`, created from that exact canonical SHA. The older `agent/a1/m75-assignment-push-work` branch is non-canonical and unused going forward.

## Milestone algorithm
For one milestone at a time:
1. reconcile canonical branch with latest frozen release;
2. recover authoritative contract and dependencies;
3. classify milestone NORMAL-RISK or HIGH-RISK;
4. acquire writer lease;
5. create/resume isolated `agent/a1-work/...` branch;
6. implement only current milestone using existing verified owners;
7. add permanent architecture/edge/browser-mobile coverage;
8. run targeted checks and complete exact functional gate;
9. if HIGH-RISK, require exact-candidate A4 review and A5 promotion recommendation;
10. prepare bookkeeping off-canonical;
11. run complete exact bookkeeping-SHA gate;
12. fast-forward canonical branch only to the authorized exact green SHA;
13. freeze next release at exactly the same SHA;
14. update CURRENT/release lease and move to next dependency-safe milestone.

Failed work branches are disposable; verified canonical/frozen history is not.

## Risk-aware review
HIGH-RISK covers auth/session, authorization/RLS/grants, trusted Edge/RPC/server authority, schema/data migration, production/deployment config, global shell/router ownership, dependencies/workflows, verified-owner replacement, or broad persistence/sync behavior.

HIGH-RISK candidate promotion waits for A4 exact-candidate review and A5 fresh promotion recommendation. #75 is HIGH-RISK.

NORMAL-RISK bounded changes may pass functional -> bookkeeping -> exact bookkeeping -> promotion in the same A1 run when contract/tests are complete and no current BLOCKER/MILESTONE remains. A4/A5 audit the result on the following cycle; a genuine regression halts the next milestone.

## Investigator pipeline
A2-A4 prioritize active state, then at most the next two likely milestones. Reports carry exact canonical/candidate/frozen SHAs, primary evidence, FACT vs INFERENCE/RECOMMENDATION, missing evidence and staleness conditions.

A5 verifies reports against current primary evidence. Only fresh, concrete BLOCKER/MILESTONE items may interrupt A1.

## Failure/recovery
Ordinary test failures remain in the current milestone and are root-caused. Do not weaken tests or patch around failures.

Legitimate yield conditions include lost lease, missing permissions/credentials, destructive production requirement, irreconcilable authoritative ambiguity, unreconcilable manual branch movement or unavailable required verification.

If autonomous work is unsafe: disable agents, inspect lease/work branches/runs, compare with latest frozen/safety refs, discard unverified work, resume from known-good state.

## Completion
Complete only when the authoritative inventory is 100/100 Regression-tested, strict parity and regression stability are both 100/100, all required accumulated suites pass against the exact final bookkeeping SHA, final v3 release is frozen at that SHA, and production remains untouched until separately authorized.