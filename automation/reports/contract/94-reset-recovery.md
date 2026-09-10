# A2 Contract Report — #94 Reset/recovery page

Agent: `BQ-A2-CONTRACT`
Observed: 2026-09-11 JST
Status: **PRELIMINARY / NEXT-MILESTONE RECOVERY ONLY — DO NOT IMPLEMENT BEFORE #93 v3.64 FREEZE**

## STATE / PROVENANCE

- Current active canonical remains #93: `feature/v3-admin-operations` @ `2e93349e686242e2a48d6ca0ee1a60ade8ca85d7`.
- Current #93 bookkeeping branch observed: `work/v3.64-admin-operations-bookkeeping-20260911` @ `8bcc780d1e903e04f3bae07a5576778b7adf08c2`.
- Latest frozen release: `release/v3.63-admin-console` @ `8a759218edbd1c7f9f71591a9e6aa6cca70dc465`.
- `release/v3.64-admin-operations` was not present at inspection time.
- #94 has no active canonical/candidate established in this inspection.
- This report is stale when v3.64 freezes, a #94 canonical/candidate appears, retained reset source changes, or authoritative inventory/ownership evidence changes.

## EVIDENCE INSPECTED

Primary evidence:

1. Authoritative `FEATURE_INVENTORY_V3.md` at #93 bookkeeping SHA `8bcc780d...`.
2. Durable `DEVELOPMENT_HANDOFF_V3.md` on #93 canonical.
3. Retained standalone `reset.html` at exact #93 functional SHA `2e93349e...`.
4. Retained standalone `reset.js` at `2e93349e...`.
5. Existing trusted recovery backend `supabase/functions/bq-password-reset/index.ts` at `2e93349e...`.
6. Existing inventory row #9 `Recovery code/password recovery`, already `Regression-tested`.

## AUTHORITATIVE CONTRACT

**FACT** — Inventory row #94 is `Reset/recovery page`, old-version capability `Yes`, v2 availability `Standalone old`, v3 status `Not started`, required verification `reset path; cancellation; invalid state`.

**FACT** — Inventory row #9 separately defines `Recovery code/password recovery`, already `Regression-tested`, with verification `recover; rotate code; invalid code; session after reset`.

**FACT** — Retained `reset.html` is titled `BibleQuest · Account recovery` and presents registered email, recovery code, new password and confirm-password fields plus a Back-to-BibleQuest action.

**FACT** — Retained `reset.js` sends `{action:'reset', email, recovery_code, new_password, confirm_password}` to `bq-password-reset`, validates password length/match, disables during submission, renders safe errors, and on success requires the user to acknowledge saving the newly rotated recovery code before returning to BibleQuest.

**FACT** — Existing `bq-password-reset` is the trusted server owner for reset/issue operations, including origin checks, rate limiting, recovery-code hashing/comparison, failed-attempt lockout, one-time claim, password update and fresh recovery-code rotation.

## MATERIAL CONTRACT AMBIGUITY

**FACT** — The authoritative inventory treats #9 password/recovery-code recovery and #94 Reset/recovery page as two separate capabilities.

**FACT** — The directly retained standalone #94-looking artifact (`reset.html` + `reset.js`) is itself a password/recovery-code reset UI and therefore overlaps the already verified #9 capability.

**INFERENCE** — #94 is most likely the retained standalone *page/surface and its navigation/state behavior*, while #9 owns the underlying recovery capability/service semantics. This is strongly suggested by the inventory split but is not yet proven by a dedicated #94 milestone contract or historical commit provenance.

**RECOMMENDATION** — Do not duplicate or replace the verified #9 recovery owner. Before implementation, A1/A2 should recover the exact historical boundary for why #94 exists separately and define #94 as the smallest page-level parity contract consistent with that evidence.

## MINIMUM EVIDENCE-SUPPORTED PAGE BEHAVIOR

Subject to the ownership ambiguity above, retained page evidence supports these page-level behaviors:

- standalone recovery route/surface loads without requiring an existing authenticated session;
- user can enter email, recovery code, new password and confirmation;
- password length and mismatch invalid states fail before network submission;
- backend invalid/rejected reset state is rendered safely and allows correction/retry;
- in-flight submission disables the submit control and visibly indicates resetting;
- successful reset displays the newly rotated recovery code;
- user must acknowledge saving the new recovery code before the finish/return control is enabled;
- explicit Back-to-BibleQuest navigation exists before submission;
- missing cloud configuration renders an unavailable state instead of attempting reset.

## EXPLICITLY OUT OF SCOPE UNTIL BOUNDARY IS PROVEN

- Reimplementing `bq-password-reset` server semantics already owned by verified recovery capability #9.
- Creating a second password/recovery-code state owner.
- #100 Backup/export/import/reset device-data semantics.
- Admin account deletion (#93).
- Production deployment/schema changes.
- Invented email-verification or recovery paths not present in retained evidence.

## MISSING EVIDENCE

- **MISSING EVIDENCE** — No dedicated `RESET_RECOVERY_V3.md` or equivalent #94 contract was present at the inspected #93 functional SHA.
- **MISSING EVIDENCE** — Historical commit/retained provenance explaining the exact separation of inventory #9 from #94 has not yet been established.
- **MISSING EVIDENCE** — No #94 candidate, permanent validator, edge test, browser/mobile test or exact workflow run exists at inspection time.
- **MISSING EVIDENCE** — The authoritative phrase `cancellation` in row #94 is ambiguous. Retained `reset.html` has a Back-to-BibleQuest action but no explicit in-flight cancel request mechanism. Do not invent one without stronger historical evidence.

## ACCEPTANCE RECOVERY CHECKLIST BEFORE IMPLEMENTATION

- [ ] Freeze #93 as immutable v3.64 first.
- [ ] Recover historical reason #94 is separate from verified #9.
- [ ] Identify the current verified #9 recovery service/UI owners that #94 must compose rather than replace.
- [ ] Determine whether inventory `cancellation` means route/back cancellation, form abandonment, or a historical explicit cancel control.
- [ ] Confirm exact invalid-state expectations from retained behavior/history.
- [ ] Define one page owner and route contract with no duplicate network/trusted owner.
- [ ] Add permanent page-level acceptance without weakening #9 recovery regressions.

## FACT / INFERENCE / RECOMMENDATION

**FACT** — #94 remains Not started and must not begin before #93 release closure.

**FACT** — Retained `reset.html`/`reset.js` materially overlap the already verified #9 password/recovery-code capability.

**INFERENCE** — The likely clean boundary is page/surface parity (#94) composing existing recovery authority (#9), not a second recovery implementation.

**RECOMMENDATION** — Treat the #9/#94 boundary as the first contract-recovery question for the next milestone. Do not copy the retained direct-fetch implementation merely because it exists; preserve verified ownership and recover only the distinct page behavior proven by primary evidence.