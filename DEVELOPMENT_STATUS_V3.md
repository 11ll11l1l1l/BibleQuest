# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Cloudflare remains untouched by the v3 rebuild.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.
- Latest frozen checkpoint: `release/v3.18-wisdom-situations` at `fd344208e12942d911f05d02b4e99d5b735a7c29`.
- Wisdom Situations functional run `34084573320` and bookkeeping run `34084926656` both passed before that freeze.
- Prior Bible-study checkpoints remain `release/v3.17-story-journey` at `7690cc18b723fda1bed7802d2a56f49648f7f6b0`, `release/v3.16-deep-questions` at `e287fb6179bddece7d9cb31e5496924e524f83fd`, and `release/v3.15-guided-study` at `cf8740e623460f062c321d01d903267e79885c4c`.
- Earlier frozen core line remains unchanged through Transform, Audio/Recordings/Media, Games, Mixed Quest, Per-book Recall, Character Detective, and Timeline.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 45 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 53 |
| Total | 100 |

Strict verified-or-better parity is **46/100**. Fully regression-tested stability coverage is **45/100**.

Current promotions:
- #52 Expanded Guided Study — Regression-tested.
- #51 Deep Questions — Regression-tested.
- #49 Story Journey — Regression-tested.
- #50 Wisdom Situations — Regression-tested after surviving Adaptive Learning functional run `34105551106`.
- #53 Adaptive Learning — Verified after functional run `34105551106`; exact bookkeeping gate pending.
- #20 STEPBible lexical/context tooling — Implemented.

## Milestone 10 — Bible-study core

### Expanded Guided Study (#52)

Frozen at `release/v3.15-guided-study`. It continues to use `src/engines/lesson.js` as the only Lesson lifecycle/state/persistence engine and `src/app/study.js` as the thin Study orchestration owner. Personal reflection/application is not spiritually scored and completion uses one deterministic meaningful Progress event with `xp: 0`.

### Deep Questions (#51)

Frozen at `release/v3.16-deep-questions` after functional run `34082339971` and bookkeeping run `34082727818`. It uses the shared Lesson engine, keeps private notes inside Lesson responses, delegates Reader handoff to the Reader owner, and has no invented XP or spiritual-quality scoring.

### Story Journey (#49) — Regression-tested

Frozen at `release/v3.17-story-journey` after functional run `34083462882` and corrected bookkeeping run `34083885682`. It retains 10 journeys, five scenes plus one checkpoint, +15/+4 XP parity, one `quizCorrect` for a correct checkpoint, deterministic duplicate protection, Reader handoff, resume/reload/replay, and 390px mobile coverage.

### Wisdom Situations (#50) — Regression-tested

Frozen at `release/v3.18-wisdom-situations` after functional run `34084573320` and bookkeeping run `34084926656`. It retains all 24 recovered situations, four plausible options, strongest-supported judgment and all rationales/references, +8 XP/+1 `situations` per answered attempt regardless of strongest/weaker choice, no `quizCorrect` inflation, deterministic duplicate protection, and 390px mobile coverage.

Wisdom Situations survived the later complete Adaptive Learning functional run `34105551106`, so #50 is now Regression-tested.

### Adaptive Learning (#53) — Verified

The retained loaded v2 runtime was recovered before rebuilding. The later historical `adaptive-learning.js` layer was not loaded by the retained app shell, so it was not copied into v3. The parity source is the actually wired `learning-engine.js` behavior. This avoids recreating duplicate adaptive runtimes.

Recovered parity behavior:
- the adaptive source uses the same 24 `q1`–`q24` Bible questions already retained by the verified v3 Games content source.
- eight Bible categories: Genesis, Exodus, History, Wisdom, Prophets, Gospels, Acts, Letters.
- per-question retrieval evidence tracks seen, correct, wrong, streak, next-due date, and last-reviewed date.
- a correct adaptive answer advances spacing approximately `1 → 3 → 7 → 14 → 30` days; a miss becomes due immediately.
- Smart Review builds seven questions.
- selection prioritizes retained weak/review items, due items, unseen items, historical miss ratio, low category mastery, context questions, and connection questions.
- where enough content exists, one category is limited to at most three of the seven selected questions.
- the old adaptive reward is retained: `+10 XP` correct and `+3 XP` incorrect.
- correct adaptive answers contribute exactly one central `quizCorrect`; incorrect answers do not.
- adaptive category mastery changes only for Adaptive Review answers: +5 correct / +2 incorrect, capped at 100.
- missed adaptive questions enter the persistent review list; later correct adaptive retrieval removes them.
- ordinary verified Games `game.question` outcomes are observed as retrieval evidence without a second XP award and without inventing Adaptive mastery credit.

Clean architecture:
- `src/features/games/content.js` remains the single static source for the 24 shared q1–q24 question definitions. Adaptive Learning does not duplicate them.
- `src/app/adaptive-learning.js` is the single Adaptive Learning owner for mastery/evidence normalization, Games-progress ingestion, ranking, seven-question selection, adaptive review identity, and session summary history.
- `src/engines/lesson.js` remains the sole question-session lifecycle, response lock, score, resume/reload, and completion owner.
- `src/core/progress.js` remains the sole XP/quizCorrect/event owner.
- `src/core/storage.js` remains the sole browser persistence boundary; Adaptive Learning uses one namespaced `adaptive-learning` record through that service.
- `src/features/adaptive-learning/index.js` is presentation/event forwarding only.
- `src/ui/adaptive-learning.css` owns feature styling.
- no MutationObserver, direct `localStorage`, `window.BQ*` global, second quiz engine, or second Progress owner was recreated.

