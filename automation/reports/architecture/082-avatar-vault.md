# A3 Architecture / Security Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A3-ARCH-SECURITY

## STATE / PROVENANCE
- Milestone: #82 Avatar Vault — HIGH-RISK.
- Canonical/head inspected: `feature/v3-avatar-vault` at `589827943ba5467e805d793c001a33a41b9f42b7`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- No dedicated `agent/a1-work/082-*` branch was found in the inspected state.
- Exact functional run `34482680612` successfully checked out/asserted `589827943ba5467e805d793c001a33a41b9f42b7` and executed the accumulated workflow; test sufficiency is an A4 concern.
- Stale when candidate/head, schema, migration, API implementation, or frozen base changes.

## INSPECTED EVIDENCE
FACT:
- `FEATURE_INVENTORY_V3.md`, `AVATAR_VAULT_V3.md`.
- Retained `main:avatar-vault.js`.
- Current `src/engines/avatar-vault.js`, `src/app/avatar-vault.js`, `src/features/avatar-vault/index.js`, `src/core/api.js`, bootstrap, Leaderboards and Congregation Recognition consumers.
- `supabase/migrations/20260910_avatar_vault_visibility.sql`.
- Read-only live Supabase inspection of `bible_avatar_cosmetics`, `bible_congregation_members.avatar`, column grants and RLS policies.
- Current accumulated workflow and #82 validator/edge test.

## REQUIRED OWNER / COMPOSITION
FACT:
- Style/unlock evaluation: `src/engines/avatar-vault.js` only.
- Selection lifecycle/owner-scoped device persistence: `src/app/avatar-vault.js` through `privateStorage`.
- Remote I/O: `src/core/api.js` only.
- Navigation: existing router/bootstrap.
- Congregation-visible consumption: extend existing Leaderboards/Recognition owners; do not create a second congregation profile owner.

This ownership split is structurally reasonable. The current remote write semantics are not yet safe enough for promotion.

## LIVE SCHEMA / RLS FINDINGS
FACT:
- Production currently already has `public.bible_congregation_members.avatar` as non-null JSONB. Its live default is a structured avatar object containing fields such as `face`, `outfit`, `companion`, and `background`; it is not an absent column.
- Production already has an authenticated UPDATE policy named `members update own public profile` whose `USING` and `WITH CHECK` include both `auth.uid() = user_id` and current congregation-membership authorization.
- Production `bible_avatar_cosmetics` already has own-row SELECT/INSERT/UPDATE policies and columns `user_id`, `selected_style`, `updated_at`.
- Authenticated column privileges for congregation member `avatar` already exist in the live project.

Therefore the #82 contract/migration statement that the avatar column "was never actually created" and that there was "no RLS UPDATE policy on that table at all" is false for the live schema inspected today.

## MIGRATION ASSESSMENT
FACT:
- `add column if not exists avatar ... default '{}'` will be a column no-op on the current live project, but represents a different fresh-environment default than the existing structured production avatar default.
- The migration creates an additional permissive UPDATE policy `members self avatar update` with only `user_id = auth.uid()` predicates.
- PostgreSQL permissive RLS policies combine with OR semantics. The new policy is therefore not a harmless alias of the existing membership-qualified policy; it creates a second authorization path for own-row updates whenever row visibility is otherwise available.

RECOMMENDATION:
- Do not add a second RLS policy merely to solve a permission problem that live evidence shows is already solved. Reconcile repository migration history with live schema and preserve the existing intended public-profile policy unless a demonstrated environment requires an additive migration.
- If a migration is still required for fresh-install parity, make its schema/default/policy semantics match the verified canonical avatar contract rather than the currently incorrect "missing live column/policy" assumption.

## BLOCKER — DESTRUCTIVE SHARED AVATAR WRITE
FACT:
- Current `api.avatarVault.save` constructs `avatar = { cosmetic: selectedStyle }` and writes it as the entire `bible_congregation_members.avatar` JSON value for the signed-in user's rows.
- Retained old-version behavior explicitly composed `{ ...existingAvatar, cosmetic:selected }` before writing.
- Existing v3 Congregation Recognition reads and preserves the entire member `avatar` object, so this is a shared cross-feature data object rather than an Avatar-Vault-private field.

