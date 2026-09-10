# A2 Contract Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A2-CONTRACT

## STATE / PROVENANCE
- Active milestone: #82 Avatar Vault.
- Canonical branch/head inspected: `feature/v3-avatar-vault` at `589827943ba5467e805d793c001a33a41b9f42b7`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Dedicated `agent/a1-work/082-*` branch: not found in inspected live state.
- Current exact functional evidence: run `34482680612` successfully checked out/asserted `589827943ba5467e805d793c001a33a41b9f42b7` and completed the accumulated suite. Evidence quality is addressed independently by A4.
- This report is stale if the #82 canonical head changes, the frozen base changes, or authoritative #82 inventory/contract evidence changes.

## EVIDENCE INSPECTED
FACT:
- `FEATURE_INVENTORY_V3.md` row #82: `Avatar vault` / required verification `browse; select; persist; render fallback`.
- Retained `main:avatar-vault.js` old-version behavior.
- `AVATAR_VAULT_V3.md` and current #82 engine/service/UI/API/leaderboard composition.
- Current workflow/test files and exact run metadata.
- Read-only live Supabase schema/policy inspection for `bible_avatar_cosmetics` and `bible_congregation_members.avatar`.

## REQUIRED PARITY
FACT from authoritative inventory:
- Browse Avatar Vault.
- Select a valid/unlocked style.
- Persist selected state.
- Render a safe fallback when avatar/cosmetic state is absent or invalid.

FACT from retained reachable behavior relevant to those requirements:
- The retained Vault exposes 15 named styles and explicit unlock requirements.
- `starter` is the baseline fallback.
- Guest selection is device-local.
- Signed-in selection persists to `bible_avatar_cosmetics` and propagates a cosmetic marker into congregation-visible avatar data.
- Legacy propagation preserved the pre-existing avatar object and added `cosmetic`; it did not replace the base avatar object.
- A failed cloud synchronization kept local equip state and legacy reopening attempted cloud synchronization again.
- Cosmetics are presentation-only and do not affect score/spiritual rank.

## EXPLICITLY OUT OF SCOPE
FACT:
- #83 Innovation and later inventory rows.
- Creating duplicate progress/question/couples/community/assignment/Journey counters inside Avatar Vault.
- Reintroducing retained `window.BQ*`, global avatar monkey-patching, or direct feature-owned localStorage/Supabase clients.

## VERIFIED OWNERS TO COMPOSE
FACT:
- Session/auth owner for current user identity.
- `privateStorage` for owner-scoped local persistence.
- Progress owner for metrics it actually exposes.
- Router/bootstrap for navigation composition.
- `src/core/api.js` for Supabase access.
- Existing Leaderboards/Recognition owners for congregation-visible avatar consumption.

## RETAINED DATA / SERVER CONTRACTS
FACT:
- `bible_avatar_cosmetics` live columns are `user_id`, `selected_style`, `updated_at`, with own-row RLS.
- Live `bible_congregation_members.avatar` already exists as JSONB and is congregation-visible through existing membership reads.
- Current retained behavior composes cosmetic with the existing avatar object.

## CURRENT CONTRACT DEFECTS
FACT — base-avatar preservation failure:
- Current `src/core/api.js` builds `const avatar={cosmetic:selectedStyle}` and updates `bible_congregation_members.avatar` with that entire object.
- The retained implementation instead spread the current base avatar and then added `cosmetic`.
- Counterfactual: selecting a v3 cosmetic can erase unrelated avatar fields already stored for the user and consumed by other congregation surfaces. This conflicts with retained persistence/render behavior and cross-feature data preservation.

FACT — retry contract is not implemented:
- `select()` reports `synced:false` when `api.avatarVault.save` fails and the UI states cloud sync will retry when the Vault is reopened.
- `load()` only reads `bible_avatar_cosmetics.selected_style`; it does not retry/reconcile the congregation-avatar propagation write.
- Because `save()` performs two sequential writes, the first can succeed and the second can fail. Reopening then reads the successful first write and leaves congregation-visible avatar state stale indefinitely unless the user explicitly selects again.
- Counterfactual: persistence can split into two contradictory cloud states while the UI promises automatic recovery.

## 15-STYLE SCOPE AMBIGUITY
FACT:
- Retained old-version behavior contains all 15 working unlock rules.
- Current v3 contract deliberately marks 10 styles unavailable because their metric owners are not exposed through current Progress.
- The authoritative inventory row itself says only `browse; select; persist; render fallback`; it does not explicitly authorize a permanent reduction from 15 functional unlock rules to 5.

RECOMMENDATION:
- Treat resolution of the 10-style behavior as a milestone contract question before claiming full #82 parity. Do not duplicate metric ownership. Either compose required counts from already-verified authoritative owners, or explicitly record/obtain an authoritative deferral decision that does not silently count missing unlock behavior as parity-complete.

## LEGACY BEHAVIOR NOT TO COPY
FACT:
- Direct `localStorage` ownership.
- `window.BQAvatarVault` globals.
- Global `BQAvatar.render/glyph/clean` monkey-patching.
- Feature-direct Supabase client usage.

## ACCEPTANCE CHECKLIST
MILESTONE:
- Vault browse route opens from Grow and returns cleanly.
- Starter fallback always works for missing/invalid cosmetic state.
- Locked selection rejects without persistence.
- Unlocked selection persists per guest/account owner.
- Cloud persistence preserves every pre-existing non-cosmetic avatar field.
- Partial cloud failure is recoverable on reopen or otherwise has a truthful deterministic retry mechanism.
- Congregation-visible leaderboard/recognition consumption remains compatible after cosmetic selection.
- 390px surface behavior is executable-tested.
- 15-style unlock scope is resolved without duplicate counters.
- Exact candidate complete suite plus meaningful #82-specific coverage passes.

## MISSING EVIDENCE
- No faithful test currently proves preservation of existing avatar JSON fields through `api.avatarVault.save`.
- No faithful test currently proves recovery from first-write-success / second-write-failure cloud divergence.
- No current executable browser test is dedicated to the real Avatar Vault surface at 390px.
- No primary evidence inspected establishes that permanently disabling 10 retained unlock rules is acceptable for a full parity claim.

## CONCLUSION
#82 is not contract-ready for promotion at `589827943ba5467e805d793c001a33a41b9f42b7`. The destructive avatar replacement and false retry/reconciliation behavior are concrete active-milestone defects. The 10-style reduction is a separate parity ambiguity that must be resolved without inventing duplicate metric owners.