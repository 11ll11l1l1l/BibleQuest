# A2 Contract Audit — #75 Assignment Push Workflow

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-10 JST

## STATE / PROVENANCE
- Active milestone: **#75 Assignment Push Workflow**.
- Canonical `feature/v3-assignment-push`: `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Current quarantine/bookkeeping candidate `agent/a1-work/075-assignment-push`: `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Frozen base `release/v3.47-advanced-assignments`: `2523f85d47f59721eae81da10cf1007d29af4139`.
- Prior exact functional candidate: `a42100452d1b1fff7c146543e8ab5cd67da32193`, complete accumulated run `34444825916` green.
- Failed bookkeeping runs inspected: `34449669830` and `34449808528`.
- Current exact candidate verification observed: run `34450088492`, explicitly targeting `e725e5dee5a46fcaebf05200301efdb93f868b22`; it was still in progress at report write, so no PASS is claimed.

## EVIDENCE INSPECTED — PRIMARY
Before reading TRIAGE, A2 independently inspected:
- live canonical, quarantine and frozen refs;
- `FEATURE_INVENTORY_V3.md`, `ASSIGNMENT_PUSH_V3.md`, `DEVELOPMENT_HANDOFF_V3.md` and `DEVELOPMENT_STATUS_V3.md` on the live bookkeeping line;
- retained/frozen `assignment-advanced.js`;
- verified assignment ownership/trust boundary represented by `src/app/assignments.js`, `src/core/api.js`, `src/features/assignments/index.js`, and `supabase/functions/bq-assignment/index.ts`;
- accumulated `scripts/validate-v3-assignments.mjs` before and after the current correction;
- exact workflow evidence for bookkeeping runs `34449669830`, `34449808528`, and current run `34450088492`.

`automation/TRIAGE.md` was read only after provisional findings were formed.

## FACT — REQUIRED PARITY
Authoritative row #75 remains narrowly **leader publish → eligible member receive → existing #73/#74 complete**. Required audiences remain `all`, `member`, `team`, and `group`; trusted server authorization remains authoritative; successful create reloads server truth; #76 Ministry Hub, #77 Notification Center/push delivery, #78 Workspace and #79 linked-activity execution remain outside #75.

The current bookkeeping ledger represents #74 as `Regression-tested` and #75 as `Verified`; #76 and later dependency rows remain `Not started`. These are bookkeeping values until an exact final bookkeeping SHA passes the complete gate and applicable review.

## FACT — RETAINED / OWNER CONTRACT
Frozen retained `assignment-advanced.js` proves compatibility support for existing assignment creation plus group target, schedule/reminder/recurrence/reflection/quiz/evidence metadata. Recurrence is metadata only; linked activity is retained evidence for later #79 and is not a #75 requirement.

Verified v3 ownership remains:
- `src/app/assignments.js` — sole assignment application owner;
- `src/core/api.js` — sole browser trusted-function/Realtime boundary;
- `src/features/assignments/index.js` — presentation/event forwarding;
- Session/Congregation Membership — signed-in identity, selected congregation and fail-closed local capability inputs;
- `supabase/functions/bq-assignment/index.ts` — trusted target discovery/create/response authority.

No primary evidence justifies a second assignment owner, broader Journey Group RLS, direct browser assignment DML, notification delivery, recurrence generation, Workspace, Ministry Hub aggregation, or linked-activity execution inside #75.

## FACT — BOOKKEEPING FAILURES AND ROOT CAUSE
Run `34449669830` failed the accumulated architecture phase because bookkeeping renamed validator-required `DEVELOPMENT_STATUS_V3.md` heading `Next major milestone`. The document was corrected without weakening that validator.

Run `34449808528` explicitly checked out/asserted exact candidate `e960f5904d1353352e1c94a1c816156d899b3eff`. Its architecture run reached `scripts/validate-v3-assignments.mjs` and failed only because that older accumulated validator hard-coded inventory #75 to remain `Not started`.

Primary source confirms that assertion was a future-state guard from #73, not a permanent requirement: the same validator already allowed #74 lifecycle movement while reserving future rows, and #75 is now the active functionally verified milestone. Current correction changes only #75 from `must be Not started` to `must be a valid lifecycle state`, while retaining the #73 owner assertions and keeping #79 strictly `Not started`.

A2 classifies this as **FACT: stale accumulated-validator future-state assertion**, not a retained-contract or product defect. Because an existing accumulated validator changed, the repository guardrails independently make the resulting candidate HIGH-RISK for exact-SHA review; A2 does not waive that requirement.

