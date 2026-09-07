# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 45
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 53
- **Verified or better:** 46 / 100 (**46% strict parity completion**)
- **Fully regression-tested:** 45 / 100 (**45% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.18-wisdom-situations` at `fd344208e12942d911f05d02b4e99d5b735a7c29`
- **Current active feature:** #53 Adaptive Learning — Verified after full run `34105551106`; exact bookkeeping gate pending
- **Next target after Adaptive freeze:** #54 Open/weak-area review
- **Kids arcade:** accessible; deeper #38–40 integration remains deferred
- **Later high-priority ministry requirement:** see `DEVOTIONAL_MINISTRY_DESIGN_V3.md`
- **Production:** v2 remains live; v3 has not replaced production

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / content | Partial | #11–13, #18–19, #21–23 Regression-tested; #20 Implemented; #14–17 deferred parity debt |
| 4 | User progress / state | Complete | #24–27 Regression-tested; Progress remains sole XP/counter/event owner |
| 5 | Lesson engine | Complete engine | #31 Regression-tested; shared by Guided Study, Deep Questions, Story Journey, Wisdom Situations, Adaptive Learning |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested; q1–q24 definitions also serve Adaptive Learning as one static source |
| 10 | Bible-study core | Active | #52/#51/#49/#50 Regression-tested; #53 Verified; bookkeeping/freeze next; then #54 |
| 11 | Devotional / Ministry foundation | Designed, not implemented | maps mainly to #66 and #73–78 |
| 12 | Bible World / tutorial / remaining parity | Not started | remaining inventory rows |
| 13 | Full old-vs-new audit | Not started | reconcile all 100 rows |
| 14 | Mobile regression | Not started | full accumulated mobile pass after parity audit |
| 15 | Production deployment | Not started | only after parity + stability gates |

## Frozen release line

- Transform — `release/v3.7-transform-complete`
- Audio/Recordings — `release/v3.8-audio-recordings`
- Media Library — `release/v3.9-media-library`
- Games core — `release/v3.10-games-core`
- Mixed Quest — `release/v3.11-mixed-quest`
- Per-book Recall — `release/v3.12-per-book-recall`
- Character Detective — `release/v3.13-character-detective`
- Timeline — `release/v3.14-timeline` at `ddc40d54125185bfd47f96765182e76d89cb37c3`
- Guided Study — `release/v3.15-guided-study` at `cf8740e623460f062c321d01d903267e79885c4c`; bookkeeping run `34081724365`
- Deep Questions — `release/v3.16-deep-questions` at `e287fb6179bddece7d9cb31e5496924e524f83fd`; functional run `34082339971`; bookkeeping run `34082727818`
- Story Journey — `release/v3.17-story-journey` at `7690cc18b723fda1bed7802d2a56f49648f7f6b0`; functional run `34083462882`; corrected bookkeeping run `34083885682`
- Wisdom Situations — `release/v3.18-wisdom-situations` at `fd344208e12942d911f05d02b4e99d5b735a7c29`; functional run `34084573320`; bookkeeping run `34084926656`

## Milestone 10 — Bible-study core

### #52 Expanded Guided Study — Regression-tested

Guided Study remains built on the single shared Lesson engine. Personal reflection/application is not spiritually scored, completion uses deterministic meaningful progress with `xp: 0`, and the stable Learn heading remains protected.

### #51 Deep Questions — Regression-tested

Deep Questions is frozen at v3.16. It retains 18 recovered questions, unscored reflection choices, private Lesson-backed notes, Reader handoff, no invented XP, and no separate persistence runtime.

### #49 Story Journey — Regression-tested

Story Journey is frozen at v3.17 with its retained scene/checkpoint flow, +15/+4 XP parity, Reader handoff, resume/reload/replay, deterministic duplicate protection, and mobile acceptance.

### #50 Wisdom Situations — Regression-tested

Wisdom Situations is frozen at v3.18 and survived the later Adaptive Learning functional run `34105551106`. It retains all 24 recovered situations, +8 XP/+1 `situations` per answered attempt, no spiritual-quality scoring, no `quizCorrect` inflation, and deterministic duplicate protection.

### #53 Adaptive Learning — Verified

Functional run `34105551106` passed the entire accumulated suite.

Verified Adaptive Learning behavior:
1. Learn → Adaptive Learning route while retaining `<h1>Learn</h1>`.
2. reuses the same verified q1–q24 question definitions from `src/features/games/content.js`; no second question bank.
3. tracks retrieval evidence by question: seen, correct, wrong, streak, next due, last review.
4. uses eight retained Bible categories: Genesis, Exodus, History, Wisdom, Prophets, Gospels, Acts, Letters.
5. correct adaptive retrieval spaces review approximately 1 → 3 → 7 → 14 → 30 days; a miss becomes due immediately.
6. Smart Review selects seven questions, prioritizing review/weak, due, unseen, historical misses, weak mastery, context, and connection evidence.
7. where possible, no more than three of the seven questions come from one category.
8. old reward parity retained: +10 XP correct / +3 XP incorrect; correct adds exactly one `quizCorrect`.
9. Adaptive mastery is updated only by Adaptive Review (+5 correct / +2 incorrect, max 100); normal Games answers are ingested only as retrieval evidence and never double-awarded.
10. missed Adaptive items enter the review list and a later correct Adaptive retrieval removes them.
11. leave/return and reload use the shared Lesson engine; completed attempts cannot duplicate XP, mastery, or session history.
12. 390px mobile regression verifies no horizontal overflow, controls >=44px, and no console/page errors.

Architecture is single-source: q1–q24 content in Games static definitions, Adaptive orchestration/mastery in `src/app/adaptive-learning.js`, session lifecycle in `src/engines/lesson.js`, XP/events in `src/core/progress.js`, browser persistence through `src/core/storage.js`, and presentation only in `src/features/adaptive-learning/index.js`.

### Next sequence

After the exact Adaptive Learning bookkeeping state passes and `release/v3.19-adaptive-learning` is frozen:
1. #54 Open/weak-area review
2. reassess the remaining Bible-study/core-content parity debt before advancing to the next planned milestone.

## Current bookkeeping

- #49 Story Journey — **Regression-tested**
- #50 Wisdom Situations — **Regression-tested**
- #51 Deep Questions — **Regression-tested**
- #52 Expanded Guided Study — **Regression-tested**
- #53 Adaptive Learning — **Verified**
- #20 STEPBible tooling — **Implemented**
- Totals — **45 Regression-tested / 1 Verified / 1 Implemented / 53 Not started**

## Devotional / Ministry later milestone

Future implementation must preserve one ministry post/task identity for Message, Devotional, and Task; Pastor/Admin congregation-scoped response review; member-only access to their own response bodies; aggregate-only peer completion visibility; and backend/API/RLS privacy enforcement. Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse this same service architecture.

## Kids accessibility decision

The separate Kids surface remains available. #38 Kids Memory Match, #39 Hiragana Match, and #40 Kids Bible Who Am I stay deferred and unpromoted while Bible-study core work continues.

## Release discipline

- Do not modify `main` during the rebuild line.
- Do not replace production with incomplete v3.
- Do not modify production Cloudflare during the rebuild.
- Each milestone closes only after the exact bookkeeping state passes the accumulated suite and is frozen as a known-good release.
- Every bug fix records root cause and retains a regression test.
- Normal v3 CI is manual-only; isolated verification branches may temporarily use a push trigger for one-shot CI execution.
