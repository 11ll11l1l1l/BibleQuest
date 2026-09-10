# BibleQuest v3 Avatar Vault Contract

Milestone #82 is bounded to the authoritative inventory requirement: **browse; select; persist; render fallback**.

## Retained compatibility evidence

The retained standalone `avatar-vault.js` contains 15 cosmetic avatar styles unlocked by account-wide metrics (streak, XP, question counts, recall-deck repetitions, couples conversations, group sessions, leader assignments, Journey region mastery), persisted to `localStorage` plus optional Supabase sync (`bible_avatar_cosmetics`, `bible_congregation_members.avatar`), and an avatar-render overlay for the cosmetic glyph.

The retained cloud path preserved the existing avatar object when adding `cosmetic`; it did not intentionally replace unrelated avatar fields. Reopening the legacy Vault also re-attempted cloud synchronization.

## v1 scope decision (recorded, not silent)

The v3 Progress owner (`src/core/progress.js`) exposes only `xp` and `streak` today. The other legacy metrics (question answer/correct counts, recall-deck repetitions, couples conversation count, community group-session count, assignment completions, Journey region mastery) have no v3 owner that exposes a simple count yet.

Per rebuild-and-verify discipline (recover behavior, do not invent it, do not duplicate counting ownership), #82 v1 therefore:
- retains **all 15 styles** in `src/engines/avatar-vault.js` for catalog parity;
- marks 5 styles `available:true` and evaluable now: `starter`, `sakura` (7-day streak), `lantern` (500 XP), `flame` (30-day streak), `crown` (2,500 XP);
- marks the remaining 10 styles `available:false` with a `needsOwner` tag identifying the missing v3 metric owner; they render as "Coming soon" and cannot evaluate as unlocked until that follow-up integration lands;
- treats the ten-style gap as an explicit follow-up, not as invented duplicate progress ownership.

## v3 ownership

- `src/engines/avatar-vault.js` is the sole style catalog and unlock-evaluation owner. Pure functions only; no DOM, storage, network, or Progress access.
- `src/app/avatar-vault.js` owns lifecycle, owner-scoped local persistence (`privateStorage`) and cloud sync/reopen reconciliation. It reuses `session` for owner identity and `progress` for xp/streak.
- `src/core/api.js` remains the sole browser Supabase/API boundary; `avatarVault.load`/`avatarVault.save` are the compatibility methods used by #82.
- The database owns the cross-table projection invariant through `20260910_avatar_vault_integrity_reconcile.sql`: cosmetic selection is projected into congregation-visible avatar state in the same database transaction as the cosmetics upsert, and cosmetic-only avatar updates are field-preserving.
- `src/features/avatar-vault/index.js` owns presentation and event forwarding only.
- Existing Leaderboards/Recognition owners consume congregation-visible avatar data; Avatar Vault does not become a congregation-profile owner.
- `src/app/router.js` remains the sole navigation/history owner.

## Persistence, recovery and account boundary

- Guest owner: device-only, key `avatar-vault:guest`, via `privateStorage`. No cloud sync attempted.
- Signed-in owner: device cache at `avatar-vault:account:<user id>` plus cloud selection in `bible_avatar_cosmetics` and congregation-visible cosmetic projection in `bible_congregation_members.avatar`.
- `select()` keeps the device equip usable if cloud confirmation fails and reports `synced:false`.
- `load()` normalizes the remote selection against the styles currently earned from the verified local Progress owner, retains a safe local fallback, and re-runs the idempotent cloud save. This is the reopen reconciliation path for a previous partial/uncertain synchronization.
- Database projection merges `cosmetic` into the existing avatar JSON. Existing `face`, `outfit`, `companion`, `background`, and future unrelated avatar keys must survive a cosmetic change.
- Selecting a style the current owner has not unlocked fails closed (`BQ_AVATAR_VAULT_LOCKED`) and does not persist through the normal app path.

## Public-cosmetic trust classification

