# A2 Contract Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A2-CONTRACT

## STATE / PROVENANCE
- Active milestone: #82 Avatar Vault.
- Canonical branch/head inspected: `feature/v3-avatar-vault` at `37f1dc671804a1bb67ede2e5104002160b24c9dd`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Exact run `34482680612` is valid only for earlier candidate `589827943ba5467e805d793c001a33a41b9f42b7`; no PASS transfers to `37f1dc6...`.
- Since `589827...`, the candidate added `tests/v3-avatar-vault-smoke.mjs` and registered it in the browser/mobile loop. This resolves the earlier absence of a dedicated 390px Avatar Vault smoke test as source coverage, but that newer exact SHA still needs execution.
- Stale if the #82 head, frozen base, or authoritative #82 contract changes.

## PRIMARY EVIDENCE
FACT:
- `FEATURE_INVENTORY_V3.md` row #82 requires **browse; select; persist; render fallback**.
- Retained `main:avatar-vault.js` exposes 15 styles, device persistence, optional cloud persistence, congregation-visible cosmetic propagation, and starter fallback.
- Retained cloud propagation merged `cosmetic` into the pre-existing avatar object rather than replacing the object.
- Retained reopening re-attempted propagation after loading cloud selection.
- Current v3 engine/service/UI/API/leaderboard composition and new 390px smoke were inspected.
- Read-only live Supabase inspection confirms `bible_congregation_members.avatar` already exists as structured JSONB and `bible_avatar_cosmetics` already exists.

## REQUIRED PARITY
FACT:
- Browse/open Vault and return cleanly.
- Select only unlocked styles; reject locked styles without persistence.
- Persist selected state with guest/account isolation.
- Preserve the user's existing avatar representation while adding cosmetic state.
- Recover or truthfully report cloud synchronization failures.
- Render a safe baseline/fallback when cosmetic data is absent/invalid.
- Cosmetics do not alter scores, permissions, ranking authority, or spiritual standing.

## ACTIVE CONTRACT DEFECTS AT `37f1dc6...`
BLOCKER — destructive avatar replacement:
- Current `src/core/api.js` still constructs `const avatar={cosmetic:selectedStyle}` and writes it as the entire `bible_congregation_members.avatar` value.
- Retained behavior merged `{...existingAvatar, cosmetic:selected}`.
- Counterfactual: selecting a cosmetic can erase existing `face`, `outfit`, `companion`, `background`, or future avatar fields consumed by other congregation surfaces.

BLOCKER — retry/reconciliation promise remains false:
- `api.avatarVault.save` still performs two sequential cloud writes: cosmetics row first, congregation avatar second.
- `src/app/avatar-vault.js::load()` reads the successful cosmetics row but does not replay/reconcile the congregation-avatar write.
- UI copy says failed cloud sync will retry when the Vault is reopened.
- Counterfactual: if write one succeeds and write two fails, reopening can leave cloud representations permanently divergent unless the user explicitly selects again.

## 15-STYLE SCOPE AMBIGUITY
FACT:
- Retained behavior had all 15 unlock rules functional.
- Current v3 exposes all 15 catalog entries but makes 10 permanently unavailable in #82 v1 because their metric owners are not exposed through current Progress.
- The authoritative row does not explicitly say those 10 unlock behaviors may be counted as parity-complete while disabled.

RECOMMENDATION:
- Resolve this before full #82 parity promotion. Do not duplicate metric counters. Compose existing verified owners where authoritative data exists, or record an explicit product-priority deferral that does not silently convert unavailable retained behavior into completed parity.

## RESOLVED SINCE PRIOR REPORT
- A dedicated `tests/v3-avatar-vault-smoke.mjs` now exists and is registered in the accumulated browser/mobile loop. It covers 390px rendering, 15 cards, equip interaction, back callback, horizontal overflow and page/console errors.
- This is source-level readiness only until an exact `37f1dc6...` or later candidate run actually executes it.

## MISSING EVIDENCE
- Faithful data-layer regression proving selection preserves all pre-existing avatar JSON fields.
- Faithful partial-write-success/failure recovery test proving reopen convergence.
- Exact complete regression run for the current SHA after adding the smoke test.
- Primary authorization that disabling 10 retained unlock rules is acceptable for a full parity claim.

## CONCLUSION
NOT CONTRACT-READY for promotion at `37f1dc671804a1bb67ede2e5104002160b24c9dd`. The new 390px smoke closes one coverage gap, but the destructive shared-avatar write and false retry/reconciliation behavior remain concrete active-milestone defects.