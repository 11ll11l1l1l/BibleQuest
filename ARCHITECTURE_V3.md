# BibleQuest v3 Architecture Contract

BibleQuest v3 uses rebuild-and-verify, not patch-and-accumulate. Feature parity and stability are separate acceptance goals. Every mutable function has one owner; features compose those owners through explicit interfaces rather than duplicating state, scoring, storage, navigation, media, or backend logic.

## Active single owners

- `src/app/bootstrap.js` — composition and one boot
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
- `src/engines/lesson.js` — shared lesson/session/step/response lifecycle and persistence
- `src/app/study.js` — Guided Study orchestration
- `src/app/deep-questions.js` — Deep Questions orchestration
- `src/app/story-journey.js` — Story Journey orchestration
- `src/app/wisdom-situations.js` — Wisdom Situations orchestration
- `src/app/adaptive-learning.js` — Adaptive retrieval evidence/mastery/selection orchestration
- `src/app/open-review.js` — Open Smart Review queue/spacing orchestration
- `src/app/daily-mission.js` — Daily Journey orchestration
- `src/engines/transform.js` — Transform state/scoring/persistence
- `src/app/transform.js` — Transform cross-service orchestration
- `src/app/audio.js` — browser media/player lifecycle
- `src/app/recordings.js` — protected recording list/source lifecycle
- `src/app/media-library.js` — Media Library orchestration
- `src/app/games.js` — Games launch/round/scoring/review/result lifecycle and `games-recall` ownership

## Shared Bible-study boundaries

1. `src/engines/lesson.js` is the only reusable lesson lifecycle owner. Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning, Open Review, and future study workflows reuse it when the contract fits.
2. `src/core/progress.js` is the only XP/streak/activity/counter/event owner. Feature code cannot mutate progress directly.
3. `src/core/storage.js` is the only browser storage implementation boundary. No feature uses direct `localStorage` or `sessionStorage`.
4. `src/core/recall-packs.js` is the only owner that loads, validates, caches, or addresses unfoldingWord question-pack files.
5. Static feature/content modules contain definitions only. Feature `index.js` modules are presentation/event-forwarding only.
6. Open reflection/application text is never converted into a spiritual-quality score, moral rank, diagnosis, or measure of divine approval.
7. Retained rewards are implemented only when recovered from the old behavior. No parity feature invents a new XP scheme.
8. Deterministic Progress identities and Lesson attempt identities must prevent reload/reopen duplication.
9. Legacy `window.BQ*` globals, MutationObserver feature injection, direct DOM surveillance, competing global runtimes, and direct backend/storage shortcuts are forbidden in v3.

## Guided Study / Deep Questions / Story Journey / Wisdom

- Guided Study uses `src/app/study.js` + Lesson + Progress/Reader interfaces; completion has no invented XP and personal reflection is unscored.
- Deep Questions uses `src/app/deep-questions.js` + Lesson/Reader; private notes are Lesson responses and there is no separate note runtime or XP scheme.
- Story Journey uses `src/app/story-journey.js` + Lesson/Progress/Reader. Retained checkpoint reward is +15 XP correct / +4 incorrect; correct contributes one `quizCorrect`.
- Wisdom uses `src/app/wisdom-situations.js` + Lesson/Progress. Retained reward is +8 XP and +1 `situations` for each answered attempt regardless of strongest/weaker choice. Strongest-option selection does not add `quizCorrect` or become a spiritual-quality score.

## Adaptive Learning boundaries

1. `src/features/games/content.js` remains the single q1–q24 static question source; Adaptive imports it rather than copying a bank.
2. `src/app/adaptive-learning.js` alone owns Adaptive retrieval evidence, category mastery, Games-event ingestion, ranking, seven-question selection, adaptive review list, attempt identity, session history, and the read-only `reviewFocusCategory()` signal.
3. Adaptive uses one namespaced `adaptive-learning` record through Storage. Lesson owns question lifecycle and resume/reload. Progress owns rewards.
4. Retained reward is +10 XP correct / +3 incorrect; correct contributes one `quizCorrect`.
5. Correct Adaptive retrieval spacing is approximately 1 → 3 → 7 → 14 → 30 days; a miss is due immediately.
6. A seven-question Smart Review uses retained evidence including review flag, due/unseen state, historical miss ratio, category mastery, context/connection mode, and bounded random tie-breaking. Where possible no category supplies more than three questions.
7. Adaptive mastery is retrieval-practice evidence only: +5 correct / +2 incorrect, capped at 100. It cannot be described as spiritual quality.
8. Normal `game.question` events may be ingested as retrieval evidence without a second XP award or Adaptive mastery credit.
9. `reviewFocusCategory()` is read-only. Minimum-mastery ties rotate deterministically by date; Open Review can consume the result but cannot mutate Adaptive mastery.

