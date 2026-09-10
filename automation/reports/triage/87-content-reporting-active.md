# A5 Firewall Triage — #87 Content reporting

Generated: 2026-09-11 03:03 JST
Agent: `BQ-A5-FIREWALL`

## Exact state
- Canonical: `feature/v3-content-reporting` @ `17071432a815ef5cf53f5f4538df982285114bd0`.
- Candidate: no `agent/a1-work/087-content-reporting` ref found.
- Frozen base: `release/v3.59-accessibility-support` @ `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- Durable handoff identifies exact functional candidate `72ef635a5322e715c293de489bf37a170f05729d`; targeted run `34509850415` and complete accumulated functional run `34510669714` are green for that functional SHA only.
- Exact bookkeeping verifier run `34511515241` completed **SUCCESS** for canonical bookkeeping SHA `17071432...` through an isolated verifier.
- `release/v3.60-content-reporting`: not found at final inspection.
- Writer lease observed: FREE.

## Primary evidence verified
**FACT:** #87 remains bounded to report submission, validation and explicit success/error behavior; moderation/reviewer workflow remains later scope.

**FACT:** Current `src/core/api.js` still submits directly from the browser through `client.from('bible_content_reports').insert(row)`.

**FACT:** Current `20260905_content_review_and_reports.sql` grants authenticated INSERT on `bible_content_reports`. INSERT RLS requires only reporter identity equal to `auth.uid()` and congregation membership. The insertable row contains `status`, `reviewed_by`, and `reviewed_at`; that policy does not constrain those fields.

**FACT:** No dedicated `agent/a1-work/087-content-reporting` ref exists.

**FACT:** A2 (`fe2e773...`), A3 (`19bd25d...`) and A4 (`2d9341a...`) reports are SHA-stale for current canonical `17071432...`. A4 is NOT READY. No current exact-candidate A4 READY or current A3 satisfaction exists.

**FACT:** Run `34511515241` is valid exact bookkeeping regression evidence for `17071432...`, but successful regression execution cannot substitute for the required HIGH-RISK trust-boundary and same-candidate independent review gates.

## Classification
### BLOCKER
1. **Unclosed report INSERT authority boundary.** Counterfactual: if ignored, an authenticated congregation member can bypass UI payload shaping and attempt an INSERT containing privileged initial review state because the database boundary does not restrict `status`, `reviewed_by`, or `reviewed_at`. This crosses the #88/#91 trust boundary.
2. **HIGH-RISK exact-candidate review/provenance barrier not satisfied.** Counterfactual: if current bookkeeping is promoted/frozen without an authorized exact candidate plus same-SHA A3 satisfaction and A4 READY, a HIGH-RISK authorization change can ship without the mandatory independent barrier. A green bookkeeping run cannot substitute for that review.

### MILESTONE
1. Keep #87 limited to submission/validation/success-error behavior.
2. Make reporter identity and moderation state backend-authoritative without broadening unrelated grants or moderation scope.
3. Add faithful negative security regressions for forged review state, reporter identity and cross-congregation submission while retaining all accumulated coverage.
4. Reconcile onto an authorized `agent/a1-work/087-content-reporting` exact candidate and rerun the complete functional gate.
5. Require fresh exact-candidate A3 satisfaction, A4 READY and A5 recommendation before bookkeeping/promotion; then separately require exact bookkeeping-SHA complete green after any changed bookkeeping transaction.

### DEFER
#88 moderation policy/decisions and #91 reviewer workbench/admin workflow beyond the minimum backend authority needed for safe #87 submission.

### IGNORE
- PASS transfer from `72ef635...` or `17071432...` to any changed SHA.
- Stale investigator conclusions as standalone proof.
- Corrected bookkeeping heading defects as evidence that the security boundary is safe.

## Firewall decision
**2 BLOCKER; 5 MILESTONE; NO PROMOTION / NO v3.60 FREEZE RECOMMENDATION.**

## Report freshness
A2 is stale from `fe2e773...`; A3 is stale from `19bd25d...`; A4 is stale from `2d9341a...`. The A3 authorization concern was independently reverified against current primary migration/API evidence. This report becomes stale on canonical/work/frozen/release movement, security-path/schema/RLS/API/test/workflow change, or fresh A3/A4 exact-candidate review.

## Next safe action
Close the current INSERT-authority defect with faithful permanent tests, reconcile the work into the required quarantine candidate lifecycle, obtain complete exact functional green, then obtain fresh same-SHA A3/A4 HIGH-RISK review and A5 promotion approval before any bookkeeping/release freeze.