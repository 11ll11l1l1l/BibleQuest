# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 43
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 55
- **Verified or better:** 44 / 100 (**44% strict parity completion**)
- **Fully regression-tested:** 43 / 100 (**43% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.16-deep-questions` at `e287fb6179bddece7d9cb31e5496924e524f83fd`
- **Current active feature:** #49 Story Journey — Verified after run `34083462882`; exact bookkeeping gate pending
- **Next target after Story Journey freeze:** #50 Wisdom Situations
- **Kids arcade:** accessible; deeper #38–40 integration remains deferred
- **Later high-priority ministry requirement:** see `DEVOTIONAL_MINISTRY_DESIGN_V3.md`
- **Production:** v2 remains live; v3 has not replaced production

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / content | Partial | #11–13, #18–19, #21–23 Regression-tested; #20 Implemented; #14–17 deferred parity debt |
| 4 | User progress / state | Complete | #24–27 Regression-tested |
| 5 | Lesson engine | Complete engine | #31 Regression-tested; shared by Guided Study, Deep Questions, Story Journey |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested |
| 10 | Bible-study core | Active | #52 and #51 Regression-tested; #49 Verified; bookkeeping/freeze next; then #50/#53/#54 |
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

## Milestone 10 — Bible-study core

### #52 Expanded Guided Study — Regression-tested

Guided Study remains built on the single shared Lesson engine. Personal reflection/application is not spiritually scored, completion uses deterministic meaningful progress with `xp: 0`, and the stable Learn heading remains protected.

### #51 Deep Questions — Regression-tested

Deep Questions is frozen at v3.16 and then survived Story Journey run `34083462882`. It retains 18 recovered questions, unscored reflection choices, private Lesson-backed notes, Reader handoff, no invented XP, and no separate persistence runtime.

### #49 Story Journey — Verified

Functional run `34083462882` passed the full accumulated suite.

Verified Story Journey behavior:
1. Learn → Story Journey route while retaining `<h1>Learn</h1>`.
2. 10 retained story records.
3. Five scene steps plus one checkpoint per story.
4. leave/return and reload resume through `src/engines/lesson.js`.
5. correct checkpoint `+15 XP`; incorrect checkpoint `+4 XP` parity.
6. correct checkpoint increments `quizCorrect` once.
7. deterministic Progress event prevents duplicate reward on reopen.
8. restart creates a new attempt; replay is eligible once for that new attempt.
9. Reader handoff opens the correct book/chapter.
10. 390px mobile no-overflow, controls >=44px, no console/page errors.

No Story Journey application defect was found in the first functional gate.

### Next sequence

After the exact Story Journey bookkeeping state passes and `release/v3.17-story-journey` is frozen:
1. #50 Wisdom Situations
2. #53 Adaptive learning
3. #54 Open/weak-area review

## Current bookkeeping

- #49 Story Journey — **Verified**
- #51 Deep Questions — **Regression-tested**
- #52 Expanded Guided Study — **Regression-tested**
- #20 STEPBible tooling — **Implemented**
- Totals — **43 Regression-tested / 1 Verified / 1 Implemented / 55 Not started**

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
