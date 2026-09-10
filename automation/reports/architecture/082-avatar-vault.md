# A3 Architecture / Security Investigation — #82 Avatar Vault

Generated: 2026-09-10 JST
Identity: BQ-A3-ARCH-SECURITY

## STATE / PROVENANCE
- Milestone: #82 Avatar Vault — HIGH-RISK.
- Canonical/head inspected: `feature/v3-avatar-vault` at `37f1dc671804a1bb67ede2e5104002160b24c9dd`.
- Frozen base: `release/v3.54-psychometrics` at `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Run `34482680612` is exact only for prior candidate `589827943ba5467e805d793c001a33a41b9f42b7`; current head changed afterward by adding/registering a browser smoke.
- Candidate changes schema/RLS source, shared `src/core/api.js`, leaderboard consumption, workflow and an existing accumulated validator, therefore HIGH-RISK review remains mandatory.
- Stale when candidate/head, schema, migration, API behavior, workflow or frozen base changes.

## LIVE SCHEMA / RLS PRIMARY EVIDENCE
FACT:
- Production already has `public.bible_congregation_members.avatar` as non-null JSONB with a structured default containing `face`, `outfit`, `companion`, and `background`.
- Production already has authenticated column privileges for `avatar`.
- Production already has `members update own public profile`, an UPDATE policy requiring both `auth.uid() = user_id` and current congregation membership in USING/WITH CHECK.
- `bible_avatar_cosmetics` already exists with own-row SELECT/INSERT/UPDATE RLS and columns `user_id`, `selected_style`, `updated_at`.

Therefore the candidate contract/migration claim that the live avatar column was never created and no UPDATE policy existed is not correct for the inspected live project.

## BLOCKER — SHARED AVATAR DATA LOSS
FACT:
- At current `37f1dc6...`, `api.avatarVault.save` still does `const avatar={cosmetic:selectedStyle}` and then `.update({avatar}).eq('user_id',userId)`.
- Retained old-version behavior merged cosmetic into the current avatar object.
- Existing Congregation Recognition preserves/uses the full avatar object.

Counterfactual:
- Equipping a cosmetic can replace and erase unrelated structured avatar fields owned/used outside #82. This is a concrete cross-feature data-integrity regression.

Required safe boundary:
- Update only the `cosmetic` member while preserving the existing JSON object, through a deterministic authoritative merge or equivalent trusted operation. #82 must not become owner of unrelated avatar fields.

## BLOCKER — SPLIT CLOUD STATE / NO TRUE RETRY
FACT:
- `api.avatarVault.save` first upserts `bible_avatar_cosmetics`, then separately updates `bible_congregation_members.avatar`.
- Current `load()` reads the cosmetics row and updates local state only; it does not reconcile/replay the congregation-avatar propagation write.
- UI says failed synchronization will retry when the Vault is reopened.

Counterfactual:
- First write succeeds and second fails: private selected-style state is current while congregation-visible avatar remains stale. Reopening does not repair it, so two cloud representations can diverge indefinitely.

Required safe boundary:
- Use a single transactional/trusted mutation or a deterministic idempotent reconciliation path that converges both representations and preserves existing avatar keys. Add a faithful partial-failure regression.

## BLOCKER — MIGRATION / POLICY CONTRACT DOES NOT MATCH LIVE AUTHORITY
FACT:
- Candidate migration `20260910_avatar_vault_visibility.sql` uses `add column if not exists avatar ... default '{}'`, which is a no-op against current production but encodes a different fresh-environment default than the structured live avatar.
- It adds a separate permissive policy `members self avatar update` scoped only by `user_id = auth.uid()`.
- Current live project already has a membership-qualified own-profile UPDATE policy.

Counterfactual:
- Keeping the new policy as the supposed fix creates a second authorization path and lets repository fresh-install semantics diverge from verified live semantics. Even if no direct cross-user exploit is demonstrated, this is unnecessary trust-boundary broadening based on a false prerequisite.

Recommendation:
- Reconcile repository migration history/live schema and preserve one intended membership-qualified public-profile update authority. Do not deploy/add a redundant broader policy to solve a permission problem not present in live evidence.

## TEST / WORKFLOW STATUS
FACT:
- A dedicated 390px Avatar Vault Playwright smoke now exists and has been registered in the browser/mobile loop. This resolves the earlier source-coverage absence, but current SHA has no exact complete run yet.
- The #82 validator still requires the source token representing `.update({avatar})` rather than semantic preservation of other avatar keys.
- The #82 validator still requires the migration's missing-column/self-policy story despite contrary live evidence.
- Existing accumulated #81 Psychometrics validator was modified to remove a stale future-state assertion. The change appears narrow, but any existing accumulated validator change remains HIGH-RISK by master rules.

## AUTHORIZATION / PRIVACY
FACT:
- No direct cross-user write vulnerability was demonstrated in the current inspected path: Session supplies current user identity and RLS protects own-row cosmetics/member updates.
- Guest data remains device-only; psychometric/private data is not mixed into avatar cosmetics.
- Cosmetic state has no score/permission/spiritual authority.

## ARCHITECTURE DECISION
**NOT READY** at `37f1dc671804a1bb67ede2e5104002160b24c9dd`.

Current blockers are:
1. destructive replacement of the shared avatar JSON;
2. non-atomic two-write flow with no real reopen reconciliation;
3. migration/RLS assumptions inconsistent with current live schema and existing authorization policy;
4. no exact complete accumulated run for the current post-smoke SHA.

The owner split itself is usable. Correct these semantics without duplicating owners, then run a new exact complete gate and obtain fresh exact-SHA A4/A5 review.