Counterfactual:
- A user with an existing structured avatar can equip a cosmetic and lose `face`/`outfit`/`companion`/`background` or any future unrelated avatar keys in congregation-visible state. This is a concrete cross-feature data-loss regression.

Required safe direction:
- Preserve existing avatar JSON and change only the `cosmetic` member through one authoritative update flow, or provide an equivalent server/database operation that guarantees merge semantics. Do not let #82 replace fields owned by another avatar/profile surface.

## BLOCKER — NON-ATOMIC / FALSE RETRY CLOUD FLOW
FACT:
- `api.avatarVault.save` first upserts `bible_avatar_cosmetics`, then separately updates `bible_congregation_members.avatar`.
- `src/app/avatar-vault.js` catches a failed `save` and keeps local state, with UI copy saying cloud sync will retry on reopening.
- `load()` reads `bible_avatar_cosmetics` but does not replay/reconcile the congregation-avatar write.

Counterfactual:
- First write succeeds, second fails: the account's selected-style record becomes current while congregation-visible avatar remains stale. Reopening sees the first record and performs no repair, so the split state can persist indefinitely. The UI's stated retry behavior is not true.

Required safe direction:
- Either use one trusted/transactional operation for the two related cloud representations, or implement deterministic idempotent reconciliation on load/retry that preserves base avatar fields and converges both representations. Tests must faithfully exercise the partial-write case.

## AUTHORIZATION / RLS
FACT:
- Service obtains user id from current Session before calling `api.avatarVault.save`.
- Own-row RLS on `bible_avatar_cosmetics` prevents cross-user cosmetic writes.
- Congregation-member updates remain browser-side and rely on RLS/column grants.

No evidence was found of a direct cross-user write vulnerability in the inspected path. The current blockers are shared-object data integrity, redundant/misaligned policy design, and recovery semantics.

## PRIVACY / SCOPE
FACT:
- Guest state remains owner-scoped device data and does not call cloud.
- Cosmetic is intentionally congregation-visible; no private Psychometrics data is mixed into it.
- No score/permission/spiritual authority is derived from the cosmetic.

## UNSAFE APPROACHES
- Replacing the full shared avatar JSON just to set `cosmetic`.
- Adding another permissive RLS policy without reconciling the existing live policy.
- Claiming two independent browser writes are one reliable cloud transaction.
- Duplicating missing metric counters inside Avatar Vault.
- Deploying the migration to production as part of parity verification; production remains separately authorized.

## TEST / WORKFLOW RISK
FACT:
- Current #82 validator explicitly requires the source pattern `bible_congregation_members').update({avatar}`, which currently encodes the destructive replacement implementation instead of guarding merge preservation.
- The validator also requires the migration's "missing avatar column / self-update policy" shape despite live evidence contradicting those assumptions.
- Current candidate modifies an existing accumulated #81 Psychometrics validator. Under master guardrails this is automatically HIGH-RISK and requires reproduced root cause plus exact-candidate A4/A5 review before promotion.

RECOMMENDATION:
- Correct #82 tests to assert semantic preservation/reconciliation rather than source patterns that lock in the defect. Any correction to already-accumulated tests must retain the intended semantic assertion and follow the documented TEST/FIXTURE DEFECT path.

## BLOCKERS
1. Full avatar JSON overwrite/data loss.
2. Partial cloud write can permanently diverge despite promised retry.
3. Migration/RLS contract is based on live-schema assumptions that are demonstrably false and must be reconciled before schema promotion/deployment planning.

## NON-BLOCKING OBSERVATIONS
- Engine/service/UI owner separation is otherwise consistent with v3 architecture.
- Client-side own-row write can be acceptable if RLS and merge semantics remain correct; an Edge Function is not automatically required.

## MISSING EVIDENCE
- Faithful data-layer test demonstrating preservation of existing structured avatar fields.
- Faithful partial-write failure/recovery test.
- Fresh-environment migration test proving schema/default/policy parity without broadening authorization.
- Explicit proof that any new RLS policy is necessary rather than redundant.

## ARCHITECTURE DECISION
NOT READY. #82 has a safe architectural path, but current `589827943ba5467e805d793c001a33a41b9f42b7` does not satisfy it. Resolve the shared-avatar merge, convergence/retry, and migration-policy reconciliation before promotion.