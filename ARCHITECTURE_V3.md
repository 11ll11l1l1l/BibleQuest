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
- `src/app/reader.js` — Reader state/navigation/read marking
- `src/core/progress.js` — XP/streak/activity/badges/counters/events
- `src/core/recall-packs.js` — Recall pack loading/validation/cache
- `src/engines/lesson.js` — one shared lesson lifecycle/state/persistence engine
- `src/app/study.js` — Guided Study orchestration over Lesson
- `src/app/deep-questions.js` — Deep Questions orchestration over Lesson
- `src/app/story-journey.js` — Story Journey orchestration over Lesson/Progress/Reader
- `src/app/wisdom-situations.js` — Wisdom Situations orchestration over Lesson/Progress
- `src/app/daily-mission.js` — Daily Journey orchestration
- `src/engines/transform.js` — Transform state/scoring/persistence
- `src/app/transform.js` — Transform cross-service orchestration only
- `src/app/audio.js` — one browser media/player lifecycle
- `src/app/recordings.js` — protected recording list/source lifecycle
- `src/app/media-library.js` — Media Library orchestration over Recordings
- `src/app/games.js` — one Games launcher/round/scoring/review/result lifecycle

## Bible-study shared boundaries

1. `src/engines/lesson.js` is the only reusable lesson/session/step/response persistence engine. Guided Study, Deep Questions, Story Journey, Wisdom Situations, adaptive study, or pastor-linked study activities must not create parallel lesson runtimes when the shared contract fits.
2. Feature `content.js` modules are static definitions only. They cannot own storage, backend calls, navigation, Progress mutation, or DOM lifecycle.
3. Feature `index.js` modules are presentation/event forwarding only. They cannot call storage/backend owners directly or calculate competing lifecycle state.
4. `src/app/reader.js` remains the only Reader state owner. Study features delegate Scripture handoff through it when the retained behavior requires one.
5. `src/core/progress.js` remains the only XP/streak/activity/counter/event owner. A study feature cannot mutate XP or counters directly.
6. Reflection/application text is never interpreted as a spiritual-quality score, diagnosis, moral rank, or measure of divine approval.
7. Persisted Lesson definitions use explicit versions; version changes invalidate incompatible stale sessions through the shared Lesson contract instead of feature-specific migration patches.
8. Parity rewards are retained only when verified from the old implementation; new study features do not invent XP schemes.

## Guided Study boundaries

1. `src/features/study/content.js` contains static curated study definitions only.
2. `src/app/study.js` owns library selection, open/resume/restart, completion reconciliation, Reader handoff, and close only.
3. Per-step response/validation/persistence remains in Lesson.
4. Completion uses one deterministic Progress identity and cannot duplicate activity on reopen.
5. No unverified XP scheme is invented; current verified completion records `xp: 0`, meaningful activity, and one reflection metric.

## Deep Questions boundaries

1. `src/features/deep-questions/content.js` contains the 18 retained static definitions only.
2. `src/app/deep-questions.js` owns selection, featured rotation, open/resume/restart, Reader handoff, and close.
3. Deep Questions creates no separate storage key or note runtime; its private note is a Lesson text response.
4. Deep Questions has no Progress dependency because the retained parity path did not award XP.
5. Open reflection choices are unscored; Scripture/reflection reveal follows the initial response.

## Story Journey boundaries

1. `src/features/story-journey/content.js` is the sole retained Story Journey definition source. It contains 10 immutable stories, their five scene texts, checkpoint choices/answers/references, and Lesson definitions only.
2. `src/app/story-journey.js` is the single Story Journey orchestration owner. It owns library selection, random selection, open/resume/restart/another, checkpoint-to-Progress reconciliation, Reader handoff, and close.
3. Scene progression, checkpoint response locking, completion state, attempt identity, and persistence remain exclusively in `src/engines/lesson.js`.
4. Story Journey never writes browser storage directly and never owns a backend path.
5. Story Journey rewards are parity behavior, not invented values: correct checkpoint `+15 XP`; incorrect checkpoint `+4 XP`; a correct answer contributes exactly one `quizCorrect` metric.
6. Reward writes go only through `src/core/progress.js` using deterministic event id `story-journey:<story>:v<definitionVersion>:<startedAt>`. Reopening a completed attempt must reconcile as duplicate and award nothing.
7. Restart creates a new Lesson attempt with a new `startedAt`, allowing that new attempt to earn its checkpoint reward once. Repeated reads of the same completed attempt cannot farm XP.
8. Reader handoff delegates to `src/app/reader.js`; Story Journey cannot own Bible book/chapter state.
9. `src/features/story-journey/index.js` is presentation/event forwarding only and cannot import Lesson, Progress, storage, API, or Reader implementation internals.
10. Story Journey styling is isolated to `src/ui/story-journey.css`; the stable Learn shell contract remains unchanged.
11. Story Journey must remain compatible with 390px mobile no-overflow and >=44px touch controls.

## Wisdom Situations boundaries

