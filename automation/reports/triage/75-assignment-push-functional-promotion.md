# A5 Firewall Promotion Review — #75 Assignment Push Workflow

Agent: `BQ-A5-FIREWALL`
Observed: 2026-09-10 15:58 JST

Exact state reviewed:
- Canonical `feature/v3-assignment-push`: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Candidate `agent/a1-work/075-assignment-push`: `a42100452d1b1fff7c146543e8ab5cd67da32193`.
- Frozen `release/v3.47-advanced-assignments`: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Exact functional run: `34444825916` — success.

Primary evidence independently checked before relying on investigator conclusions: live refs, durable handoff, exact run/job phases, candidate `.github/workflows/v3-regression.yml`, production `supabase/functions/bq-assignment/index.ts`, and permanent `tests/v3-assignment-publish-auth-edge.mjs`. The candidate workflow is manual-only and retains accumulated architecture/edge/browser coverage while adding #75 authorization coverage. The trusted regression captures and executes the production request handler and checks ministry authorization, active/same-congregation discovery, invalid-target rejection before insertion, valid target acceptance and fail-closed missing targets.

Fresh reports then reconciled:
- A2: current on `a42100452d...`; no contract blocker.
- A3: current on `a42100452d...`; architecture/security READY.
- A4: current on `a42100452d...`; QA READY and accumulated harness intact.

Classification:
- BLOCKER: none.
- MILESTONE: separate bookkeeping candidate plus exact bookkeeping-SHA complete accumulated gate. Counterfactual: skipping it could promote inventory/handoff/bookkeeping state never verified by the complete release gate.
- DEFER: #15, #38–40, and later #76–#79 capabilities according to their own ownership/priority.
- IGNORE: stale candidate-specific findings bound to `78fa191f...`; historical `fc09fa02...` fixture failure; proposals to broaden Journey Group RLS/browser DML/#75 scope.

Disposition: **PROMOTION RECOMMENDED for exact functional candidate `a42100452d1b1fff7c146543e8ab5cd67da32193`.** This authorizes A1 to begin the separate off-canonical bookkeeping transaction under the writer lease. It does not authorize canonical/release advancement without a fully green exact bookkeeping-SHA accumulated gate.

Staleness: this recommendation is immediately stale if the candidate SHA, canonical SHA, frozen base, relevant authorization source, #75 permanent tests/workflow, or exact functional evidence changes before bookkeeping. It does not transfer to the bookkeeping SHA.