The current v3 Progress facts used for the five unlock rules are device/client state, not server-authoritative progression facts. Therefore a congregation-visible cosmetic is **decorative self-presentation** and **not trusted proof** that an unlock requirement was earned.

Consequences:
- browser/app unlock checks remain the normal UX gate;
- a cosmetic must never grant XP, score, rank, permission, ministry role, assignment authority, doctrinal/spiritual status, or any other trusted capability;
- Leaderboards may render the cosmetic beside a member name, but ranking is independent of it;
- if a future requirement needs public cosmetics to certify earned achievements, that requires a separately reviewed trusted progression authority/server mutation. #82 does not invent that authority.

## Backend correction after v3.55 investigation

The first #82 migration, `20260910_avatar_vault_visibility.sql`, remains immutable history in the frozen v3.55 release. Subsequent read-only live inspection showed that the production project already has a structured `bible_congregation_members.avatar` and an existing membership-qualified public-profile UPDATE policy. The corrective migration `20260910_avatar_vault_integrity_reconcile.sql` therefore moves forward rather than rewriting history:

- removes the redundant `members self avatar update` policy;
- establishes one membership-qualified `members update own public profile` UPDATE policy using both `auth.uid() = user_id` and active congregation membership;
- aligns the fresh-install avatar default with the structured live default;
- adds a narrow cosmetic-only BEFORE UPDATE merge guard so the v3.55 `{cosmetic: ...}` compatibility write cannot erase unrelated avatar fields;
- adds an AFTER INSERT/UPDATE projection from `bible_avatar_cosmetics` to the user's active congregation rows. The projection executes inside the cosmetics write transaction, so projection failure prevents that selection transaction from committing as a split private/public state.

This migration is repository code only. It does **not** authorize or perform production Supabase deployment.

## Scope exclusions

#82 does not:
- implement the 10 deferred metric-gated styles by creating duplicate counters;
- make public cosmetic state trusted progression evidence;
- write to `bible_profiles` as a second public avatar source;
- change Team Center's directory ownership;
- copy legacy `window.BQ_*` globals or patch a global avatar-render function;
- absorb #83 Innovation, Tutorial, Accessibility, Content Reporting/Moderation or Admin capabilities.

## TEST/FIXTURE DEFECT correction

The original #82 validator asserted implementation strings that allowed the destructive `{cosmetic}` replacement path and did not require the permanent Avatar Vault smoke invocation. That was a verification-design defect: the test shape did not protect the intended persistence semantics. The correction strengthens, rather than weakens, the original assertions by requiring:
- field-preserving database merge/projection invariants;
- reopen reconciliation in the app owner;
- the existing #82 edge suite;
- the real 390px Avatar Vault smoke in the accumulated workflow.

No earlier semantic acceptance assertion is removed to obtain green.

## Acceptance

#82 corrective acceptance requires permanent evidence that:
- the 5 available styles evaluate deterministically from injected xp/streak metrics, including exact threshold boundaries;
- the 10 deferred styles never evaluate as unlocked through nonexistent metric owners and remain visibly marked unavailable;
- `starter` is always unlocked and invalid/locked remote selection fails closed to an earned local selection;
- guest and account owner state remain isolated;
- failed/uncertain cloud synchronization retains device state and is retried on reopen;
- database migration semantics preserve unrelated avatar JSON fields and project the selected cosmetic transactionally from `bible_avatar_cosmetics`;
- public cosmetic state is decorative only and is not used by score/rank/permission/spiritual authority;
- Leaderboards/Recognition remain compatible with the full avatar object;
- the real Avatar Vault surface is executable-tested at 390px with no horizontal overflow;
- all accumulated prior regressions remain invoked;
- a new exact corrective functional candidate passes the complete accumulated suite before any corrective release is frozen or #83 is resumed.

## Verification status

Frozen `release/v3.55-avatar-vault` at `60100f0c0a5fa6a0b2b0a7c89eaf39836cfb3712` is immutable historical evidence. The post-freeze investigation reproduced integrity/trust-boundary defects not covered by that gate. The corrective branch must therefore obtain its own exact complete gate; no PASS transfers from v3.55.
