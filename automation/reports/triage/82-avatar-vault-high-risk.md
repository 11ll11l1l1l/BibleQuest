# A5 firewall reconciliation — #82 Avatar Vault

Identity: `BQ-A5-FIREWALL`
Date: 2026-09-10 22:58 JST

## Exact state
- Active milestone: **#82 Avatar Vault — HIGH-RISK**.
- Canonical/bookkeeping candidate `feature/v3-avatar-vault`: exact `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712`.
- Dedicated `agent/a1-work/082-*`: **not found**.
- Frozen base `release/v3.54-psychometrics`: exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Exact corrected bookkeeping run `34484163108`: **SUCCESS**. Isolated verifier checked out/asserted `60100f0...`; architecture, edge/security and browser/mobile phases completed green, including `tests/v3-avatar-vault-smoke.mjs`.
- Lease observed: **FREE**.

## Primary evidence independently verified
1. `src/core/api.js` at exact `60100f0...`: `avatarVault.save()` first upserts `bible_avatar_cosmetics`, then replaces `bible_congregation_members.avatar` with exactly `{cosmetic:selectedStyle}`.
2. `src/app/avatar-vault.js`: signed-in `load()` reads only `api.avatarVault.load()` / `bible_avatar_cosmetics.selected_style`; it does not inspect or repair the congregation-visible avatar projection after a partial save.
3. Exact verifier workflow for run `34484163108`: exact SHA assertion plus all accumulated phases; its browser loop includes `tests/v3-avatar-vault-smoke.mjs`.
4. `scripts/validate-v3-avatar-vault.mjs`: requires workflow invocation of the #82 validator and edge test but does not require the #82 browser smoke, leaving future retention weaker than intended even though the current exact run executed the smoke.
5. Repository migration `20260910_avatar_vault_visibility.sql`: adds an UPDATE policy on `bible_congregation_members` scoped only to `user_id = auth.uid()`.
6. Read-only live Supabase metadata: `bible_congregation_members.avatar` already exists as non-null JSONB with structured default `{face:"smile", outfit:"traveler", companion:"sheep", background:"olive"}`; aggregate inspection shows 3 existing multi-key avatar rows. Live `members update own public profile` policy requires `auth.uid() = user_id` **and** `private.is_bible_congregation_member(congregation_id)`; that helper requires an active membership row. Existing authenticated UPDATE grant is column-limited to `(display_name, avatar)`.
7. `bible_avatar_cosmetics` live RLS is self-row scoped for select/insert/update, but no server policy validates style unlock eligibility.

## Investigator freshness
- A2 report analyzed `589827943...`: **SHA-stale**. Its recovered contract remains contextual, not promotion evidence.
- A3 report analyzed exact `60100f0...`: **current** and independently consistent with primary evidence; disposition trust boundary NOT SATISFIED / NOT READY.
- A4 report analyzed exact `60100f0...` plus run `34484163108`: **current** and independently consistent with primary evidence; disposition NOT READY.
- Agreement is not treated as proof; the blocking facts above were rechecked directly.

## Classification

### BLOCKER 1 — destructive avatar replacement
**FACT:** save replaces the entire public avatar object with a one-key cosmetic object.

**Counterfactual:** a current multi-key avatar row selecting any cosmetic loses its face/outfit/companion/background or other keys. Live data proves multi-key rows exist. This directly violates #82 `persist`/data integrity.

### BLOCKER 2 — split cloud state without reconciliation
**FACT:** cosmetics selection and public avatar projection are separate sequential writes; reopen reads only the cosmetics selection.

**Counterfactual:** first write succeeds and second fails. Reopen adopts the new selected style from `bible_avatar_cosmetics`, while congregation/leaderboard avatar remains stale indefinitely. Current mocks cannot reproduce this partial-success transaction.

### BLOCKER 3 — candidate migration broadens the live authorization boundary
**FACT:** live public-profile UPDATE policy requires self-row plus active congregation membership. Candidate migration adds a separate self-row-only UPDATE policy. Existing authenticated column grant covers both `display_name` and `avatar`.

**Counterfactual:** because permissive PostgreSQL RLS policies combine by OR, a caller with an inactive/stale own membership row can satisfy the new self-only policy even when the existing active-membership policy rejects the row, thereby restoring UPDATE authority over the granted public-profile columns. This is an unexplained authorization broadening in a HIGH-RISK milestone. Fresh-install avatar default also diverges from the current authoritative structured default.

### BLOCKER 4 — HIGH-RISK independent promotion gate is not satisfied
**FACT:** exact run `34484163108` is green, but the exercised suite does not protect BLOCKER 1/2 or faithful earned-cosmetic authorization. Current A3 says the trust boundary is not satisfied; current A4 is NOT READY.

**Counterfactual:** treating exact workflow green alone as sufficient would freeze known persistence/authorization defects that the present harness cannot catch. MASTER_CONTROL requires A3 satisfaction plus A4 READY for this HIGH-RISK candidate before A5 may recommend promotion.

### MILESTONE
- Preserve authoritative scope `browse; select; persist; render fallback`.
- Correct persistence by preserving existing avatar fields and providing explicit transactional/retry/reconciliation semantics for the two declared cloud representations; retain permanent regressions for both failure modes.
- Decide the public cosmetic trust model. If untrusted self-presentation, prohibit downstream score/rank/permission/achievement authority. If earned-authoritative, use a narrow trusted server/RPC/Edge path backed by authoritative progression facts; client XP/streak cannot be treated as server authorization.
- Reconcile migration/RLS with the existing active-membership authorization boundary; do not add a broader parallel policy.
- Make the #82 validator require `tests/v3-avatar-vault-smoke.mjs` invocation so future accumulated runs cannot silently omit it.
- Before any further autonomous product/test/workflow write, create/resume `agent/a1-work/082-*` from the reconciled current canonical state.

### DEFER
- Ten legacy unlocks lacking verified v3 metric owners remain unavailable rather than duplicating progression ownership.
- #83 Innovation remains outside #82.

### IGNORE
- Previous "no exact green for `60100f0...`" finding is obsolete: run `34484163108` supplies the exact complete green and executed the #82 smoke.
- Earlier functional run `34483151962` need not be promoted/transferred; the later bookkeeping SHA has its own exact execution evidence.
- Stale CURRENT/handoff wording does not override live refs, code, backend metadata or exact run evidence.

## Firewall disposition
**4 BLOCKER; NO PROMOTION RECOMMENDATION.**

The exact execution gate is satisfied but acceptance/security is not. The next safe candidate must fix only the verified #82 persistence/RLS defects on the required quarantine branch, add faithful permanent regressions, and pass the entire accumulated suite on that exact successor. Because #82 remains HIGH-RISK, fresh A3 trust-boundary satisfaction and exact-candidate A4 READY are required before A5 can recommend promotion.

## Staleness
This report is stale on any movement of canonical/work/frozen refs; any change to Avatar Vault product/API/schema/RLS/tests/workflow; new exact run evidence; new A3/A4 exact-candidate reports; or creation of `release/v3.55-avatar-vault`.