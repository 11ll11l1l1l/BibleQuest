# A5 Firewall / Triage — #94 Reset/recovery

Agent: `BQ-A5-FIREWALL`
Observed: 2026-09-11 06:58 JST

## Exact state
- Canonical: `feature/v3-reset-recovery` @ `3f3d6decbb1b3a236c4cbbea3301637f9dfd1c55`.
- Dedicated A1 candidate: none found under `agent/a1-work/094-*`.
- Frozen base: `release/v3.64-admin-operations` @ `56fe2469f9c27e925b92afa9b07d7c12998bb7b7`.
- Exact #94 functional SHA: `b3c15b34da0958a136920dc970b24531e3e06e45`; durable handoff records run `34534183203` success.
- Current #94 bookkeeping SHA: `3f3d6decbb1b3a236c4cbbea3301637f9dfd1c55`.
- Exact bookkeeping run `34535009560`: failure.

## Primary evidence verified
**FACT** — Current v3.64 release ref exists and equals `56fe2469...`.

**FACT** — `feature/v3-reset-recovery` is 12 commits ahead of v3.64 and includes the #94 page/service/rendering files, validator, edge test, smoke test and accumulated workflow wiring.

**FACT** — Current permanent `.github/workflows/v3-regression.yml` remains `workflow_dispatch`-only and invokes `validate-v3-reset-recovery.mjs`, `v3-reset-recovery-edge.mjs`, and `v3-reset-recovery-smoke.mjs` while retaining the prior accumulated lists.

**FACT** — Run `34535009560` explicitly checked out/asserted `3f3d6dec...`, passed bookkeeping-value assertions, then failed accumulated architecture. Edge/security and browser/mobile phases were skipped.

**FACT** — Job logs identify the failure exactly: `validate-v3-admin-operations.mjs` emitted `capability #93 must not absorb #94 reset/recovery`.

**FACT** — The #93 validator at current SHA still requires inventory row #94 to be exactly `Not started`. This is a lifecycle pin, not evidence that #93 product code absorbed #94.

**FACT** — Master control states that modifying any existing accumulated validator automatically makes the correction HIGH-RISK and requires reproduced root cause plus exact-candidate A4/A5 review before promotion.

**FACT** — Frozen v3.64 was created at `56fe2469...` even though exact-state A3 and A4 reports for #93 both remained NOT READY. They identified absent `agent/a1-work/093-*` provenance and missing faithful trusted-boundary coverage.

**FACT** — Independent primary inspection of `tests/v3-admin-operations-edge.mjs` confirms it injects a mocked `api` object and therefore does not execute `supabase/functions/bq-admin-ops` authorization/destructive-account enforcement.

## Investigator freshness
- A2 #94 report is stale: it predates frozen v3.64 and any #94 canonical/candidate.
- A3 #94 report is stale for the same reason.
- No A4 #94 report exists at inspection time.
- A3/A4 #93 reports are exact to frozen SHA `56fe2469...`; both are current for the released #93 code/evidence and both conclude NOT READY.

## Classification
**BLOCKER 1 — Current #94 bookkeeping gate is red.**
Counterfactual: ignoring run `34535009560` and freezing v3.65 would promote a SHA for which architecture failed and every later required phase was skipped.

**BLOCKER 2 — #93 HIGH-RISK promotion debt remains unresolved after v3.64 freeze.**
Counterfactual: continuing through #94/#42 without corrective closure accepts destructive-account authorization without faithful executable trust-boundary proof and bypasses the mandatory exact-candidate independent review rule.

**MILESTONE 1 — Correct the reproduced stale #93 lifecycle assertion only.** Preserve the actual #93/#94 ownership-separation assertion; do not weaken/remove the validator.

**MILESTONE 2 — Because an existing accumulated validator must change, treat the correction cycle as HIGH-RISK and use an authorized quarantine candidate with exact A4/A5 review before promotion.**

**MILESTONE 3 — Execute a complete exact functional gate on the final corrected candidate and a separate complete exact bookkeeping gate.**

**MILESTONE 4 — Resolve #93 trust-boundary review debt on an authorized corrective lineage without moving/reusing the immutable v3.64 release ref.**

**DEFER — #42 Same-room Play Together and later rows until these gates close.**

**IGNORE — Interpreting the current #94 failure as proof of a reset/recovery runtime defect; the failing primary evidence is a stale prior lifecycle assertion.**

## Firewall disposition
**2 BLOCKER; 4 MILESTONE; DO NOT FREEZE v3.65 OR ADVANCE TO #42.**

## Staleness
This report becomes stale if canonical `feature/v3-reset-recovery`, an `agent/a1-work/094-*` candidate, frozen release lineage, the #93/#94 validators/tests/workflow, or exact workflow evidence changes.
