# A2 Contract Investigation — #82 Avatar Vault

Identity: `BQ-A2-CONTRACT`
Date: 2026-09-10 JST

## STATE / PROVENANCE

- Active milestone: **#82 Avatar Vault**.
- Canonical branch: `feature/v3-avatar-vault`.
- Exact canonical HEAD independently re-read immediately before report preparation: `589827943ba5467e805d793c001a33a41b9f42b7`.
- Dedicated autonomous candidate: **none found** under `agent/a1-work/082-*`.
- Frozen base: `release/v3.54-psychometrics` at exact `cc591aac786a91183eb5a7a5ad958ae7314a9577`.
- Canonical ancestry: current HEAD is 18 commits ahead of, 0 behind, and has merge base equal to frozen v3.54.
- Current exact-SHA workflow evidence: GitHub Actions query for `589827943ba5467e805d793c001a33a41b9f42b7` returned **0 runs**.
- Inventory at current canonical still records #81 Psychometrics `Verified`, #82 Avatar Vault `Not started`, #83 Innovation `Not started`.

This report is stale if the canonical HEAD, a dedicated `agent/a1-work/082-*` candidate, the frozen base, the authoritative #82 inventory row, retained source, or #82 contract changes, or if new exact-SHA run evidence appears.

## EVIDENCE INSPECTED — PRIMARY

1. `FEATURE_INVENTORY_V3.md` at current canonical: #82 acceptance is exactly **`browse; select; persist; render fallback`**.
2. Retained production compatibility source `avatar-vault.js`: 15 cosmetic styles, metric-gated unlocks, local selected/unlock persistence, optional account cloud synchronization, congregation-visible avatar decoration, and fallback behavior.
3. `AVATAR_VAULT_V3.md` at current canonical.
4. Current v3 owners: `src/engines/avatar-vault.js`, `src/app/avatar-vault.js`, `src/core/api.js`, `src/app/leaderboards.js`, `src/features/avatar-vault/index.js`, bootstrap/router integration and existing Progress/Session/private-storage boundaries.
5. Existing persistence schema/RLS: `supabase/migrations/20260904_assignments_presence_unlocks.sql` for `bible_avatar_cosmetics` own-row select/insert/update authority.
6. New current-lineage migration: `supabase/migrations/20260910_avatar_vault_visibility.sql`, adding `bible_congregation_members.avatar` and authenticated self-update RLS.
7. Permanent current-lineage test material: `scripts/validate-v3-avatar-vault.mjs`, `tests/v3-avatar-vault-edge.mjs`, and `.github/workflows/v3-regression.yml`.
8. `DEVELOPMENT_HANDOFF_V3.md` at current canonical, used as durable context only after checking live refs/product evidence. It is partially stale because it describes earlier #82 progress and says some files were not yet wired even though current canonical has moved beyond that state.
9. Exact GitHub branch/ref/run evidence and frozen v3.54 ref.
10. `automation/TRIAGE.md` was read only after provisional findings were formed. It is SHA-stale: it covers `f097411c395e65494cc383526aa0371bd925ac35`, while live canonical is `589827943ba5467e805d793c001a33a41b9f42b7`.

## REQUIRED PARITY

### FACT — authoritative contract

#82 requires only:

1. **Browse** — user can see the retained Avatar Vault collection/state.
2. **Select** — an eligible cosmetic can be equipped; a locked/unavailable cosmetic must not be silently equipped.
3. **Persist** — equipped state survives the appropriate guest/account lifecycle without owner leakage.
4. **Render fallback** — avatar rendering remains safe when cosmetic state is absent, invalid, unavailable, or cannot be resolved.

The authoritative inventory does **not** require #82 to recreate every legacy implementation detail, global patch, or historical storage mechanism.

### FACT — retained user-visible behavior

Retained `avatar-vault.js` defines 15 styles:
`starter`, `sakura`, `scholar`, `lantern`, `scroll`, `flame`, `shepherd`, `couple`, `community`, `world`, `kitsune`, `moon`, `fuji`, `tea`, `crown`.

The retained thresholds/conditions are:
- starter: always available;
- sakura: 7-day streak;
- scholar: 100 answered questions;
- lantern: 500 XP;
- scroll: 100 recall-card studies;
- flame: 30-day streak;
- shepherd: 250 correct answers;
- couple: 10 couples conversations;
- community: 10 group sessions;
- world: at least 50% in every one of 8 Journey regions;
- kitsune: 500 answered questions;
- moon: 250 recall-card studies;
- fuji: 100% exploration in any Journey region;
- tea: 10 completed leader assignments;
- crown: 2,500 XP.

Retained behavior also preserves earned unlocks, equips a selected style, decorates avatars with the cosmetic marker, attempts account cloud synchronization when signed in, remains usable locally when cloud synchronization fails, and falls back to `starter` for unknown style IDs.

## EXPLICITLY OUT OF SCOPE

### FACT