1. `src/features/wisdom-situations/content.js` is the sole retained Wisdom definition source and contains all 24 immutable recovered situations plus their one-step Lesson definitions.
2. `src/app/wisdom-situations.js` is the single Wisdom orchestration owner. It owns random selection, immediate-repeat avoidance, open/resume/restart/another, answer-to-Progress reconciliation, and close.
3. Choice locking, strongest-option evaluation, attempt identity, completion state, restart, and session persistence remain exclusively in `src/engines/lesson.js`.
4. Wisdom never writes browser storage directly, never owns a backend path, and never creates a parallel scoring/session runtime.
5. The recovered v2 completion reward is parity behavior: every answered attempt awards `+8 XP` and increments the central `situations` metric by one regardless of whether the strongest option was selected.
6. Choosing the strongest supported option does not increment `quizCorrect`, does not award additional XP, and is not treated as a score of spiritual quality, moral worth, or divine approval.
7. Reward writes go only through `src/core/progress.js` using deterministic event id `wisdom-situation:<id>:v<definitionVersion>:<startedAt>`. Reopening the same completed attempt must reconcile as duplicate and award nothing.
8. Restart or a newly selected situation creates a new Lesson attempt with a new `startedAt`, allowing that attempt to earn the retained completion reward once.
9. The pre-answer public snapshot does not expose the strongest answer, rationales, or Scripture references. After the first locked answer, presentation may reveal the strongest supported option, all four rationales, and references.
10. `src/features/wisdom-situations/index.js` is presentation/event forwarding only and cannot import Lesson, Progress, storage, API, or backend implementation internals.
11. `src/ui/wisdom-situations.css` owns Wisdom styling; the stable Learn `<h1>Learn</h1>` contract remains unchanged.
12. Wisdom must remain compatible with 390px mobile no-overflow and >=44px touch controls.

## Future adaptive-study boundaries

1. #53 Adaptive learning may select content using mastery/weak-area data but must not become a second Lesson engine or second Progress owner.
2. #54 Open/weak-area review should generate review queues through one defined owner/service and feed verified activities rather than duplicate their scoring/persistence logic.
3. Any mastery model introduced for #53 must use one explicit owner and must not reinterpret open reflection text or Wisdom judgments as spiritual quality.

## Future Devotional / Ministry boundaries

The detailed design contract is `DEVOTIONAL_MINISTRY_DESIGN_V3.md`; documentation does not mark ministry rows implemented.

1. Message, Devotional, and Task are first-class ministry post types under one ministry post/task identity.
2. Pastor/Admin authoring uses one freeform ministry composer/service model shared by Ministry Hub, Inbox, Workspace, Assignments, and later push delivery.
3. A member may read the published post, their own Task response, and permitted aggregate counts only.
4. Another member's response body must never be delivered to an ordinary member client.
5. Pastor/Admin response review is role- and congregation-scoped.
6. Response privacy is enforced by backend authorization/RLS/API shape, not UI hiding.
7. Aggregate counts such as `18 answered` must come from an authorized aggregate query/view/RPC or equivalent service contract.
8. Assignment Push (#75) layers delivery/notification on the same ministry post/task identity; it cannot create a second assignment system.

## Transform boundaries

1. `src/engines/transform.js` alone owns Transform state and derived results.
2. `src/features/transform/content.js` is the definition source; UI never recalculates results.
3. `src/app/transform.js` coordinates with Progress but owns no competing Transform state.
4. Completion uses deterministic Progress events; reopen/recalculate cannot duplicate XP/counters.
5. Old `window.BQ_TRANSFORMATION`, direct `localStorage`, standalone account gates, body modals, mutable page globals, and recovery loaders are forbidden in v3.

## Audio / Recordings / Media boundaries

1. `src/app/audio.js` is the only owner allowed to create/replace/command/destroy the embedded media player.
2. `src/app/recordings.js` alone owns protected recording list/source/switch/leave lifecycle.
3. `src/app/media-library.js` owns browse/filter/open orchestration but delegates protected data to Recordings and playback to Audio.
4. `src/core/api.js` is the only Supabase boundary.
5. Leaving playback routes tears down the active player; returning creates a clean view over the same owners.

## Games boundaries

1. `src/app/games.js` is the only game launch/round/score/XP/replay/switch/leave/result owner.
2. Static game definition modules contain no scoring, persistence, navigation, or listener lifecycle.
3. `src/core/recall-packs.js` alone loads/validates/caches per-book Recall pack data.
4. Game Progress writes go only through `src/core/progress.js`.
5. Starting another game replaces the active round inside the same owner; leaving tears it down.
6. Kids arcade parity may remain accessible as a separate surface while deeper #38–40 integration is deferred.

## Global hard boundary

One boot, one router, one session owner, one global store, one storage boundary, one API boundary, one Bible service, one Reader owner, one Progress owner, one Recall Pack owner, one Lesson engine, one orchestration owner per study feature, one Transform engine, one Audio owner, one Recordings owner, one Media Library owner, and one Games owner. No v3 source depends on legacy `window.BQ*` globals.

## Milestone order

Foundation → Account → Reader → Progress → Lesson Engine → Daily Mission → Transform → Audio/Live Recordings/Media → Games core → **Bible-study core (Guided Study → Deep Questions → Story Journey → Wisdom Situations → Adaptive learning → weak-area review)** → Ministry/Devotional foundation → remaining parity → full audit → mobile regression → production deployment.

Known-good frozen releases now extend through `release/v3.17-story-journey` at `7690cc18b723fda1bed7802d2a56f49648f7f6b0`. Wisdom Situations is Verified after full functional run `34084573320` but must not be called frozen until its exact bookkeeping state passes the full accumulated suite. Production remains isolated on v2 until parity and stability release gates pass.