## FACT — CURRENT EXACT CANDIDATE
Live candidate at the final pre-write recheck is `e725e5dee5a46fcaebf05200301efdb93f868b22`. Its validator correction preserves the original semantic protection that future linked-activity row #79 cannot be promoted early, while permitting active row #75 to occupy `Not started|Implemented|Verified|Regression-tested` as appropriate.

Current Actions run `34450088492` was observed in progress and explicitly configured to verify the exact current candidate. Therefore A2 records **MISSING EVIDENCE: final conclusion of run `34450088492`** and does not transfer PASS from `a4210045...` or either failed bookkeeping SHA.

## FACT / INFERENCE / RECOMMENDATION
### FACT
- Canonical remains `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`.
- Current candidate is `e725e5dee5a46fcaebf05200301efdb93f868b22`.
- Frozen base remains `2523f85d47f59721eae81da10cf1007d29af4139`.
- #75 functional contract evidence remains complete on ancestor `a4210045...`.
- Two bookkeeping candidates failed exact architecture validation; neither failure established a #75 product behavior defect.
- The current existing-test correction is contract-consistent: #75 may now advance lifecycle while #79 remains deferred.

### INFERENCE
- No new product behavior is needed to resolve the two observed bookkeeping failures.
- If the current exact candidate passes the complete accumulated gate, the remaining question is review/promotion procedure caused by the existing accumulated-validator modification, not retained-contract recovery.

### RECOMMENDATION
- Do not alter product behavior in response to either bookkeeping failure.
- Preserve the narrow validator correction: allow active #75 lifecycle state; keep #79 `Not started`; retain all #73 assignment ownership assertions.
- Require the complete exact-SHA result for `e725e5de...` before any PASS claim.
- Because an existing accumulated validator changed, follow the current HIGH-RISK exact-candidate A4/A5 review requirement before canonical/release promotion.

## AMBIGUITIES / BLOCKERS
A2 finds **no unresolved retained-contract ambiguity and no primary-evidence product contract blocker** for #75.

The currently unresolved gate is verification/review evidence, not contract definition: exact candidate `e725e5de...` had no completed full-gate result at report write.

## MISSING EVIDENCE
- Final status and executed phase results for run `34450088492`.
- Fresh exact-candidate A4/A5 review if `e725e5de...` remains the candidate and the run finishes green.
- Exact canonical/release state after any later A1 promotion; canonical and frozen refs had not advanced at this report write.
- Production Supabase/Cloudflare/v2 were intentionally neither modified nor tested by A2.

## CONCRETE ACCEPTANCE CHECKLIST
- [x] #75 retained contract remains bounded to publish → receive → existing complete.
- [x] Ministry/trusted-server authority and `all/member/team/group` audiences remain the recovered contract.
- [x] Existing assignment/API/server ownership remains the required composition.
- [x] Later #76/#77/#78/#79 behavior remains outside #75.
- [x] Functional ancestor `a4210045...` has exact complete accumulated green evidence.
- [x] First bookkeeping heading failure identified as bookkeeping-document/validator mismatch, not product failure.
- [x] Second bookkeeping failure identified as stale #73 future-state assertion for row #75.
- [x] Current validator correction preserves #73 ownership assertions and #79 deferral rather than weakening accumulated assignment semantics.
- [ ] Exact complete accumulated green result for current candidate `e725e5de...`.
- [ ] Fresh exact-SHA review/promotion evidence required because an existing accumulated validator changed.

## DEPENDENCY-LIKELY NEXT MILESTONES
A2 does not expand implementation scope while #75 remains unclosed. Inventory establishes the nearest boundaries only: #76 Ministry Hub owns `open tools; role guard; navigation`; #77 Notification Center/inbox owns `load; read/unread; open target; refresh`; #79 owns linked-activity launch/completion handoff. These require independent recovery when active.

## TRIAGE RECONCILIATION
TRIAGE was correct for functional candidate `a42100452d...` but is now stale for candidate-specific authorization because the quarantine branch moved through bookkeeping and then an existing accumulated-validator correction to `e725e5dee5a46fcaebf05200301efdb93f868b22`. Its functional scope conclusion remains consistent with primary evidence; its promotion recommendation cannot transfer to the changed exact SHA.

## STALENESS CONDITIONS
This report becomes stale for candidate-specific conclusions if:
- `agent/a1-work/075-assignment-push` moves from `e725e5dee5a46fcaebf05200301efdb93f868b22`;
- canonical moves from `606fa7adfd0ebf8ba1277aa4a89931f5db77a53c`;
- frozen base changes from `2523f85d47f59721eae81da10cf1007d29af4139`;
- run `34450088492` finishes or is superseded by another exact-candidate run;
- authoritative #75 contract/inventory changes.

Reinspect primary evidence before using this report against any changed state.