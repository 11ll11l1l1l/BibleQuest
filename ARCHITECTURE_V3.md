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
- `src/core/bible.js` — Bible sources/packs/search/external links/original-language context-pack loading and live Japanese chapter-source normalization
- `src/app/reader.js` — Reader state/navigation/read marking and Reader-facing context/source delegation
- `src/app/japanese-vocabulary.js` — Japanese vocabulary-learning preference and curated term lookup
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
5. `src/core/bible.js` is the only owner that loads or addresses bundled Bible packs, live Bible sources, and original-language context packs.
6. Static feature/content modules contain definitions only. Feature `index.js` modules are presentation/event-forwarding only.
7. Open reflection/application text is never converted into a spiritual-quality score, moral rank, diagnosis, or measure of divine approval.
8. Retained rewards are implemented only when recovered from the old behavior. No parity feature invents a new XP scheme.
9. Deterministic Progress identities and Lesson attempt identities must prevent reload/reopen duplication.
10. Legacy `window.BQ*` globals, MutationObserver feature injection, direct DOM surveillance, competing global runtimes, and direct backend/storage shortcuts are forbidden in v3.

## Reader / STEPBible Context Lab boundaries

1. #20 retains the old in-app Hebrew & Greek Context Lab rather than reducing parity to an external STEP link.
2. `src/core/bible.js` alone loads `data/packs/context/manifest.json`, follows manifest-owned context-pack paths, validates/normalizes lexical data, caches it, and combines it with the BSB verse/context.
3. `src/app/reader.js` exposes only Reader-facing delegation through `contextChapter()` and `lexicalContext()`. Context browsing must not mutate the main Reader passage or read-progress state.
4. `src/features/reader/context.js` is presentation/event forwarding only. It cannot fetch packs, access Storage/Progress/backend APIs, create a second lexical engine, use MutationObserver, or publish `window.BQ*` globals.
5. `src/ui/context-lab.css` is isolated presentation/mobile styling. The Context Lab must remain usable at 390px with approximately 44px interactive targets and no horizontal overflow.
6. Retained lexical/context fields are Strong’s ID, original-language identification, lemma, transliteration, morphology, brief gloss, BSB previous/current/next context, same-book tagged usage references, coverage/source/license/limits, and an external verse-specific STEP handoff.
7. Lexical fields are study aids, not a reconstructed word-for-word interlinear and not theological conclusions. The UI keeps the recovered safety guidance: read sentence/paragraph first; a lexicon supplies a semantic range that grammar/context narrow; do not build doctrine from etymology or one Strong’s entry alone.
8. Missing context data must degrade inside Reader with a controlled unavailable state. Malformed source data must produce a controlled Bible-data error rather than silent corruption.
9. Context Lab study has no recovered XP/progress reward, so v3 does not invent one.
10. Verse Peek metadata is namespaced as `data-peek-verse`; the established `[data-verse]` selector remains exclusive to Scripture verse buttons.

## Reader / Japanese 口語訳 boundaries

1. `src/core/bible.js` remains the single Bible-source owner for #14. No Japanese-specific module may directly call GetBible or create another Scripture cache.
2. Japanese `口語訳聖書 (1954/1955)` is represented as a live chapter-only translation. It must not masquerade as a bundled whole-book pack.
3. The recovered source path is `https://api.getbible.net/v2/japkougo/<canonical-book-number>/<chapter>.json`. Canonical book numbers are derived from the existing `BIBLE_BOOKS` order; a second book-number mapping is forbidden.
4. Returned verse arrays or object-shaped verse collections are normalized and sorted by `src/core/bible.js`. Scripture text is preserved except surrounding transport whitespace; v3 must not rewrite, modernize, annotate inside, or silently replace the source text.
5. A live Japanese chapter is cacheable only after semantic validation produces readable verses. Network/JSON failures and HTTP-200-but-invalid/empty verse payloads must evict the source cache so Retry performs a genuine new request.
6. `src/app/reader.js` owns selected translation/book/chapter persistence. Japanese source code cannot use direct `localStorage`.
7. Source failure must remain explicit. Reader may offer Retry and an explicit `Use BSB` action, but it must never silently substitute BSB or fabricate Japanese Scripture.
8. Reference navigation/search may load the requested live chapter. Whole-Bible Japanese text search is not allowed to fan out across all 66 books unless a future explicitly verified source contract is introduced.
9. Selecting/loading Japanese Scripture carries no recovered XP/progress reward and must not generate one.
10. Japanese recovery/navigation controls remain >=44px on the 390px mobile path and must not create horizontal overflow.
11. `scripts/validate-v3-japanese-kougo.mjs`, `tests/v3-japanese-kougo-edge.mjs`, and `tests/v3-japanese-kougo-smoke.mjs` permanently protect these boundaries.
12. #15 furigana is intentionally deferred. Old `kuromoji` CDN injection, direct DOM mutation, and `window.BQJapaneseLearning` must not leak into #14 or #16 merely because they existed in the legacy combined module.

