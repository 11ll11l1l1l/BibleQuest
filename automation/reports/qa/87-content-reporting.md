# A4 QA — #87 Content Reporting

Agent: `BQ-A4-QA`
Generated: 2026-09-11 JST
Disposition: **NOT READY / RELEASE GATE VIOLATION — v3.60 exists despite unresolved HIGH-RISK acceptance**

## STATE / PROVENANCE
- Active/reviewed milestone: **#87 Content Reporting**.
- Canonical: `feature/v3-content-reporting` @ `17071432a815ef5cf53f5f4538df982285114bd0`.
- Dedicated `agent/a1-work/087-*` candidate: **none found**.
- Previous frozen base: `release/v3.59-accessibility-support` @ `5594f9802e40b25c6df9b6331668c0bbfcedacc7`.
- New frozen ref found during this audit: `release/v3.60-content-reporting` @ `17071432a815ef5cf53f5f4538df982285114bd0`.
- Recorded functional candidate: `72ef635a5322e715c293de489bf37a170f05729d`.
- Exact functional accumulated run `34510669714`: **SUCCESS** for `72ef635a...` only. Verifier wrapper `c9d8c071...` explicitly checked out/asserted that SHA and all architecture, edge/security, and browser/mobile phases completed successfully.
- Exact bookkeeping run `34511515241`: **SUCCESS** for `17071432...` only. Verifier wrapper `6a21e8a4...` explicitly checked out/asserted `17071432...`; all accumulated phases completed successfully.
- No PASS transfers between those SHAs.

## Primary evidence / FACT
1. Authoritative inventory at `17071432...` records #87 **Verified**, with required verification `submit report; validation; success/error`; #88 moderation and #91 review remain separate.
2. `CONTENT_REPORTING_V3.md` records #87 as functionally verified at `72ef635a...` and identifies direct browser submission through `src/core/api.js` to `bible_content_reports`.
3. Permanent `.github/workflows/v3-regression.yml` remains `workflow_dispatch`-only and explicitly invokes `validate-v3-content-reporting.mjs`, `v3-content-reporting-edge.mjs`, and `v3-content-reporting-smoke.mjs` while retaining prior accumulated architecture, edge/security, and browser/mobile coverage. No unexplained removal, bypass, rename-away, or timeout weakening was observed.
4. `tests/v3-content-reporting-edge.mjs` covers service validation, authentication, membership loss, reason/content bounds, repeated valid reports, exact payload preservation, backend error propagation, and success ID handling; submission is mocked.
5. `tests/v3-content-reporting-smoke.mjs` covers 390x844 touch/mobile behavior, signed-out recovery, Reader/Transform exclusions, success/error/retry UI, privacy-safe snapshotting, and horizontal overflow; submission is mocked.
6. Primary schema evidence in `supabase/migrations/20260905_content_review_and_reports.sql` grants authenticated INSERT on `bible_content_reports`. INSERT RLS checks `reporter_id = auth.uid()` plus congregation membership, but the insertable row also includes `status`, `reviewed_by`, and `reviewed_at`, with no INSERT-time restriction on those authority fields.
7. The later review-integrity migration protects UPDATE semantics only; it does not constrain initial INSERT authority fields.
8. Therefore the existing #87 permanent tests do not provide faithful trusted-boundary negative evidence that an ordinary member cannot forge initial moderation/reviewer state. Client mocks are insufficient for that HIGH-RISK authorization claim.
9. `release/v3.60-content-reporting` now exists at `17071432...`. This is exact green bookkeeping state, but the control rules require HIGH-RISK exact-candidate A4 review and A5 promotion recommendation after functional green and before bookkeeping/promotion.
10. No `agent/a1-work/087-*` branch exists, so A4 cannot identify an authorized quarantine candidate corresponding to the HIGH-RISK functional review transaction.

## Acceptance matrix
- #87 submit/validation/success-error user flow: **PASS evidence at functional SHA `72ef635a...` and bookkeeping SHA `17071432...` through complete accumulated runs**.
- Signed-out/current-membership failure: **covered**.
- 390px touch/mobile, retry and privacy exclusions: **covered and executed in green accumulated runs**.
- Permanent accumulated regression retention: **PASS**; no weakening found.
- #88/#91 scope separation: **structurally preserved**.
- Faithful real database authorization negatives for forged `status` / `reviewed_by` / `reviewed_at`: **MISSING / NOT SATISFIED**.
- Authorized quarantine provenance `agent/a1-work/087-*`: **MISSING**.
- Required HIGH-RISK exact-candidate A4 READY before promotion: **NOT SATISFIED**.
- Current v3.60 release gate: **NOT ACCEPTABLE despite green bookkeeping**, because green regression execution does not substitute for the missing trust-boundary evidence/review gate.

## FAILURES / MISSING EVIDENCE
1. No faithful backend/RLS negative test proves a normal authenticated congregation member cannot forge initial review/moderation state on report INSERT.
2. No dedicated `agent/a1-work/087-*` exact candidate exists for the mandatory HIGH-RISK review lifecycle.
3. No prior A4 READY review exists for exact functional candidate `72ef635a...`; the earlier A4 report was NOT READY and bound to another SHA.
4. The new immutable release ref `release/v3.60-content-reporting` was created before these HIGH-RISK requirements were satisfied.

## TRIAGE comparison
TRIAGE was read only after independent primary-evidence findings. Its current security/provenance concerns match the primary evidence, but its statement that `release/v3.60-content-reporting` was not found is now stale: the release ref exists at exact `17071432...`.

## FACT vs INFERENCE / RECOMMENDATION
FACT: exact canonical/frozen/release refs, branch absence, inventory/contract state, test/workflow contents, run IDs/results, exact verifier checkout assertions, schema/RLS fields and INSERT policy are directly inspected evidence.

INFERENCE: source inspection shows an unconstrained initial INSERT authority surface for moderation fields; executable trusted-boundary testing is still required to prove actual exploitability/denial behavior in the deployed database contract.

RECOMMENDATION: **Do not treat v3.60 as an acceptable HIGH-RISK completion checkpoint and do not advance to #88.** Reconcile #87 through an authorized quarantine candidate, make moderation/reviewer fields backend-authoritative, add faithful negative authorization regressions, obtain a complete exact functional green, then require fresh A3 trust-boundary satisfaction, A4 READY and A5 promotion recommendation for that same exact candidate. Any corrected bookkeeping SHA must receive its own complete exact accumulated gate. Existing frozen refs must not be moved or rewritten; recovery should use a new corrected release/checkpoint per control rules.

## Staleness conditions
This report becomes stale if canonical HEAD, any `agent/a1-work/087-*` branch, release refs, reporting schema/RLS/grants/API path, #87 tests/workflow, exact run evidence, or current A3/A5 security/promotion state changes.