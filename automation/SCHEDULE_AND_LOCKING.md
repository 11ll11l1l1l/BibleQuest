# Autonomous schedule and interference control

## Hourly cycle
- A2 Contract Investigator: :28 JST
- A3 Architecture/Security: :38
- A4 QA/Regression: :48
- A5 Firewall/Triage: :58
- A1 Release Captain: :08

The rolling order is A2 -> A3 -> A4 -> A5 -> A1. Investigators prepare independent evidence, A5 filters it, and A1 writes only from current exact state.

## Productive utilization
Do not optimize for commits/reports. Use execution time on the active exact state.

- A2: active contract first, then at most next two likely dependencies.
- A3: active architecture/security first, especially HIGH-RISK trust boundaries, then at most next two.
- A4: exact candidate audit first; otherwise active acceptance, then at most next two.
- A5: exact-state reconciliation and concise TRIAGE; no manufactured work.
- A1: one canonical milestone at a time, but as many safe implementation/test/gate steps as the run permits.

## Writer serialization
`automation/WRITE_LEASE.md` serializes A1 product/canonical writes.

- Acquire by conditional update of exact lease blob SHA with unique nonce/milestone/base/work branch.
- Re-check same nonce before every product/test/workflow/canonical/release write.
- A conflict means yield.
- Normal exit releases FREE.
- Lease expiry is only a takeover threshold; expired work must be reconciled before takeover.
- Manual development should pause A1 or use a separate manual branch without concurrent promotion.

## Quarantine branch
A1 implementation lives under `agent/a1-work/<milestone-id>-<slug>`, never directly on the canonical milestone branch.

Active #75 work branch: `agent/a1-work/075-assignment-push` from canonical SHA `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.

The older `agent/a1/m75-assignment-push-work` is non-canonical and must not receive new work.

## Risk-aware review timing
HIGH-RISK work waits for exact-candidate A4 review plus A5 promotion recommendation after functional green and before bookkeeping/promotion. This includes auth/RLS/trusted-server/migration/global-owner/dependency/workflow changes.

NORMAL-RISK bounded work does not wait an extra cycle solely for exact-candidate review. If contract is complete, no current BLOCKER/MILESTONE remains, and exact functional plus bookkeeping gates are green, A1 may promote in the same run. A4/A5 audit it on the next cycle; a genuine regression blocks the next milestone.

This keeps independent review where a weak writer is most dangerous without forcing an hourly latency tax on every bounded UI/local milestone.

## Freshness
Every report states exact canonical HEAD, work-candidate SHA when present, frozen base and staleness conditions. TRIAGE states the exact state it covers.

Investigators perform primary-evidence analysis before reading TRIAGE to reduce correlated/anchored mistakes. Stale candidate-specific reports cannot block or authorize current work.

## Verification interference
Do not launch duplicate required runs for same candidate while one is active. Cancelled, partial, timed-out, skipped or unexecuted phases are not green.

Temporary `push:` triggers belong only on isolated `verify/` branches and must explicitly checkout/assert intended clean SHA. Trigger commits are never candidates, canonical tips, releases or safety refs.

## No cross-role writes
- A1: work/canonical/release state, CURRENT and WRITE_LEASE.
- A2: contract reports.
- A3: architecture reports.
- A4: QA reports.
- A5: TRIAGE/triage reports.

## Recovery
If autonomous work becomes unsafe:
1. disable all five agents;
2. inspect lease, current work branch and exact run evidence;
3. compare against latest frozen release and safety refs;
4. discard/supersede unverified work branches rather than rewriting verified history;
5. resume from a fresh exact known-good checkpoint.

Safety refs and frozen releases never move to hide mistakes.