## Reader / Japanese vocabulary boundaries

1. #16 reuses the curated vocabulary definitions recovered from the loaded legacy `japanese-learning.js` but does not recreate its combined furigana/tokenizer runtime.
2. `src/app/japanese-vocabulary.js` alone owns the persisted vocabulary-learning enabled preference and curated note lookup. It uses the central Storage boundary and cannot access DOM, network, Progress, or Scripture sources.
3. `src/features/reader/vocabulary-content.js` is static definition data only. The recovered 27 terms retain term, reading, learner-friendly explanation, fuller meaning, and optional English gloss.
4. `src/features/reader/vocabulary.js` is presentation-only. It renders the control and note block but cannot access Storage, network, Progress, `kuromoji`, or legacy globals.
5. Reader exposes vocabulary only when Japanese 口語訳 is selected. Verse selection continues to use the existing Verse Peek interaction; vocabulary notes are composed inside Verse Peek rather than creating another overlay or competing verse-click owner.
6. The vocabulary enabled preference persists through `src/core/storage.js`; selected Reader translation/book/chapter remains owned by `src/app/reader.js`.
7. A selected verse shows at most three curated matching notes, preferring longer terms before contained shorter terms. If no curated term matches, the UI shows a controlled empty-learning state and must not fabricate a reading or definition.
8. The UI must state that readings, modern-language explanations, and English glosses are study aids and are not Scripture text.
9. Vocabulary browsing has no recovered XP/progress reward, so v3 does not invent one.
10. #15 furigana remains deferred. `kuromoji`, CDN script injection, `data-jp-furigana`, and `window.BQJapaneseLearning` are forbidden from the #16 implementation.
11. `src/ui/japanese-vocabulary.css` owns the isolated vocabulary/mobile presentation. The control must remain >=44px and the 390px Reader path must not overflow horizontally.

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

One boot, router, session owner, global store, storage boundary, API boundary, Bible service, Reader owner, Japanese vocabulary owner, Progress owner, Recall Pack owner, Lesson engine, Adaptive owner, Open Review owner, Transform engine, Audio owner, Recordings owner, Media Library owner, Games owner, and one orchestration owner per feature. No v3 source depends on legacy `window.BQ*` globals.

## Milestone order

Foundation → Account → Reader → Progress → Lesson → Daily Mission → Transform → Audio/Recordings/Media → Games core → Bible-study core (Guided Study → Deep Questions → Story Journey → Wisdom Situations → Adaptive Learning → Open Smart Review → STEPBible Context Lab) → remaining Reader-language/source parity (#14 → #16 → #17; #15 furigana intentionally deferred) → reassess remaining core/content parity debt → Ministry/Devotional foundation when dependency order calls for it → remaining parity → full old-vs-new audit → accumulated mobile regression → production deployment.

Known-good frozen releases extend through `release/v3.22-japanese-kougo` at `06eda2948db3a4c5462bc24a2b79596fa7d275f0`; exact Japanese 口語訳 bookkeeping run `34122128228` passed before that freeze. #16 Japanese vocabulary is now under rebuild and cannot be promoted until its complete accumulated functional gate passes. Production v2 remains isolated.
