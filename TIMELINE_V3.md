# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`; the inventory remains authoritative.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 46
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 52
- **Verified or better:** 47 / 100 (**47% strict parity completion**)
- **Fully regression-tested:** 46 / 100 (**46% stability coverage**)
- **Latest frozen checkpoint:** `release/v3.19-adaptive-learning` at `39ab8269e4fd83a09138404bd9466df0c70ee30e`
- **Current active feature:** #54 Open/weak-area review — Verified after full functional run `34108734009`; exact bookkeeping/freeze gate pending
- **#53 Adaptive Learning:** Regression-tested after surviving the later #54 full suite
- **Next target after v3.20 freeze:** reassess remaining Bible-study/core-content parity debt before selecting the next capability
- **Kids arcade:** accessible; deeper #38–40 integration remains deferred
- **Later high-priority ministry requirement:** see `DEVOTIONAL_MINISTRY_DESIGN_V3.md`
- **Production:** v2 remains live; v3 has not replaced production

## Rebuild sequence

| Milestone | Scope | State | Evidence / next action |
|---:|---|---|---|
| 1 | Shell / navigation | Complete | #1–5 Regression-tested |
| 2 | Authentication / session | Complete | #6–10 Regression-tested |
| 3 | Bible data / content | Partial | #11–13, #18–19, #21–23 Regression-tested; #20 Implemented; #14–17 remain debt |
| 4 | User progress / state | Complete | #24–27 Regression-tested; Progress remains sole XP/counter/event owner |
| 5 | Lesson engine | Complete engine | #31 Regression-tested; shared across verified study workflows |
| 6 | Daily Mission | Complete | #28–30 Regression-tested |
| 7 | Transform | Frozen complete | #46–48 Regression-tested |
| 8 | Audio / Live Recordings / Media | Frozen complete | #57–61 Regression-tested |
| 9 | Games core | Frozen core | #32–37 and #41 Regression-tested; Games owns per-book Recall review IDs |
| 10 | Bible-study core | Freeze gate | #49–53 Regression-tested; #54 Verified; exact bookkeeping then v3.20 freeze |
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
- Adaptive Learning — `release/v3.19-adaptive-learning` at `39ab8269e4fd83a09138404bd9466df0c70ee30e`; functional run `34105551106`; bookkeeping run `34106252587`

## Milestone 10 — Bible-study core

### #53 Adaptive Learning — Regression-tested

Adaptive Learning remains frozen at v3.19. It reuses q1–q24 from Games, uses the shared Lesson lifecycle, retains +10/+3 XP, uses 1/3/7/14/30 spaced retrieval with misses due immediately, and exposes only a read-only deterministic weakest-category focus signal for Open Review. It passed again in the complete #54 functional run `34108734009`.

### #54 Open/weak-area review — Verified

Functional run `34108734009` passed the entire accumulated suite.

Verified Open Review behavior:
1. Learn → Open Smart Review while the stable Learn heading remains intact.
2. Seven open-answer recall items are built from approved unfoldingWord Translation Questions v90 packs with CC BY-SA 4.0 attribution.
3. Queue priority is scheduled/due Open Review history → existing Games per-book review IDs → fresh questions from the Adaptive weakest category → wider fresh fallback only if necessary.
4. The member answers mentally before reveal; answer/reference is hidden in the public snapshot until Reveal.
5. After reveal the member self-rates `Review again` or `Got it`; Lesson does not pretend to automatically grade free recall wording.
6. Retained reward is +1 XP Review again / +5 XP Got it; Got it contributes one `quizCorrect`.
7. Review again resets the retrieval streak and is due immediately; successive Got it ratings space approximately 1 → 3 → 7 → 14 → 30 days.
8. Games remains sole owner of per-book review IDs through immutable `recallReviewQueue()` and idempotent `syncRecallReviewItem()`; Open Review never reads Games storage.
9. Adaptive remains sole weak-area/mastery owner through read-only `reviewFocusCategory()`.
10. Recall Pack service remains sole question-pack loader/validator/cache; Open Review stores identity/statistics only and rehydrates source text on resume.
11. Shared Lesson owns the 14-step seven-question memory/reveal/rating lifecycle, leave/return, reload, locking, and completion.
12. deterministic Progress event identity prevents duplicate XP/counters on reload/reopen.
13. 390px browser regression verifies resume, one Review again + six Got it = +31 XP / +6 quizCorrect, one completion history record, due-item reprioritization, no overflow, >=44px controls, and no page/console errors.
14. every older browser regression remained green afterward, including Transform, Live Recordings, Media Library, and Games.

Two failed pre-green verification attempts were test-fixture defects, not application patches: run `34108325481` assumed the wrong date-tie category in Adaptive focus; run `34108543938` assumed one scheduled item should outrank older overdue items. Both regressions were corrected to model the actual deterministic rules, and attempt `34108734009` passed fully.

## Current bookkeeping

- #49 Story Journey — **Regression-tested**
- #50 Wisdom Situations — **Regression-tested**
- #51 Deep Questions — **Regression-tested**
- #52 Expanded Guided Study — **Regression-tested**
- #53 Adaptive Learning — **Regression-tested**
- #54 Open/weak-area review — **Verified**
- #20 STEPBible tooling — **Implemented**
- Totals — **46 Regression-tested / 1 Verified / 1 Implemented / 52 Not started**

## Next sequence

1. Run the entire accumulated suite on the exact #54 bookkeeping state.
2. If green, freeze exact commit as `release/v3.20-open-review`.
3. Reassess remaining Bible-study/core-content debt rather than jumping automatically to a later unrelated feature. #20 remains Implemented; #14–17 remain Not started and are obvious candidates for dependency review.
4. Preserve Kids #38–40 as deferred/unpromoted until the priority order calls for them.

## Devotional / Ministry later milestone

Future implementation must preserve one ministry post/task identity for Message, Devotional, and Task; Pastor/Admin congregation-scoped response review; member-only access to their own response bodies; aggregate-only peer completion visibility; and backend/API/RLS privacy enforcement. Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse this same service architecture.

## Release discipline

- Do not modify `main` during the rebuild line.
- Do not replace production with incomplete v3.
- Do not modify production Cloudflare during the rebuild.
- Each milestone closes only after the exact bookkeeping state passes the accumulated suite and is frozen as a known-good release.
- Every bug fix records root cause and retains a regression test.
- Normal v3 CI is manual-only; isolated verification branches may temporarily use a push trigger for one-shot CI execution.
