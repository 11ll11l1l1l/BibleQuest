# BibleQuest v3 Architecture Contract

BibleQuest v3 uses rebuild-and-verify, not patch-and-accumulate. Feature parity and stability remain separate acceptance goals.

## Active single owners

- `src/app/bootstrap.js` — composition/one boot
- `src/app/router.js` — navigation/history
- `src/app/store.js` — global application state
- `src/core/storage.js` — browser persistence boundary
- `src/core/api.js` — Supabase/remote calls, including protected media data
- `src/app/session.js` — auth/session/password lifecycle
- `src/app/account.js` — signup/recovery/device workflows
- `src/core/bible.js` — Bible sources/packs/search/external links
- `src/app/reader.js` — reader state/navigation/read marking
- `src/core/progress.js` — XP/streak/activity/badges/counters
- `src/core/recall-packs.js` — Per-book Recall manifest/question-pack loading, validation, approval filtering, and cache
- `src/engines/lesson.js` — guided lesson lifecycle
- `src/app/daily-mission.js` — Daily Journey orchestration
- `src/engines/transform.js` — Transform state/scoring/persistence
- `src/app/transform.js` — Transform cross-service orchestration only
- `src/app/audio.js` — one browser media/player instance and playback command lifecycle
- `src/app/recordings.js` — protected recordings list/source selection/switch/leave lifecycle
- `src/app/media-library.js` — Media Library browse/filter/open orchestration over the verified Recordings owner
- `src/app/games.js` — one Games launcher/round/scoring/review/result-persistence lifecycle

## Transform boundaries

1. `src/engines/transform.js` alone owns spiritual/personality/bias/reflection Transform state and derived results.
2. `src/features/transform/content.js` is the definition source; UI never recalculates result logic.
3. `src/app/transform.js` coordinates Transform results with `src/core/progress.js`, but owns no Transform state and accesses no storage implementation.
4. Basic and Full completion use deterministic progress events; reopening or recalculating cannot duplicate XP/counters.
5. Old `window.BQ_TRANSFORMATION`, direct `localStorage`, standalone account gates, body modals, mutable runtime page indexes, and runtime-recovery loaders are forbidden in v3.
6. Transform is private reflection; its results are not diagnosis, spiritual ranking, or a measure of divine approval.

## Audio / Live Recordings boundaries

1. `src/app/audio.js` is the only v3 owner allowed to create, replace, command, or destroy an embedded media player.
2. At most one `[data-bq-audio-player]` iframe may exist for the active Audio owner. Loading a new source tears the old frame down before creating the new one.
3. YouTube replay playback uses a single `youtube-nocookie.com` iframe with direct postMessage commands. v3 must not inject the YouTube iframe API script, global callbacks, MutationObservers, or document-global player registries.
4. `src/app/recordings.js` alone owns protected recordings data state, selected source, switch lifecycle, leave cleanup, and recoverable list errors. It talks to the Audio owner and media API only.
5. `src/features/recordings/index.js` is presentation only. It does not create iframes, call Supabase, or own player state.
6. `src/core/api.js` remains the only Supabase boundary. Media list requests are bounded; guest mode is stopped before a protected media request is made.
7. Leaving any playback route unloads the active player. Returning creates a clean view over the same owners rather than another player runtime.
8. A failed or unsupported media source must surface a recoverable state while the BibleQuest shell remains usable.
9. The v2 `window.BQMediaLibrary`/body-layer/MutationObserver/document-handler implementation is behavioral reference only and must not be imported into v3.

## Media Library boundaries

1. `src/app/media-library.js` is the only owner of Media Library browse state: all/featured view, search query, current library selection, and route-local leave/reset behavior.
2. Media Library does not query Supabase directly. It consumes the already-verified `src/app/recordings.js` list contract, preserving one protected-media data path.
3. Media Library does not create or command an iframe directly. Opening an item delegates to Recordings, which delegates to the single Audio owner.
4. Browse filtering/search is local and deterministic. Changing browse filters tears down active playback before rerendering the library.
5. `src/features/media-library/index.js` is presentation only and cannot import backend/player implementation details.
6. Guest/account separation is inherited from the Recordings owner; a guest Media Library load must make no media API request.
7. The supported parity surface is the published YouTube replay media actually exposed by the old operational `bible_media_library` path. v3 does not invent unsupported PDF/audio/document types during parity reconstruction.
8. Leave/return must reset route-local library state and leave zero hidden player instances or leaked listeners.

## Games boundaries

1. `src/app/games.js` is the only v3 owner of game launch, active round state, answer/reveal locking, score, XP handoff, replay, switch, leave, review queues, and persisted game result summaries.
2. `src/features/games/content.js` is the built-in quiz mode/question definition source. UI does not construct a competing question bank.
3. `src/core/recall-packs.js` is the only owner allowed to fetch `data/packs/manifest.json` and `data/packs/questions/*`. It validates manifest paths, validates pack shape, caches on demand, and excludes any question whose safety action is not `allow`.
4. `src/features/games/index.js` is presentation and event forwarding only. It does not fetch packs, write progress, call browser storage, call Supabase, or create its own navigation runtime.
5. Game progress writes go only through `src/core/progress.js`. The launcher never mutates XP/streak/badges directly.
6. Persisted round summaries, Per-book Recall review queues, and study statistics go only through the injected `src/core/storage.js` boundary. No game module uses `localStorage` or `sessionStorage` directly.
7. Starting another mode replaces the active round inside the same owner. Leaving Play tears the round down; returning creates a clean launcher rather than another listener/runtime instance.
8. Quick Recall, Context Challenge, and Mixed Quest are frozen through `release/v3.11-mixed-quest`. New game modes extend the same owner rather than adding parallel launch/scoring engines.
9. Per-book Recall reuses retained unfoldingWord Translation Questions v90 data assets only. The old global deck runtime is reference behavior and is not imported.
10. Per-book Recall preserves on-demand book loading, reveal-before-rating, `Review again` / `Got it`, +1/+5 XP parity, a persistent per-book review queue, study/result persistence, and CC BY-SA 4.0 attribution.

## Global hard boundaries

One boot, one router, one session owner, one storage boundary, one API boundary, one Bible service, one reader state owner, one progress owner, one Recall Pack data owner, one lesson engine, one Transform engine, one Audio owner, one Recordings owner, one Media Library orchestration owner, and one Games launcher owner. Features render only inside the shell and clean up listeners. No v3 source depends on legacy `window.BQ*` globals.

## Milestone order

Foundation → Account → Reader → Progress → Lesson Engine → Daily Mission → Transform → Audio/Live Recordings/Media → Games → Bible World → Tutorial → remaining parity → full audit → mobile regression → production deployment.

Known-good frozen releases now extend through `release/v3.11-mixed-quest`; Games core is independently frozen at `release/v3.10-games-core`, Media Library at `release/v3.9-media-library`, Audio/Recordings at `release/v3.8-audio-recordings`, and Transform at `release/v3.7-transform-complete`. Production remains isolated on v2 until parity and stability release gates pass.
