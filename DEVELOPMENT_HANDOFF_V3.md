# BibleQuest v3 continuation handoff

Updated: 2026-09-10 JST during manual #81 development.

GitHub live refs and exact executed verification evidence are authoritative.

## Immutable / frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.53-personality-profile` at `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Exact v3.53 bookkeeping verification run: `34471685908` — complete accumulated architecture, edge/security and browser/mobile suite green against that exact SHA.
- Production v2, `main`, production Supabase and production Cloudflare remain untouched.
- BibleQuest autonomous A1–A5 scheduled agents remain paused; current work is manual.
- Normal v3 Actions remain `workflow_dispatch` only. Temporary `push:` triggers belong only to isolated verification branches and are restored afterward.

## #81 Psychometrics exact functional state

- Active branch: `feature/v3-psychometrics`.
- Frozen base: `release/v3.53-personality-profile` at `2c62a63e5bbdedae47834714e65751a57d58b696`.
- Exact green functional candidate: `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`.
- Exact functional verification run: `34473640903` — completed `success`.
- The isolated verifier explicitly checked out and asserted the exact candidate before executing the complete suite.
- Accumulated architecture validators, edge/security regressions and complete Playwright/browser-mobile regressions were green.
- The isolated functional verification workflow was restored to manual-only.

## #81 verified functional boundary

The recovered contract is exactly **complete assessment; result; persistence; mobile**.

- static Psychometrics item/source/safety data owns no storage, DOM, backend or progress behavior;
- `src/engines/psychometrics.js` is the sole #81 scoring/normalization owner;
- `src/app/psychometrics.js` owns assessment lifecycle and owner-scoped persistence through `privateStorage`;
- `src/features/psychometrics/index.js` is presentation/event forwarding only;
- `src/app/router.js` remains navigation/history owner;
- Quick Transform and Personality Profile retain separate existing owners;
- NEO-120, VIA-R-96 and Rosenberg-10 retain deterministic reverse-keyed scoring and exact item-count contracts;
- guest/account states are isolated and private/non-portable;
- political/relativism wording, Spirituality/Religiousness and Depression facet names cannot become political, doctrinal, salvation, morality or diagnostic scores;
- no XP, progress, leaderboard, assignment, congregation, Scripture or permission authority is derived from psychometric results;
- no schema, migration, RLS, RPC, Edge Function, production Supabase or production Cloudflare change was introduced.

Permanent #81 evidence:
- `PSYCHOMETRICS_V3.md`;
- `scripts/validate-v3-psychometrics.mjs`;
- `tests/v3-psychometrics-edge.mjs`;
- `tests/v3-psychometrics-smoke.mjs`;
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Defect / root-cause record

- Candidate `1bd77237de6b08f18794387bf5c1d9c8098a3e4a`, run `34472943815`: the new #81 validator incorrectly required duplicated UI safety sentences despite centralized `PSYCHOMETRICS_SAFETY` ownership. The validator was corrected to verify the centralized safety reference; runtime behavior and earlier coverage were not weakened.
- Candidate `5d3446916b8aa809f8a419e3cffa88a312c4bbc5`, run `34473640903`: complete accumulated functional suite green.
- First bookkeeping candidate `7eb305d0998654aeb3bcdc987f65ebd960b22e20`, run `34474359203`: exact SHA assertion passed, but the older #80 Personality Profile validator still hard-coded #81 to remain `Not started`. This stale future-state assertion was reproduced only after #81 legitimately became Verified. The #80 validator now accepts #81's normal lifecycle states; the dedicated #81 validator remains authoritative. Runtime code and #81 acceptance coverage were unchanged. The failed verifier was restored to manual-only.

## Bookkeeping transaction: confirmed final

Bookkeeping candidate `cc591aac786a91183eb5a7a5ad958ae7314a9577` (tip of `feature/v3-psychometrics`) passed isolated verifier `verify/v3.54-psychometrics-bookkeeping-cc591-20260910`, run `34474642839` — exact-SHA assertion, complete accumulated architecture validators, edge/security regressions and browser/mobile regressions all green. Verifier restored to manual-only.

- #80 Personality profile — **Regression-tested**;
- #81 Psychometrics suite — **Verified**;
- **80 Regression-tested, 1 Verified, 0 Implemented, 19 Not started**;
- strict implemented-or-better parity **81/100**;
- regression stability **80/100**.

`release/v3.54-psychometrics` is frozen at exactly `cc591aac786a91183eb5a7a5ad958ae7314a9577`. This is now final.

## #82 next boundary

#82 Avatar Vault: Not started, now the active milestone. `feature/v3-avatar-vault` created from `release/v3.54-psychometrics` (currently identical, no #82 commits yet). Its authoritative contract is **browse; select; persist; render fallback**.

