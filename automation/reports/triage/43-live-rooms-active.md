# A5 Firewall / Triage — #43 Live Rooms gate

Agent: `BQ-A5-FIREWALL`
Generated: 2026-09-11 08:00 JST

## Exact state

- Active canonical: `feature/v3-live-rooms` @ `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`.
- Current `agent/a1-work/043-*` candidate: **none found**.
- Latest frozen release: `release/v3.66-same-room-play-together` @ the same exact `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`.
- #43 canonical currently equals the frozen release, so no #43 product delta exists yet.
- Writer lease was FREE during inspection.

## Primary evidence verified before investigator conclusions

FACT:
- `MASTER_CONTROL.md`, `AGENT_GUARDRAILS.md`, `A5_FIREWALL_TRIAGE.md`, `CURRENT.md`, `WRITE_LEASE.md`, and `SCHEDULE_AND_LOCKING.md` were read first from `automation/v3-agent-control`.
- Live refs show v3.66 frozen at `4a5f4b428...` and `feature/v3-live-rooms` created at that same SHA; no `agent/a1-work/043-*` ref exists.
- `FEATURE_INVENTORY_V3.md` at `4a5f4b428...` records #42 Same-room Play Together as `Verified` and #43 Live Rooms as `Not started` with contract `create/join/leave; reconnect; no stale room state`.
- Durable handoff at `4a5f4b428...` records #42 functional SHA `22d054725...`, functional run `34539110697`, and requires fresh bookkeeping verification before v3.66 freeze.
- Live release/run evidence supersedes that pre-freeze handoff: `release/v3.66-same-room-play-together` now exists at `4a5f4b428...` and run `34539753714` completed SUCCESS with `head_sha=4a5f4b428...`.
- Job `103079496124` for run `34539753714` completed accumulated architecture, edge/security and browser/mobile regression phases successfully; none of those phases was skipped.
- `.github/workflows/v3-regression.yml` at `4a5f4b428...` is `workflow_dispatch`-only and contains the #42 validator, edge test and smoke test together with prior accumulated entries.
- Frozen-to-current #42 comparison modifies the workflow only by adding the current milestone invocations to the three accumulated loop lines; no current evidence of deleted or bypassed prior coverage was found.

## #42 report judgment

FACT:
- A2 #42 is stale because it analyzed canonical `3d0d3591...` before permanent #42 tests/workflow wiring existed.
- A3 #42 is stale for the same reason and SHA.
- A4 #42 analyzed exact functional SHA `22d054725...` and recorded a meaningful product QA PASS with run `34539110697`. That report is stale for bookkeeping SHA `4a5f4b428...`, but its earlier PASS is not transferred.
- The current bookkeeping SHA has its own exact complete run `34539753714`, so #42 does not require an additional A4 cycle merely because it is NORMAL-RISK and bookkeeping changed the SHA.

CLASSIFICATION: **IGNORE** any attempt to create a new #42 blocker solely from missing A4 review at `4a5f4b428...`. Counterfactual check: the NORMAL-RISK rule explicitly allows same-run bookkeeping/promotion once exact gates are satisfied and no current blockers remain; requiring an extra A4 bookkeeping cycle would add latency without proving a new acceptance/regression failure.

## Persistent #93 evidence debt

FACT:
- `supabase/functions/bq-admin-ops/index.ts` at frozen v3.64 `56fe2469...` authenticates bearer JWT with `auth.getUser`, derives active platform Owner/Admin authority from `bible_app_access`, and restricts `delete_user` to Owner with self-delete, active-owner and ownership guards before Auth deletion.
- `tests/v3-admin-operations-edge.mjs` at that exact SHA injects a mocked client API; it does not execute the production handler/trusted boundary.
- Current v3.66 accumulated workflow still invokes that client-mock test and no faithful #93 production-handler authorization test is present in the accumulated list.
- A3 and A4 #93 reports are exact to frozen v3.64 SHA `56fe2469...` and both concluded NOT READY because faithful trusted-boundary evidence and compliant quarantine lineage were missing. Those conclusions were checked against the primary handler/test evidence; agreement itself was not used as proof.

CLASSIFICATION: **BLOCKER**. Counterfactual: if later milestones proceed without closing this evidence gap, regressions in JWT/platform-role/Owner-only destructive-account authorization can remain undetected while the accumulated client-mock suite remains green.

## Persistent #94 governance debt

FACT:
- Comparing frozen v3.64 `56fe2469...` to frozen v3.65 `ab358490...` shows #94 changed existing accumulated `scripts/validate-v3-admin-operations.mjs` in addition to adding #94 implementation/tests/workflow invocation.
- Control policy automatically classifies modification of an existing accumulated validator/test as HIGH-RISK and requires reproduced root cause plus exact-candidate A4/A5 review before promotion.
- Exact #94 bookkeeping run `34535332838` was successful for the asserted bookkeeping SHA, but no `agent/a1-work/094-*` candidate and no A4 #94 READY report exist.

CLASSIFICATION: **BLOCKER**. Counterfactual: accepting this bypass as harmless would make the mandatory review rule non-enforcing for future existing-regression changes, allowing a coverage weakening to be presented as a fixture/lifecycle correction without the required independent barrier.

## #43 risk / pre-write gate

FACT:
- Current #43 canonical equals frozen v3.66 and has no implementation delta.
- The authoritative inventory requires create/join/leave, reconnect and no stale room state.
- Retained `live-rooms.js` uses authenticated congregation membership, direct shared-session/participant/room-response data operations, Realtime subscriptions, `bq-room-poll`, and trusted `bq-score` scoring.

INFERENCE supported by those primary boundaries:
- Reconstructing #43 necessarily enters authorization, shared persistence, Realtime/subscription lifecycle and trusted-server authority; under control policy it must be treated HIGH-RISK before the first product write unless fresh primary evidence proves a narrower design that does not cross those boundaries.

CLASSIFICATION: **MILESTONE** before implementation. A2/A3 must recover the exact current contract/trust boundary, and A1 must create `agent/a1-work/043-*` only after existing BLOCKERs are cleared. Permanent evidence must cover create/join/leave authorization, reconnect, subscription teardown and stale-room cleanup, and must not treat browser role/state as security authority.

## Firewall result

- BLOCKER: 2.
- MILESTONE: preserve exact v3.66; corrective #93 closure; corrective #94 closure; #43 current contract/security/quarantine preparation.
- DEFER: #43 product implementation/promotion and later milestones while current blockers remain.
- IGNORE: stale #42 absence-of-tests findings and any demand for an extra NORMAL-RISK A4 bookkeeping cycle at `4a5f4b428...`.

Decision: **DO NOT WRITE #43 PRODUCT YET.** Keep frozen v3.64-v3.66 immutable. Close #93/#94 corrective review debt; A2/A3 may perform read-only #43 recovery in parallel.

## Staleness

This report is stale immediately if `feature/v3-live-rooms` moves from `4a5f4b428d637dc5552bcd8a66d99d9c669ae4db`, an `agent/a1-work/043-*` candidate appears/moves, latest frozen release changes, #43 current A2/A3/A4 evidence appears, #93 trusted-boundary tests/authorized lineage change, #94 review evidence changes, or exact workflow evidence is superseded.
