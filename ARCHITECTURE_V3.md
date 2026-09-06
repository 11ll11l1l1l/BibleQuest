# BibleQuest v3 Architecture Contract

BibleQuest v3 uses rebuild-and-verify, not patch-and-accumulate. Feature parity and stability remain separate acceptance goals.

## Active single owners

- `src/app/bootstrap.js` — composition/one boot
- `src/app/router.js` — navigation/history
- `src/app/store.js` — global application state
- `src/core/storage.js` — browser persistence boundary
- `src/core/api.js` — Supabase/remote calls
- `src/app/session.js` — auth/session/password lifecycle
- `src/app/account.js` — signup/recovery/device workflows
- `src/core/bible.js` — Bible sources/packs/search/external links
- `src/app/reader.js` — reader state/navigation/read marking
- `src/core/progress.js` — XP/streak/activity/badges
- `src/engines/lesson.js` — guided lesson lifecycle
- `src/app/daily-mission.js` — Daily Journey orchestration
- `src/engines/transform.js` — Transform state/scoring/persistence
- `src/app/transform.js` — Transform cross-service orchestration only

## Transform boundaries

1. `src/engines/transform.js` alone owns spiritual/personality/bias/reflection Transform state and derived results.
2. `src/features/transform/content.js` is the definition source; UI never recalculates result logic.
3. `src/app/transform.js` may coordinate Transform results with `src/core/progress.js`, but owns no Transform state and accesses no storage implementation.
4. Basic Transform completion uses deterministic event `transform:spiritual:v1:complete`; reopening, recalculating, or retaking cannot duplicate that version’s XP/Reflection metric.
5. Cross-service recovery is result-first then progress reconciliation: a saved Transform result survives a progress-write failure and heals the missing idempotent event on reopen.
6. `src/features/transform/index.js` renders Basic Transform only and talks only to the Transform orchestration service.
7. Full Transform Big Five/thinking-pattern/journal UI remains unimplemented until Basic Transform is independently promoted.
8. Old `window.BQ_TRANSFORMATION`, direct `localStorage`, standalone account gate, body modal, mutable runtime page indexes, and runtime-recovery loader are forbidden in v3.
9. Transform is private reflection; spiritual ratings are not a spiritual score, diagnosis, moral ranking, or measure of divine approval.

## Global hard boundaries

One boot, one router, one session owner, one storage boundary, one Bible service, one reader state owner, one progress owner, one lesson engine, and one Transform engine. Features render only inside the shell and clean up listeners. No v3 source depends on legacy `window.BQ*` globals. Audio/recording/games remain untouched until their milestones.

## Milestone order

Foundation → Account → Reader → Progress → Lesson Engine → Daily Mission → Transform → Audio/Live Recordings → Games → Bible World → Tutorial → remaining parity → full audit → mobile regression → production deployment.

Known-good frozen releases through `release/v3.6-daily-mission`; Transform freezes only after #48, #46, and #47 all pass their own acceptance plus the final exact ledger regression. Production remains isolated v2.
