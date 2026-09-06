# BibleQuest v3 Architecture Contract

BibleQuest v3 uses rebuild-and-verify, not patch-and-accumulate. Feature parity and stability remain separate acceptance goals.

## Active single owners

- `src/app/bootstrap.js` — composition/one boot
- `src/app/router.js` — navigation/history
- `src/app/store.js` — global application state
- `src/core/storage.js` — browser persistence boundary
- `src/core/api.js` — Supabase/remote calls, including recordings data
- `src/app/session.js` — auth/session/password lifecycle
- `src/app/account.js` — signup/recovery/device workflows
- `src/core/bible.js` — Bible sources/packs/search/external links
- `src/app/reader.js` — reader state/navigation/read marking
- `src/core/progress.js` — XP/streak/activity/badges/counters
- `src/engines/lesson.js` — guided lesson lifecycle
- `src/app/daily-mission.js` — Daily Journey orchestration
- `src/engines/transform.js` — Transform state/scoring/persistence
- `src/app/transform.js` — Transform cross-service orchestration only
- `src/app/audio.js` — one browser media/player instance and playback command lifecycle
- `src/app/recordings.js` — recordings list/source selection/switch/leave lifecycle

## Transform boundaries

1. `src/engines/transform.js` alone owns spiritual/personality/bias/reflection Transform state and derived results.
2. `src/features/transform/content.js` is the definition source; UI never recalculates result logic.
3. `src/app/transform.js` coordinates Transform results with `src/core/progress.js`, but owns no Transform state and accesses no storage implementation.
4. Basic and Full completion use deterministic progress events; reopening or recalculating cannot duplicate XP/counters.
5. Old `window.BQ_TRANSFORMATION`, direct `localStorage`, standalone account gates, body modals, mutable runtime page indexes, and runtime-recovery loaders are forbidden in v3.
6. Transform is private reflection; its results are not diagnosis, spiritual ranking, or a measure of divine approval.

## Audio / Live Recordings boundaries

1. `src/app/audio.js` is the only v3 owner allowed to create, replace, command, or destroy an embedded recording player.
2. At most one `[data-bq-audio-player]` iframe may exist for the active Audio owner. Loading a new source tears the old frame down before creating the new one.
3. YouTube replay playback uses a single `youtube-nocookie.com` iframe with direct postMessage commands. v3 must not inject the YouTube iframe API script, global callbacks, MutationObservers, or document-global player registries.
4. `src/app/recordings.js` alone owns recordings list state, selected source, switch lifecycle, leave cleanup, and recoverable list errors. It talks to the Audio owner and media API only.
5. `src/features/recordings/index.js` is presentation only. It does not create iframes, call Supabase, or own player state.
6. `src/core/api.js` remains the only Supabase boundary. Live-recording list requests are bounded and RLS-scoped; guest mode is stopped by the recordings service before a media request is made.
7. Leaving the recordings route always unloads the active player. Returning creates a clean view over the same owners rather than another player runtime.
8. A failed/unsupported media source must surface a visible recoverable state while the BibleQuest shell remains usable.
9. The v2 `window.BQMediaLibrary`/body-layer/MutationObserver/document-handler implementation is behavioral reference only and must not be imported into v3.

## Global hard boundaries

One boot, one router, one session owner, one storage boundary, one API boundary, one Bible service, one reader state owner, one progress owner, one lesson engine, one Transform engine, one Audio owner, and one Recordings owner. Features render only inside the shell and clean up listeners. No v3 source depends on legacy `window.BQ*` globals.

## Milestone order

Foundation → Account → Reader → Progress → Lesson Engine → Daily Mission → Transform → Audio/Live Recordings → Games → Bible World → Tutorial → remaining parity → full audit → mobile regression → production deployment.

Known-good frozen releases now extend through `release/v3.7-transform-complete` at `e91ab8be922420ef7ab48b1ffde5dcb3db4a4634`. Production remains isolated on v2 until parity and stability release gates pass.