Legacy contract recovered from `avatar-vault.js` (main, reference only — legacy `window.BQ*`, not valid v3 shape): 15 metric-gated cosmetic styles; selection in `localStorage` with optional Supabase sync to `bible_avatar_cosmetics` / `bible_congregation_members`; avatar-render patch overlay for the cosmetic glyph.

Existing v3 owners to reuse: `src/app/session.js`, `src/app/store.js` (owner-scoped `privateStorage`), `src/app/router.js`; `src/app/personality-profile.js` + `src/features/personality-profile/` is the closest existing select/persist/render pattern.

## #82 progress: backend + leaderboard wiring committed (in progress, not yet Implemented)

Committed on `feature/v3-avatar-vault` (not yet gated, not yet wired into the running app):
- `supabase/migrations/20260910_avatar_vault_visibility.sql` — adds the `avatar` jsonb column on `bible_congregation_members` that `20260905_congregation_member_column_hardening.sql` granted column privileges for but never created, plus the missing self-update RLS policy (the grant alone was insufficient with RLS enabled and no matching policy — a real pre-existing gap, not introduced by #82).
- `src/engines/avatar-vault.js` — pure unlock/scoring owner. All 15 legacy styles retained for catalog parity; only xp/streak-gated styles (`starter`,`sakura`,`lantern`,`flame`,`crown`) are `available:true` in v1 because Progress (`src/core/progress.js`) only exposes xp/streak today. The other 10 styles (answered/correct question counts, recall-deck reps, couples conversations, group sessions, assignment completions, Journey region mastery) are retained with `available:false` and a `needsOwner` tag — explicitly deferred, not silently broken.
- `src/app/avatar-vault.js` — lifecycle/persistence owner reusing Session (owner identity) and Progress (metrics); persists locally via `privateStorage` and syncs authenticated selections through the API boundary only.
- `src/core/api.js` — new `avatarVault.load/save`; `save` upserts `bible_avatar_cosmetics` and updates `bible_congregation_members.avatar` in one flow. Leaderboards' congregation directory query now selects `avatar` (`LEADERBOARD_DIRECTORY_FIELDS`) instead of the no-avatar `TEAM_DIRECTORY_FIELDS`.
- `src/app/leaderboards.js` — `normalizeDirectory` now sanitizes and carries `avatar.cosmetic` through into ranked rows.

Not yet done, and explicitly the next steps (in order):
1. Wire `createAvatarVaultService` into `src/app/bootstrap.js` (not yet touched).
2. Build `src/features/avatar-vault/` presentation (browse/select UI) and register it in the router/more-menu; render the cosmetic icon (`iconFor` from the engine) next to leaderboard rows in `src/features/leaderboards/`.
3. Author `scripts/validate-v3-avatar-vault.mjs` and edge/unit tests, following the #81 pattern, including a check that undeployed-metrics styles stay `available:false`.
4. Targeted checks green, then the full isolated functional gate (checkout + exact-SHA assertion + complete accumulated suite) before any Verified/bookkeeping claim.
5. Revisit the 10 deferred styles as a follow-up sub-milestone once their source owners (reader/recall, couples, community, assignments, Journey mastery) exist or expose the needed counts — do not backfill by duplicating counting logic in Avatar Vault.

No test has been executed against this candidate yet; do not treat any of the above as Verified or even complete "Implemented" until targeted + full gates actually run.

## Exact next executable sequence

1. Recover exact old-version #82 contract detail (unlock conditions incl. mastery/region logic, cloud sync retry/failure behavior, guest-vs-account boundary, mobile rendering) from `avatar-vault.js`, the `bible_avatar_cosmetics` schema, and any related tests.
2. Build the smallest clean implementation on `feature/v3-avatar-vault`: single scoring/unlock owner, single lifecycle/persistence owner reusing `session.js`/`store.js`, presentation-only `src/features/avatar-vault/`, reusing `router.js` for navigation — no duplicate storage/shell/avatar ownership.
3. Targeted architecture validator + edge/unit regression + focused browser/mobile regression first.
4. Full functional gate on an isolated `verify/...` branch (checkout + exact-SHA assertion + complete accumulated suite) once targeted checks are green.
5. On green, promote #82 to Verified, do bookkeeping, gate the bookkeeping candidate, then freeze `release/v3.55-avatar-vault`.
6. Only then create the next feature branch and begin #83 Innovation suite.

## Non-negotiable continuation rules

- Rebuild-and-verify; never patch-and-accumulate.
- One source of truth per responsibility.
- Never claim a test passed unless it actually executed against the claimed SHA.
- No PASS transfer between changed SHAs.
- Normal Actions remain manual-only; temporary `push:` belongs only on isolated verification branches.
- Never weaken/delete/skip accumulated regression coverage to get green.
- Never modify `main`, production v2, production Cloudflare or production Supabase without separate explicit authorization.
- Never move an existing frozen `release/v3.*` or safety ref.
