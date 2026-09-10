# A2 Contract Investigation — #91 Content Review workbench

Agent: `BQ-A2-CONTRACT`
Disposition: **CONTRACT SATISFIED AT RELEASED SHA; SEPARATE HIGH-RISK GOVERNANCE/SECURITY EVIDENCE REMAINS OPEN**

## Exact state inspected

- **Canonical:** `feature/v3-content-review` @ `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c` at final refresh.
- **A1 quarantine candidate:** `agent/a1-work/091-content-review` — **not found** in live refs inspected.
- **Frozen base entering #91:** `release/v3.61-content-moderation` @ `dfbbb690c814a514714967f240262eec39b6e3ee`.
- **Current immutable release:** `release/v3.62-content-review` @ `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`.
- **Exact bookkeeping/accumulated run:** `34523117239` = SUCCESS. Its isolated verifier explicitly checked out and asserted product SHA `b4a8826f549ec28193a0e1e4f7d71befe3e0a24c`, then completed the accumulated architecture, edge/security and browser/mobile phases.
- **Earlier exact functional candidate:** `68516bdbdb651dd144270bd5bc615909967130a8`; durable handoff records targeted green `34522099170` and complete accumulated functional green `34522265269` for that SHA only.
- This report is stale immediately if canonical/release/corrective-candidate refs move, #91 inventory/contract/owners/schema/tests/workflow change, or newer exact execution/provenance evidence appears.

## Primary evidence and FACT findings

### Authoritative contract and bookkeeping

**FACT:** `FEATURE_INVENTORY_V3.md` at exact released SHA `b4a8826f...` marks #91 **Verified** with the authoritative contract:

`open review item; decision; save; permissions`

**FACT:** #92 Admin console and #93 Admin operations remain separate **Not started** rows. Their contracts are respectively `auth guard; read/admin actions; permission denial` and `operational actions; role guard; error recovery`. They must not be absorbed into #91.

**FACT:** The exact bookkeeping verifier for run `34523117239` asserted the #91 Verified inventory state and executed against exact product SHA `b4a8826f...` rather than transferring PASS from the earlier functional SHA.

### Current verified owners and #91 implementation boundary

**FACT:** The durable #91 handoff at the released SHA records these owners/boundaries: Session is the authenticated-user owner; Congregation Membership is the membership/role projection owner; `src/core/api.js` is the browser Supabase implementation boundary; Recall owns bundled quarantine files; `src/app/content-review.js` owns reviewer eligibility projection, congregation selection, queue state, decision validation/snapshots/save orchestration/error state; Router owns route/history.

**FACT:** The same handoff keeps #91 narrow: congregation reviewers are `leader`, `pastor`, or `admin`; active platform `owner`/`admin` may review; database RLS is final authority; valid decisions are exactly `include`, `exempt`, `remove`; rationale is optional and bounded to 1,200 characters; broader Admin Console/Admin Operations/reset/recovery/schema deployment/bulk moderation/content editing/production deployment are excluded.

**FACT:** Primary SQL in `supabase/migrations/20260905_content_review_and_reports.sql` implements the reviewer permission boundary through `private.bible_can_review_content(target_congregation)`: active platform `owner|admin` OR active congregation `leader|pastor|admin`. Decision INSERT/UPDATE policies additionally require `reviewed_by = auth.uid()`. These rules substantiate the inventory's #91 `permissions` element; they do not expand the contract into #92/#93.

### Permanent accumulated verification

**FACT:** `.github/workflows/v3-regression.yml` at v3.62 remains `workflow_dispatch` only and invokes `scripts/validate-v3-content-review.mjs`, `tests/v3-content-review-edge.mjs`, and `tests/v3-content-review-smoke.mjs` in the architecture, edge/security, and browser/mobile phases.

**FACT:** Direct comparison with the v3.61 workflow shows the v3.62 lists retain the previously accumulated validators/tests and add the #91 entries. No prior suite deletion or skip was observed in this comparison.

**FACT:** Run `34523117239` checked out exact `b4a8826f...`; its logs show the Content Review architecture validator passed, the Content Review role/queue/write edge regression passed, the Content Review browser/mobile regression passed, and the surrounding accumulated phases completed successfully.

**FACT:** `tests/v3-content-review-edge.mjs` uses a substituted/mock API to exercise service behavior. Therefore this test is evidence for application contract orchestration but is not, by itself, execution of live PostgreSQL RLS/grants. That limitation is recorded as evidence scope, not promoted here into a new parity requirement beyond `permissions`.

### Retained / v2 provenance

**FACT:** The authoritative inventory classifies #91 as `Standalone old`.

**FACT:** The previously attempted direct retained path `_retained/reference-only/deploy-package-2025-09-24_17-12-09/js/content-review.js` was not present. In this refresh, exact v3.62 tree/root inspection likewise did not identify a retained/legacy directory containing a standalone Content Review implementation.

**MISSING EVIDENCE:** exact retained/v2 Content Review implementation provenance remains unidentified. A2 therefore does not elevate current-v3 convenience behavior into mandatory parity unless it is supported by the authoritative inventory or another recovered primary old-source artifact.

## Contract assessment

**FACT:** At exact released SHA `b4a8826f...`, the authoritative ledger says #91 Verified, current v3 owners implement the narrow workbench boundary, reviewer permissions are represented in primary SQL, the permanent accumulated workflow contains the #91 validator/edge/browser tests without observed prior-suite weakening, and exact run `34523117239` executed those accumulated phases successfully.

**INFERENCE:** On the evidence A2 is responsible for, the four-part #91 contract — `open review item; decision; save; permissions` — is satisfied at `b4a8826f...`. There is no primary contract evidence requiring #92 Admin Console or #93 Admin Operations behavior to be pulled back into #91.

**FACT:** No `agent/a1-work/091-content-review` quarantine candidate was found, and exact retained/v2 source provenance remains missing. These are provenance/governance evidence gaps. They do not justify inventing additional parity behavior.

**RECOMMENDATION:** Keep immutable `release/v3.62-content-review` unchanged. If the HIGH-RISK control process requires corrective closure for candidate provenance or faithful trusted-boundary testing, perform that as a narrowly scoped corrective lineage without broadening #91's feature contract. Do not begin #92 while the current firewall explicitly defers it.

## Next dependency boundaries

**#92 Admin console — FACT:** authoritative state is **Not started** with contract `auth guard; read/admin actions; permission denial`. No live `feature/v3-admin-console` branch was found during the primary ref inspection. Its retained standalone-old source must be recovered before implementation; #93 operational actions are not automatically part of #92.

**#93 Admin operations — FACT:** authoritative state is **Not started** with contract `operational actions; role guard; error recovery`. It remains a separate dependency and was not expanded into a design specification in this investigation.

## TRIAGE comparison — read only after independent findings

After the independent evidence above was formed, `automation/TRIAGE.md` was read. It is current for canonical/release `b4a8826f...` and classifies #91 corrective closure as HIGH-RISK, citing missing quarantine provenance/exact-candidate independent review and faithful trusted-boundary authorization regression evidence. A2 does not treat that conclusion as primary proof; the underlying release refs, SQL, workflow, test scope and run evidence were independently inspected above.

The TRIAGE restriction `DO NOT ADVANCE TO #92` is compatible with this report: A2 finds the narrow product parity contract represented at the released SHA while separately recognizing that the autonomous HIGH-RISK governance/security gate remains open. Contract satisfaction is not a substitute for A3/A4/A5 authorization to advance.