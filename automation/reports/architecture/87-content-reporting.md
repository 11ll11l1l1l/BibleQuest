# A3 Architecture/Security — #87 Content reporting

Agent: BQ-A3-ARCH-SECURITY  
Disposition: **HIGH-RISK PRE-IMPLEMENTATION — TRUST BOUNDARY DEFINED; NOT READY**

## Exact state

- Canonical milestone branch: `feature/v3-content-reporting`
- Canonical SHA at inspection: `5594f9802e40b25c6df9b6331668c0bbfcedacc7`
- Autonomous candidate `agent/a1-work/087-*`: **none found**
- Latest live frozen release: `release/v3.59-accessibility-support`
- Frozen SHA: `5594f9802e40b25c6df9b6331668c0bbfcedacc7`
- Therefore #87 canonical is currently byte-identical to the frozen v3.59 base and contains no #87 product delta.
- Baseline bookkeeping verifier: Actions run `34503099868`, **success**. Its verifier branch asserted the exact v3.59 bookkeeping candidate and passed inventory, accumulated architecture, edge/security, and browser/mobile phases. This is baseline evidence only; it is **not** #87 acceptance evidence.

## Authoritative milestone boundary

**FACT:** `FEATURE_INVENTORY_V3.md` row 87 is `Content reporting`, source class `Compatibility`, status `Not started`, bounded contract: `submit report; validation; success/error`.

**FACT:** Durable handoff says #87 remains Not started until v3.59 freezes, requires read-only recovery of retained reporting behavior and backend/RLS contracts first, and must use a single report-submission owner without bundling #88 moderation/admin review into #87.

**FACT:** The live `release/v3.59-accessibility-support` ref now exists at `5594f980...`; therefore the handoff sentence naming v3.58 as the latest frozen baseline is stale, while its #87 scope guidance remains materially consistent with the live inventory.

## Current backend/security evidence

**FACT:** Current `supabase/schema.sql` has no #87 reporting table, reporting RLS policy, reporting grant, or reporting trusted function/RPC in the inspected frozen/canonical baseline. Existing backend design already distinguishes browser-writable user-owned state from trusted-only authority; e.g. score events and earned badges deliberately have no browser write policy.

**FACT:** The current schema uses RLS plus explicit grants, with authenticated identity derived through `auth.uid()` in user-owned policies, and uses a narrowly scoped `SECURITY DEFINER` membership helper with restricted EXECUTE where recursive authorization requires it.

**FACT:** No `agent/a1-work/087-*` candidate exists, so there is no new schema/migration/RLS/grant/API implementation or exact candidate test/run evidence to audit yet.

## Risk classification

**INFERENCE:** #87 is **HIGH-RISK** once implementation begins because `submit report` necessarily crosses a client-to-backend write boundary and feeds a later moderation surface (#88/#91). A permissive client-owned report row can become an authority-escalation or privacy leak if the browser can choose reporter identity, moderation state, internal fields, or read/update reports outside the minimum submission contract.

The HIGH-RISK classification is about the required trust boundary, not a finding of a defect in the current SHA; #87 has not been implemented at this SHA.

## Safe trust boundary

**RECOMMENDATION:** Keep #87 as one narrow submission owner. The client may choose only contract-level submission input: the report target/reference, an allowed reason/category, and any bounded user-supplied explanatory text that retained behavior actually requires. Do not invent extra report metadata merely because a table can store it.

**RECOMMENDATION:** Reporter identity must be derived from authenticated server/database context (`auth.uid()` or equivalent trusted context), never accepted as an authoritative client-supplied user ID.

**RECOMMENDATION:** Validation that affects stored authority must be enforced at the backend boundary as well as in UI. At minimum, accepted target shape/type, allowed reason values, text bounds, required fields, and immutable/default moderation fields must be constrained server-side/database-side. Browser validation alone is presentation, not authorization.

**RECOMMENDATION:** Ordinary authenticated reporters must not gain authority to set or mutate moderation status, resolution, reviewer/moderator identity, internal notes, trust/safety flags, or other #88/#91 administrative fields. They also must not receive broad SELECT/UPDATE/DELETE access to other users' reports merely to make submission convenient.

**RECOMMENDATION:** Prefer the least privileged server path that can enforce the recovered contract. Direct table INSERT is acceptable only if column privileges/RLS `WITH CHECK`/constraints and server defaults make all authoritative fields non-client-controlled and prevent cross-user visibility/mutation. If those guarantees cannot be expressed safely and testably, use a narrow trusted RPC/Edge/server submission path. Do **not** introduce `SECURITY DEFINER` merely as convenience; if used, pin search_path, validate all inputs, derive identity internally, minimize grants, and expose only the submission operation.

**RECOMMENDATION:** Do not broaden existing grants or RLS on profiles, congregation membership, questions/content, moderation/admin, or other unrelated tables for #87. #88 Content moderation and #91 Content Review workbench remain separate authority owners.

## Required evidence before A3 satisfaction

1. Exact `agent/a1-work/087-*` candidate SHA and compare against frozen `5594f980...`.
2. Recovered retained/v2 reporting behavior sufficient to prove the actual target/reason/message contract without inventing parity.
3. Exact schema/migration, RLS, grants, constraints and any trusted RPC/Edge/server implementation for report submission.
4. Evidence that unauthenticated submission fails unless retained contract explicitly permits it; authenticated identity cannot be forged; authoritative moderation/admin fields cannot be set by the reporter; other users' reports cannot be read/updated/deleted through the reporter path.
5. Permanent negative security tests for direct-backend bypass, not only UI validation; plus functional success/error validation for the bounded #87 contract.
6. Permanent accumulated workflow invocation of those tests without weakening/removing prior coverage.
7. Complete accumulated green run on that exact candidate SHA. No PASS may transfer from v3.59 or from any changed SHA.

## Missing evidence / limitations

**FACT:** No #87 implementation/candidate exists yet, so no current failure can be asserted beyond absence of the required implementation evidence.

**FACT:** Repository-level inspection established the current v3 schema and inventory boundary. Production Supabase was intentionally not inspected or modified under A3 product-read-only rules; any future candidate that depends on deployed-policy state requires exact non-mutating evidence through the authorized verification path.

**FACT:** Retained/v2 detailed reporting source behavior was not established strongly enough in this run to add fields, reason enums, target types, duplicate/rate semantics, or moderator workflow requirements. Those remain missing evidence and must not be guessed.

## TRIAGE comparison — read only after provisional A3 findings

**FACT:** `automation/TRIAGE.md` is materially stale. It still identifies #85 at `19cde1f...` / frozen v3.57 as active and blocks its promotion. Live repository evidence has progressed through #85, verified #86, frozen v3.59, and active pre-implementation #87 at `5594f980...`. TRIAGE was not used as primary evidence for this report.

## Staleness conditions

This report becomes candidate-specific stale immediately if `feature/v3-content-reporting`, any `agent/a1-work/087-*`, or the latest frozen release moves; if #87 product/schema/RLS/grant/RPC/Edge/tests/workflow change; if retained reporting behavior is recovered with materially different requirements; or if new exact workflow evidence appears. Re-run A3 against the exact new SHA before treating trust-boundary satisfaction or readiness as current.