- #83 Innovation is a separate inventory row and must not be absorbed into #82.
- Tutorial, accessibility, reporting/moderation, Content Review and Admin are later rows.
- No inventory evidence requires Avatar Vault to become a new XP, streak, question-count, Recall, Couples, Community, Assignment, or Journey mastery owner.
- The legacy `window.BQAvatar` monkey-patch/global architecture is compatibility history, not a required v3 ownership shape.
- Legacy duplicate writes to both `bible_profiles.avatar` and `bible_congregation_members.avatar` are not independently required by the #82 inventory contract.
- Production Supabase deployment is not part of this milestone without separate production authorization.

## VERIFIED OWNERS TO COMPOSE

### FACT

- Session remains owner identity/authentication authority.
- Existing private storage remains the device-local owner-scoped persistence mechanism.
- Progress remains the existing source for the currently exposed `xp` and `streak` metrics; Avatar Vault must not create duplicate progression counters.
- Router remains navigation/history owner.
- `src/engines/avatar-vault.js` is structured as the #82 catalog/unlock calculation owner.
- `src/app/avatar-vault.js` is structured as the #82 lifecycle/equip/persistence coordinator.
- `src/core/api.js` remains the browser Supabase/API boundary.
- Leaderboards remains its own ranking/directory owner; #82 only supplies cosmetic decoration data.

## RETAINED DATA / SERVER CONTRACTS

### FACT — existing cosmetic row

`bible_avatar_cosmetics` already exists with `user_id` primary key, `selected_style`, and `updated_at`. RLS permits authenticated users to select/insert/update only rows whose `user_id = auth.uid()`. This supports a per-account private selected-style record without requiring a new duplicate table.

### FACT — current #82 migration

Current canonical adds `bible_congregation_members.avatar jsonb not null default '{}'` and an authenticated UPDATE policy with both `USING` and `WITH CHECK` restricted to `user_id = auth.uid()`.

### FACT — current API shape

Current `avatarVault.save(userId, selectedStyle)` performs two browser-originated writes through `src/core/api.js`: upsert the caller-supplied `userId` and style into `bible_avatar_cosmetics`, then update `bible_congregation_members.avatar` for that `userId`. Database RLS is therefore material to account isolation; the browser-supplied user ID is not itself authorization evidence.

### INFERENCE

The retained requirement supports account cloud persistence and congregation-visible cosmetic rendering, but it does not by itself prove that the exact current two-write browser implementation is the only acceptable design. Authorization correctness must be established by RLS/trusted-boundary evidence, not by client parameters.

## UX / STATE CONTRACT

### FACT

- Guest state may be device-only.
- Signed-in state may combine owner-scoped device cache and authenticated cloud state.
- A locked style must fail closed and must not overwrite current equipped state.
- Unknown/invalid cosmetic IDs must render through a safe fallback rather than breaking the avatar surface.
- Cloud failure must not destroy a valid local equip. Retained v2 already treated cloud synchronization as optional/best-effort.
- A cosmetic is presentation/reward state only; retained evidence does not authorize score, doctrinal, spiritual-rank or permission effects.
- Mobile acceptance is material because the current #82 contract file explicitly requires the real surface to remain usable at 390px with no horizontal overflow; however this requirement still lacks exact executed evidence at the live SHA.

## DEFERRED LEGACY METRICS

### FACT

Current v3 Progress exposes the two #82 source metrics `xp` and `streak` used by five retained styles: starter, sakura, lantern, flame and crown. The current #82 contract keeps all 15 catalog entries but marks the other 10 unavailable with an explicit `needsOwner` rather than duplicating counters from other features.

### INFERENCE

This is a defensible bounded reconstruction strategy because the authoritative inventory requires browse/select/persist/fallback, not immediate reconstruction of every upstream progression metric. It preserves the retained catalog and prevents fabricated unlock authority.

### RECOMMENDATION

Keep those 10 unavailable until their verified source owners expose authoritative counts. Do not backfill by parsing unrelated private state or maintaining new Avatar Vault counters. If later primary evidence establishes those source owners already expose reliable counts, integrate them as a later bounded dependency rather than changing ownership.

## LEGACY BEHAVIOR NOT TO COPY

### FACT / RECOMMENDATION

- Do not recreate direct `localStorage` reads across unrelated legacy state blobs to derive progression metrics.
- Do not recreate the global `window.BQAvatar.render/glyph/clean` monkey patch as parallel avatar ownership.
- Do not write duplicate profile avatar state into `bible_profiles` merely because retained v2 did so.
- Do not let Avatar Vault own question, Recall, Couples, Community, Assignment or Journey counting.
- Do not treat client-supplied `userId` as authorization; database/server policy remains authoritative.

## PERMANENT TEST / WORKFLOW EVIDENCE

### FACT