Adaptive Progress event identities are deterministic per Adaptive attempt and question: `adaptive:<attemptId>:question:<questionId>`. Duplicate reads or reopening a completed attempt cannot award XP or mastery twice. Completed session summaries are also identity-protected.

Functional run `34105551106` passed:
- architecture validation.
- all accumulated edge regressions.
- Adaptive Learning edge regression covering all 24 reused questions, category mapping, Games-event ingestion, idempotency, due/missed ranking, max-three-per-category mix, spacing, +10/+3 rewards, mastery/review updates, duplicate prevention, completion history, reload, malformed-state recovery, and invalid RNG handling.
- all accumulated browser regressions.
- Adaptive Learning browser regression at 390px covering Learn routing, stable heading, seven-question flow, miss→review persistence, leave/return resume, six subsequent correct answers, exact +63 XP for one miss plus six correct, `quizCorrect` delta, session history, reload duplicate protection, weak-item prioritization on another review, >=44px controls, no overflow, and no console/page errors.

No Adaptive Learning application defect was found by the full functional gate. The earlier Contents API 404 while creating the test file was a repository-write-path issue only; the test was created through the Git data tree/commit path without an application patch.

The exact inventory/status/timeline/architecture bookkeeping state must pass one full accumulated suite before `release/v3.19-adaptive-learning` may be frozen.

## Next major milestone

After the Adaptive Learning bookkeeping gate is green and `release/v3.19-adaptive-learning` is frozen, continue directly with:
1. #54 Open/weak-area review
2. then reassess the remaining Bible-study/core-content parity debt before moving to the next planned milestone.

Kids #38–40 remain deferred but accessible through the existing Kids surface.

## Future Devotional / Ministry requirement

`DEVOTIONAL_MINISTRY_DESIGN_V3.md` remains the later high-priority design contract.

Required future behavior:
- Pastor/Admin publishes first-class Message, Devotional, or Task posts through one freeform ministry service/model.
- Members receive eligible congregation posts.
- Tasks can contain one or more freeform prompts and member responses.
- Members can read their own response but not other members' response bodies.
- Pastor/Admin can review individual responses only inside their congregation scope.
- Members may see allowed aggregate counts such as `18 answered`.
- Privacy must be enforced by backend/API/RLS, not UI hiding.
- Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse one coherent post/task identity.

Primary later inventory mapping remains #66 and #73–78. Design documentation alone does not promote those rows.

## Defect / root-cause ledger retained

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-SIGNUP-001` — recovery-code issuance is independent from optional auto-sign-in.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate signup and post-recovery login are explicit tests.
- `V3-READER-ACCEPTANCE-001` — invalid search respects native form validation.
- `V3-PROGRESS-UI-001` — static label readability is separate from touch-target semantics.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-TRANSFORM-PROGRESS-001` — Full Transform used an unsupported `assessments` metric; the central progress owner defines and tests it.
- `V3-RECORDINGS-FREEZE-001` — v3 replaced fragmented global media lifecycle with one Audio owner, one Recordings owner, explicit teardown, bounded requests, and one-player regression.
- `V3-AUDIO-VALIDATOR-001` — the architecture validator initially checked the wrong source token and was corrected before functional CI proceeded.
- `V3-MEDIA-OWNER-001` — Media Library composes the verified Recordings and Audio owners instead of creating a second player/backend path.
- `V3-GAMES-SHELL-ACCEPTANCE-001` — shell acceptance now asserts stable Games route/launcher contract instead of placeholder copy.
- `V3-GAMES-OWNER-001` — v3 centralizes launch/answer/score/replay/switch/leave/result persistence in `src/app/games.js`.
- `V3-RECALL-PACK-001` — pack loading/validation/cache is isolated in `src/core/recall-packs.js`; gameplay remains in Games owner.
- `V3-DETECTIVE-SELECTOR-001` — Character Detective test selector was made explicit after a non-unique selector false failure.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP; regression protects the remaining +16 solve award.
- `V3-STUDY-SYNTAX-001` — dense Guided Study freezer syntax was replaced by explicit `freezeStudy()` and remains syntax-gated.
- `V3-STUDY-BOUNDARY-001` — Study `getState()` now enforces its own public boundary before delegating to Lesson.
- `V3-STUDY-LEARN-ACCEPTANCE-001` — stable Learn `<h1>` was restored and protected.
- `V3-STUDY-READER-TEST-001` — Reader acceptance waits for actual controls and asserts correct book/chapter.
- `V3-STORY-BOOKKEEPING-001` — Story Journey bookkeeping renamed the validator-required `Next major milestone` queue heading. Architecture run `34083748928` blocked the freeze; the heading was restored and the validator assertion remains the regression guard.
- `V3-WISDOM-ESCAPE-001` — the first Wisdom presentation draft mapped the quote character to an incomplete HTML entity. The escaping map was corrected before functional CI; the retained Wisdom browser regression exercises rendered scenario/result content and fails on page/console errors.

## Release rule

Adaptive Learning passed the entire accumulated functional suite on run `34105551106`. The exact bookkeeping state must pass the full suite once more before `release/v3.19-adaptive-learning` may be frozen. Production v2 remains unchanged until all applicable capability rows satisfy parity and stability gates.
