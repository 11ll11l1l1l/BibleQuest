# A2 Contract Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A2-CONTRACT

## STATE / PROVENANCE
- Current canonical/bookkeeping head inspected: `feature/v3-avatar-vault` at `dde924f86f83baf78659f303e442930b38749aca`.
- Product functional candidate in this lineage: `37f1dc671804a1bb67ede2e5104002160b24c9dd`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- `dde924f...` is three commits after `37f1dc6...`; the observed delta is status/handoff/inventory bookkeeping only, so the product persistence defects below remain present unchanged.
- Functional run `34483151962` successfully verified exact product candidate `37f1dc6...`, including the new Avatar Vault browser smoke. Green execution does not prove behaviors absent from the harness.
- Current bookkeeping verification is a separate exact-SHA transaction; no PASS transfers automatically.
- Stale if the canonical/product code, contract, frozen base, or exact bookkeeping state changes.

## PRIMARY CONTRACT EVIDENCE
FACT:
- Inventory #82 requires **browse; select; persist; render fallback**.
- Retained `main:avatar-vault.js` has 15 styles, device persistence, cloud selected-style persistence, congregation-visible cosmetic propagation, starter fallback, and reopening that attempts cloud propagation again.
- Retained cloud propagation merged `cosmetic` into the pre-existing avatar object; it did not replace the base avatar.
- Current live Supabase has a structured `bible_congregation_members.avatar` JSON object and `bible_avatar_cosmetics`.

## ACTIVE CONTRACT BLOCKERS
1. **Preservation failure.** Current `src/core/api.js` still writes `avatar={cosmetic:selectedStyle}` as the whole congregation avatar. This can erase unrelated base-avatar fields such as face/outfit/companion/background, unlike retained behavior. That violates safe persistence/render compatibility.
2. **Retry/reconciliation failure.** Current save performs cosmetics-row write first and congregation-avatar write second. If the first succeeds and the second fails, `load()` reads the successful selected style but does not replay/reconcile the failed congregation-avatar write, despite UI copy promising retry on reopening. Cloud representations can remain divergent indefinitely.

## 15-STYLE SCOPE AMBIGUITY
FACT:
- Retained behavior had all 15 unlock rules functional.
- Current v3 catalog keeps all 15 but marks 10 unavailable because their metric owners are not exposed through the current Progress interface.
- Inventory wording does not itself explicitly authorize counting those 10 unavailable unlock behaviors as full parity.

RECOMMENDATION:
Resolve this without duplicating metric counters: compose verified owners if authoritative metrics exist, or explicitly defer the missing unlock behaviors without silently treating them as restored parity.

## RESOLVED COVERAGE GAP
- `tests/v3-avatar-vault-smoke.mjs` now exists and exact functional run `34483151962` executed the accumulated browser/mobile suite containing it. The earlier 390px-smoke absence is resolved.

## MISSING EVIDENCE
- Faithful data-layer proof that cosmetic selection preserves every unrelated avatar JSON field.
- Faithful first-write-success/second-write-failure recovery proof.
- Authoritative resolution of the 10 disabled legacy unlock rules.

## CONTRACT DECISION
**NOT READY**. Functional/browser gates are green for `37f1dc6...`, but the current implementation still fails retained persistence semantics in two concrete ways not represented by the harness. Bookkeeping must not convert those gaps into a parity-complete claim.