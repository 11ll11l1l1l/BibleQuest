# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`. The feature inventory remains the authoritative parity ledger.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 39
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 59
- **Verified or better:** 40 / 100 (**40% strict parity completion**)
- **Fully regression-tested:** 39 / 100 (**39% stability coverage**)
- **Milestone 7:** Transform frozen at `release/v3.7-transform-complete`
- **Milestone 8:** Audio / Live Recordings / Media frozen through `release/v3.9-media-library`
- **Milestone 9:** Games active; core frozen at `release/v3.10-games-core`, Mixed Quest at `release/v3.11-mixed-quest`, Per-book Recall at `release/v3.12-per-book-recall`; Character Detective verified and awaiting exact bookkeeping freeze
- **Next target:** #37 Timeline after Character Detective bookkeeping freeze
- **Production:** v2 remains live; v3 has not replaced production

Feature status words retain their strict meanings from `FEATURE_INVENTORY_V3.md`. Milestone states below are schedule/progress labels only.

## 15-milestone rebuild sequence

| Milestone | Scope | Milestone state | Completion evidence / remaining work |
|---:|---|---|---|
| 1 | Shell / navigation | **Complete** | #1–5 Regression-tested |
| 2 | Authentication / session | **Complete** | #6–10 Regression-tested |
| 3 | Bible data / content | **Partial — parity gaps deferred** | #11–13, #18–19, #21–23 Regression-tested; #20 Implemented; #14–17 Not started |
| 4 | User progress / state | **Complete** | #24–27 Regression-tested |
| 5 | Lesson engine | **Complete (engine)** | #31 Regression-tested; individual game experiences belong to Games |
| 6 | Daily Mission | **Complete** | #28–30 Regression-tested |
| 7 | Transform | **Frozen complete** | #46–48 Regression-tested; `release/v3.7-transform-complete` |
| 8 | Audio / Live Recordings / Media | **Frozen complete** | #57–61 Regression-tested; through `release/v3.9-media-library` |
| 9 | Games | **Active** | #32–35, #41 Regression-tested; #36 Verified; #37–40, #42–43 remaining |
| 10 | Bible World | **Not started** | #44–45 |
| 11 | Tutorial / avatar | **Not started** | #84–85 |
| 12 | Secondary features | **Not started** | Remaining guided study, notes, community, ministry, admin, PWA/offline, recovery, and related parity rows |
| 13 | Full old-vs-new audit | **Not started** | Reconcile all 100 inventory rows; no compatibility-only row counts as parity |
| 14 | Mobile regression | **Not started** | Full accumulated mobile workflow pass after parity audit |
| 15 | Production deployment | **Not started** | Deploy v3 only after parity + stability gates pass |

## Milestone 9 evidence — Games

The Games core passed the accumulated suite on run `34064004752`, verifying one launcher owner with Quick Recall and Context Challenge. That checkpoint is frozen as `release/v3.10-games-core`.

Mixed Quest passed the entire accumulated suite on run `34065176532`, and its exact bookkeeping run `34065347665` also passed. It is frozen as `release/v3.11-mixed-quest`.

Per-book Recall passed the entire accumulated suite on run `34065874003`, then its exact bookkeeping run `34066568163` also passed. It is frozen as `release/v3.12-per-book-recall` at `38fb34b1b068c6678957a0a25f6cda88fb185cf0`.

Character Detective / Who Am I then passed the complete accumulated suite on retry run `34067063009`. The feature preserves the retained five clue/reference records for David, Joseph, Zacchaeus, Esther, and Peter; typed answers are trimmed and case-insensitive; correct/incorrect scoring is +12/+3 XP through Progress; duplicate submissions cannot award twice; last results persist; and replay advances to another clue set through the same Games owner. The first verification run `34066936451` reached the final Games browser test but failed only because the test used a non-unique `[data-game-launcher]` selector after the result view contained both “All games” and “Choose another game.” The stable result-action selector was made explicit and the complete retry run passed.

Current bookkeeping:
- #32 Quick Recall — **Regression-tested**
- #33 Context Challenge — **Regression-tested**
- #34 Mixed Quest — **Regression-tested**
- #35 Per-book Recall — **Regression-tested**
- #36 Character Detective / Who Am I — **Verified**
- #41 Game launcher — **Regression-tested**
- #61 Media Library — **Regression-tested**
- #20 STEPBible tooling — **Implemented**
- Totals — **39 Regression-tested / 1 Verified / 1 Implemented / 59 Not started**

## Milestone 9 implementation order — Games

1. #41 Game launcher — **Regression-tested**.
2. #32 Quick Recall — **Regression-tested**.
3. #33 Context Challenge — **Regression-tested**.
4. #34 Mixed Quest — **Regression-tested**; frozen through `release/v3.11-mixed-quest`.
5. #35 Per-book Recall — **Regression-tested**; frozen through `release/v3.12-per-book-recall`.
6. #36 Character Detective / Who Am I — **Verified**; exact bookkeeping freeze pending.
7. #37 Timeline game — next implementation target.
8. #38 Kids Memory Match.
9. #39 Hiragana Match.
10. #40 Kids Bible Who Am I.
11. #42 Same-room Play Together.
12. #43 Live Rooms.

Each game must use the shared lifecycle/progress/content/storage interfaces, clean up all listeners/state on switch/leave, pass mobile interaction, and run the entire accumulated suite before promotion.

## Deferred parity debt that must be cleared before 100%

- #14 Japanese 口語訳 — Not started
- #15 Japanese furigana — Not started
- #16 Japanese vocabulary learning — Not started
- #17 NLT live path — Not started
- #20 STEPBible lexical/context tools — Implemented, not yet Verified

## Release discipline

- Do not modify `main` during the rebuild line.
- Do not replace production with incomplete v3.
- Do not modify Cloudflare during the isolated rebuild.
- Each milestone closes only on an exact green bookkeeping commit and a frozen known-good release snapshot.
- Every bug fix records a root cause and adds a regression test that would have caught the bug.
- Normal v3 CI remains manual-only; isolated one-shot verification branches may temporarily use a push trigger solely for a single accumulated gate.