`tests/v3-avatar-vault-edge.mjs` currently covers:
- all 15 catalog records and the 5/10 available/deferred split;
- exact xp/streak unlock thresholds;
- deferred styles remaining locked despite generous unrelated metrics;
- malformed metric fail-closed normalization;
- fallback icon behavior;
- guest no-cloud behavior;
- locked-selection rejection;
- local persistence of an unlocked selection;
- cloud-sync failure retaining local authoritative equip with `synced:false`;
- guest/account local isolation.

The accumulated workflow currently invokes `scripts/validate-v3-avatar-vault.mjs` and `tests/v3-avatar-vault-edge.mjs` while retaining prior accumulated architecture/edge coverage.

### MISSING EVIDENCE

- No GitHub Actions run exists for exact live SHA `589827943ba5467e805d793c001a33a41b9f42b7`.
- The current accumulated browser/mobile invocation list does **not** include a `tests/v3-avatar-vault-smoke.mjs` entry, even though `AVATAR_VAULT_V3.md` explicitly requires proof of the real 390px surface and leaderboard cosmetic rendering before completion.
- No exact candidate has therefore proven browse/select through the real feature surface, 390px overflow behavior, real leaderboard render fallback, or the complete accumulated suite.
- The edge test uses mocked API objects for account sync; it does not prove the real Supabase/RLS authorization boundary. That is architecture/security evidence, not something A2 treats as satisfied by a mock.

## DEPENDENCIES

### FACT

Required existing owners/dependencies are Session, private storage, Progress xp/streak, API/Supabase boundary for signed-in cloud state, Router, and Leaderboards for congregation-visible cosmetic rendering.

### RECOMMENDATION

Do not begin #83 while #82 exact acceptance and release gates remain incomplete. Do not expand #82 merely to make later metrics available.

## AMBIGUITIES / BLOCKER-RELEVANT CONTRACT ISSUES

### FACT

1. Current canonical contains implementation/schema/shared-owner changes but no dedicated `agent/a1-work/082-*` candidate.
2. Exact current-SHA functional verification is absent.
3. Real browser/mobile #82 coverage is absent from the accumulated browser list at current HEAD.
4. Current inventory still says #82 `Not started`, so current implementation must not be represented as authoritative Verified/Regression-tested state.
5. Durable handoff is partially stale versus current canonical and cannot be used to claim which implementation steps remain without re-checking live files.

### INFERENCE

The absence of a real browser/mobile #82 regression is a contract-evidence gap because the current #82 completion contract itself names the real surface and 390px behavior. It should be corrected before any exact functional gate can count as complete.

## CONCRETE ACCEPTANCE CHECKLIST

#82 contract is satisfied only when the exact reviewed candidate proves all of the following:

- [ ] Vault can be opened/browsed through the actual v3 UI/navigation path.
- [ ] All 15 retained cosmetic entries remain represented without inventing upstream metrics.
- [ ] Starter always resolves safely; invalid/missing cosmetics render a fallback.
- [ ] Available xp/streak styles unlock exactly at their retained thresholds.
- [ ] Deferred styles cannot be selected/unlocked merely from unsupported synthetic metrics.
- [ ] Locked selection fails closed and does not replace the current equipped style.
- [ ] Guest selection persists only in guest device scope and makes no cloud call.
- [ ] Account-local state is isolated by account owner.
- [ ] Signed-in cloud persistence obeys the intended own-user authorization boundary.
- [ ] Cloud-sync failure leaves the valid local equip intact and visibly recoverable.
- [ ] Congregation-visible/leaderboard rendering carries the selected cosmetic but does not affect score/rank authority.
- [ ] Real Avatar Vault and affected leaderboard surface render safely at 390px with no horizontal overflow/runtime failure.
- [ ] Permanent validator + edge + browser/mobile tests are wired additively into the accumulated workflow.
- [ ] Complete accumulated functional suite passes against the exact candidate SHA.
- [ ] If bookkeeping changes the SHA, the complete accumulated suite passes again against that exact bookkeeping SHA before `release/v3.55-avatar-vault` freezes.

## FINAL A2 CONTRACT DISPOSITION

**FACT:** The recovered #82 product contract remains narrowly **browse; select; persist; render fallback**. Current canonical has materially advanced implementation, schema/RLS and shared API/leaderboard integration beyond the earlier handoff state, but it has no dedicated quarantine candidate and no exact current-SHA run evidence.

**FACT:** The current design's explicit deferral of 10 unsupported metric-gated cosmetics is consistent with avoiding duplicate progression ownership; retained catalog parity is preserved and the five currently sourceable xp/streak styles are testable now.

**MISSING EVIDENCE:** Exact functional green, real #82 browser/mobile execution, real leaderboard cosmetic rendering/fallback under browser regression, and faithful authorization evidence for the account cloud path are still absent at `589827943ba5467e805d793c001a33a41b9f42b7`.

**RECOMMENDATION:** Keep #82 bounded. Add/prove the missing real-surface browser/mobile acceptance and exact complete gate; do not invent the ten upstream metrics or absorb #83. Because the current lineage changes schema/RLS/shared API ownership, A3/A4/A5 HIGH-RISK requirements apply independently of this contract finding.