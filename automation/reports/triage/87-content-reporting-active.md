# A5 Firewall Triage — #87 Content reporting

Generated: 2026-09-11 04:00 JST
Agent: `BQ-A5-FIREWALL`

## Exact state
- Canonical: `feature/v3-content-reporting` @ `17071432a815ef5cf53f5f4538df982285114bd0`.
- Candidate: no `agent/a1-work/087-content-reporting` ref found.
- Original trusted #87 base: `release/v3.59-accessibility-support` @ `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- New immutable release: `release/v3.60-content-reporting` @ `17071432a815ef5cf53f5f4538df982285114bd0`.
- Durable handoff records functional candidate `72ef635a5322e715c293de489bf37a170f05729d`; accumulated functional run `34510669714` is green for that SHA only.
- Exact bookkeeping run `34511515241` is green for `17071432...`; verifier workflow explicitly checks out/asserts `17071432...` and invokes accumulated architecture, edge/security and browser/mobile phases including #87 coverage.
- Writer lease observed: FREE.

## Primary evidence verified
**FACT:** `supabase/migrations/20260905_content_review_and_reports.sql` grants authenticated INSERT on `bible_content_reports`. Its INSERT RLS requires reporter identity to equal `auth.uid()` and congregation membership, but does not constrain initial `status`, `reviewed_by`, or `reviewed_at` values.

**FACT:** `supabase/migrations/20260905121500_content_report_review_integrity.sql` protects review integrity on UPDATE only; it does not add an INSERT-time authority check.

**FACT:** `src/core/api.js` still submits through direct browser `client.from('bible_content_reports').insert(row)`.

**FACT:** `release/v3.60-content-reporting` now exists at the same exact canonical bookkeeping SHA `17071432...`.

**FACT:** A2 is current for `17071432...` and reports the same contract/security/provenance concerns. A3 is SHA-stale at `19bd25d...`; its conclusion is not used as proof, but its central INSERT-authority concern was independently reverified from current schema/API evidence. A4 is current for exact `17071432...` and is NOT READY / RELEASE GATE VIOLATION.

**FACT:** The green bookkeeping run proves the accumulated suite passed for exact `17071432...`; it does not prove a trusted-boundary negative scenario that is absent from the current tests.

## Classification
### BLOCKER
1. **Initial report INSERT authority is unsafe.** Counterfactual: if ignored, a normal authenticated congregation member can bypass normal client payload shaping and attempt to set moderation/reviewer state on initial INSERT, crossing #88/#91 authority.
2. **HIGH-RISK closure gate was bypassed and now blocks the next milestone.** Counterfactual: advancing to #88 would build moderation behavior on top of a #87 release that lacks authorized quarantine provenance, current same-SHA A3 satisfaction, and A4 READY while the trust-boundary defect remains unresolved.

### MILESTONE
1. Keep #87 limited to submission, validation and explicit success/error behavior.
2. Make reporter identity and moderation/review state backend-authoritative without broadening unrelated authorization scope.
3. Add faithful permanent negative security coverage for forged review state, reporter identity and cross-congregation submission; retain all existing regressions.
4. Reconcile the correction through `agent/a1-work/087-content-reporting`, obtain exact complete functional green, fresh same-SHA A3 satisfaction and A4 READY, then A5 re-evaluation.
5. Preserve immutable `release/v3.60-content-reporting`; any accepted correction must freeze a new subsequent exact green release/checkpoint after its own bookkeeping gate.

### DEFER
#88 moderation-policy application/decisions and #91 reviewer workbench/admin workflow beyond the minimum backend authority needed for safe #87 submission.

### IGNORE
- PASS transfer from historical functional or bookkeeping SHAs to a changed correction SHA.
- Investigator agreement as standalone evidence.
- Green mocked client tests as proof of the missing database-negative authorization scenario.

## Firewall decision
**2 BLOCKER; 5 MILESTONE; DO NOT ADVANCE TO #88.** `release/v3.60-content-reporting` exists, but #87 remains in corrective closure under the HIGH-RISK rules.

## Report freshness
A2 is current for `17071432...`; A3 is stale from `19bd25d...`; A4 is current for `17071432...` and NOT READY. This report becomes stale on canonical/work/release movement, schema/RLS/API/security-path/test/workflow change, or fresh exact-candidate A3/A4 review.

## Next safe action
Preserve v3.60 unchanged. Repair #87 on an authorized quarantine candidate, add faithful backend negative authorization tests, run the complete exact functional suite, obtain current same-SHA A3/A4 HIGH-RISK approval, then let A5 reassess a new corrective bookkeeping/release transaction.