## Open Smart Review boundaries

1. `src/app/open-review.js` is the single #54 coordinator. It owns its seven-item queue assembly, `open-review` spaced-history record, attempt identity, due scheduling, self-rating reconciliation, and completion summaries.
2. Queue priority is retained: scheduled/due Open Review items → existing Games per-book review IDs → unseen approved items from the Adaptive weakest category → wider fresh-pack fallback only if necessary.
3. `src/core/recall-packs.js` supplies approved pack data. Open Review cannot fetch pack paths itself and persists only item identity/retrieval statistics; question/answer/source text is rehydrated on resume.
4. `src/app/games.js` remains sole owner of per-book Recall review IDs. Cross-feature access is limited to immutable `recallReviewQueue()` and idempotent `syncRecallReviewItem(code,id,needsReview)`.
5. `src/app/adaptive-learning.js` remains sole weak-area/mastery owner. Open Review consumes only `reviewFocusCategory()`.
6. Lesson owns the interactive lifecycle as 14 alternating steps: seven question-only memory prompts and seven unscored self-rating steps. Leave/return, reload, progression, response locking, and completion remain Lesson responsibilities.
7. Before reveal, the public Open Review item snapshot contains the question but not its answer/reference. Reveal advances to the rating step, where source answer/reference may be displayed.
8. Retained reward is +1 XP for `Review again` and +5 XP for `Got it`; only Got it contributes one `quizCorrect`.
9. `Review again` resets streak and is due immediately. Successive Got it ratings space approximately 1 → 3 → 7 → 14 → 30 days.
10. Progress event identity is `open-review:<attemptId>:item:<bookCode>:<itemId>`, preventing duplicate rating rewards on reload/reopen.
11. `src/features/open-review/index.js` is presentation/event forwarding only; `src/ui/open-review.css` owns feature styling and 390px mobile behavior.
12. The historical direct-localStorage/global-overlay/MutationObserver Open Review runtime is reference-only and must not be recreated.

## Transform, Audio, Recordings, Media, Games

- `src/engines/transform.js` alone owns Transform calculations/state; `src/app/transform.js` only coordinates with Progress.
- `src/app/audio.js` is the only embedded-player lifecycle owner.
- `src/app/recordings.js` owns protected recordings lifecycle; `src/app/media-library.js` composes Recordings and Audio rather than creating another backend/player path.
- `src/app/games.js` owns all game launch/round/score/replay/switch/leave/result state and the per-book Recall review-ID persistence. `src/core/recall-packs.js` remains pack-data owner; Progress remains reward owner.

## Future Devotional / Ministry boundaries

`DEVOTIONAL_MINISTRY_DESIGN_V3.md` is the later design contract; documentation alone does not promote ministry inventory rows.

Message, Devotional, and Task must share one ministry post/task identity. Pastor/Admin authoring and congregation-scoped response review must use one service model. Members may read their own response and permitted aggregates, never another member's response body. Privacy is enforced by backend authorization/RLS/API shape, not UI hiding. Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse this same identity rather than create parallel assignment systems.

## Global hard boundary

One boot, router, session owner, global store, storage boundary, API boundary, Bible service, Reader owner, Progress owner, Recall Pack owner, Lesson engine, Adaptive owner, Open Review owner, Transform engine, Audio owner, Recordings owner, Media Library owner, Games owner, and one orchestration owner per feature. No v3 source depends on legacy `window.BQ*` globals.

## Milestone order

Foundation → Account → Reader → Progress → Lesson → Daily Mission → Transform → Audio/Recordings/Media → Games core → Bible-study core (Guided Study → Deep Questions → Story Journey → Wisdom Situations → Adaptive Learning → Open Smart Review) → reassess remaining core/content parity debt → Ministry/Devotional foundation when dependency order calls for it → remaining parity → full old-vs-new audit → accumulated mobile regression → production deployment.

Known-good frozen releases currently extend through `release/v3.19-adaptive-learning` at `39ab8269e4fd83a09138404bd9466df0c70ee30e`. Open Smart Review is **Verified** after complete functional run `34108734009`; it becomes a frozen checkpoint only after the exact bookkeeping state passes the full accumulated suite. Production v2 remains isolated.
