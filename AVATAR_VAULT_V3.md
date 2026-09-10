# BibleQuest v3 Avatar Vault Contract

Milestone #82 is bounded to the authoritative inventory requirement: **browse; select; persist; render fallback**.

## Retained compatibility evidence

The retained standalone `avatar-vault.js` contains 15 cosmetic avatar styles unlocked by account-wide metrics (streak, XP, question counts, recall-deck repetitions, couples conversations, group sessions, leader assignments, Journey region mastery), persisted to `localStorage` plus an optional Supabase sync (`bible_avatar_cosmetics`, `bible_congregation_members.avatar`), and an avatar-render patch overlay for a cosmetic glyph.

## v1 scope decision (recorded, not silent)

The v3 Progress owner (`src/core/progress.js`) exposes only `xp` and `streak` today. The other legacy metrics (question answer/correct counts, recall-deck repetitions, couples conversation count, community group-session count, assignment completions, Journey region mastery) have no v3 owner that exposes a simple count yet.

Per rebuild-and-verify discipline (recover behavior, do not invent it, do not duplicate counting ownership), #82 v1 therefore:
- retains **all 15 styles** in `src/engines/avatar-vault.js` for catalog parity;
- marks 5 styles `available:true` and evaluable now: `starter`, `sakura` (7-day streak), `lantern` (500 XP), `flame` (30-day streak), `crown` (2,500 XP);
- marks the remaining 10 styles `available:false` with a `needsOwner` tag identifying the missing v3 metric owner; they render as "Coming soon" and can never evaluate as unlocked until that follow-up integration lands;
- this is an explicit, recorded deferral consistent with "respect explicitly deferred capabilities in the inventory/handoff."

## v3 ownership

- `src/engines/avatar-vault.js` is the sole style catalog and unlock/scoring owner. Pure functions only; no DOM, storage, network, or Progress access — metrics are passed in already normalized.
- `src/app/avatar-vault.js` owns lifecycle, owner-scoped local persistence (`privateStorage`) and cloud sync delegation. It reuses `session` for owner identity and `progress` for xp/streak; it does not read `localStorage` directly and does not call Supabase directly.
- `src/core/api.js` is the sole Supabase/API boundary; `avatarVault.load`/`avatarVault.save` are its only #82 methods. `save` upserts `bible_avatar_cosmetics` (private selection/unlock record) and updates `bible_congregation_members.avatar` for the signed-in user in one flow.
- `src/features/avatar-vault/index.js` owns presentation and event forwarding only.
- `src/app/leaderboards.js` (existing Leaderboards owner) and `src/features/leaderboards/index.js` are extended, not duplicated: the directory query now selects `avatar`, `normalizeDirectory` passes through a sanitized `{cosmetic}` shape, and rendering uses the engine's `iconFor` helper. No new leaderboard ownership is introduced.
- `src/app/router.js` remains the sole navigation/history owner; #82 requests navigation through bootstrap callbacks (`avatar-vault` route).
- #82 does not change `src/engines/psychometrics.js`, `src/app/personality-profile.js`, or `src/core/progress.js` ownership boundaries.

## Persistence and account boundary

- Guest owner: device-only, key `avatar-vault:guest`, via `privateStorage`. No cloud sync attempted.
- Signed-in owner: device cache at `avatar-vault:account:<user id>` plus authoritative cloud state in `bible_avatar_cosmetics` (own-row RLS) and `bible_congregation_members.avatar` (self-update RLS, congregation-member-readable — this is what makes the cosmetic visible to others on the leaderboard).
- Cloud writes are best-effort: `select()` always keeps the device-local equip authoritative for the current session even if the cloud sync fails, and reports `synced:false` so the UI can say sync will retry.
- Selecting a style the current owner has not unlocked fails closed (`BQ_AVATAR_VAULT_LOCKED`) and does not persist.

## Backend completion

`20260905_congregation_member_column_hardening.sql` granted column-level `UPDATE (display_name, avatar)` on `bible_congregation_members` for a column that was never created, and there was no RLS UPDATE policy on that table at all — the grant alone could not have worked. `20260910_avatar_vault_visibility.sql` adds the `avatar jsonb` column and the missing self-update RLS policy. This is additive/non-destructive and does not touch production Supabase directly; it is a repository migration file pending separate deployment authorization per the production-safety rule.

## Scope exclusions

#82 v1 does not:
- implement the 10 deferred metric-gated styles (tracked above, explicit follow-up);
- write to `bible_profiles` (legacy also wrote there; v3 uses `bible_congregation_members.avatar` as the single cross-user-visible source, avoiding duplicate state);
- change Team Center's own congregation-directory query (`TEAM_DIRECTORY_FIELDS` is unchanged; only Leaderboards' directory query was extended);
- copy legacy `window.BQ_*` globals or patch a global avatar-render function;
- migrate unrelated Innovation, Tutorial, Accessibility, Content Reporting/Moderation or Admin capabilities.

## Acceptance

#82 is not complete until permanent tests prove:
- the 5 available styles evaluate deterministically from injected xp/streak metrics, including exact threshold boundaries;
- the 10 deferred styles never evaluate as unlocked regardless of metrics, and are visibly marked unavailable;
- `starter` is always unlocked and cannot be un-equipped by locking;
- selecting a locked style fails closed and does not persist;
- guest and per-account owner state remain isolated and private/non-portable, mirroring the Psychometrics/Personality Profile pattern;
- a failed cloud sync keeps the device-local equip authoritative and is visibly reported, not silently swallowed;
- the leaderboard directory row for a member carries their equipped cosmetic icon;
- the real Avatar Vault surface is usable at 390px with no horizontal overflow;
- #81 Psychometrics remains a separate owner and is unaffected;
- the complete accumulated v3 suite passes on an exact functional candidate and again on the changed exact bookkeeping candidate before `release/v3.55-avatar-vault` freezes.

## Exact functional verification evidence

Not yet available. No candidate SHA for #82 has been verified by an isolated gate at the time this contract was written.
