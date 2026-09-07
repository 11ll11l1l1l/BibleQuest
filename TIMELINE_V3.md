# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`. The feature inventory remains the authoritative parity ledger.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 40
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 58
- **Verified or better:** 41 / 100 (**41% strict parity completion**)
- **Fully regression-tested:** 40 / 100 (**40% stability coverage**)
- **Milestone 7:** Transform frozen at `release/v3.7-transform-complete`
- **Milestone 8:** Audio / Live Recordings / Media frozen through `release/v3.9-media-library`
- **Milestone 9:** Games active; frozen through `release/v3.13-character-detective`; Timeline verified and awaiting exact bookkeeping freeze
- **Next target:** #38 Kids Memory Match after Timeline bookkeeping freeze
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
| 9 | Games | **Active** | #32–36, #41 Regression-tested; #37 Verified; #38–40, #42–43 remaining |
| 10 | Bible World | **Not started** | #44–45 |
| 11 | Tutorial / avatar | **Not started** | #84–85 |
| 12 | Secondary features | **Not started** | Remaining guided study, notes, community, ministry, admin, PWA/offline, recovery, and related parity rows |
| 13 | Full old-vs-new audit | **Not started** | Reconcile all 100 inventory rows; no compatibility-only row counts as parity |
| 14 | Mobile regression | **Not started** | Full accumulated mobile workflow pass after parity audit |
| 15 | Production deployment | **Not started** | Deploy v3 only after parity + stability gates pass |

## Milestone 9 evidence — Games

- Games core passed accumulated run `34064004752` and is frozen as `release/v3.10-games-core`.
- Mixed Quest passed run `34065176532` plus bookkeeping run `34065347665` and is frozen as `release/v3.11-mixed-quest`.
- Per-book Recall passed run `34065874003` plus bookkeeping run `34066568163` and is frozen as `release/v3.12-per-book-recall` at `38fb34b1b068c6678957a0a25f6cda88fb185cf0`.
- Character Detective passed retry run `34067063009` plus bookkeeping run `34067320927` and is frozen as `release/v3.13-character-detective` at `7c33895158037727880a3ae8eb6c2d44ccef6621`.
- Timeline code was added at `e49c9c08b2f3cf8a107b2a16880657e35e4c4f16` and passed the complete accumulated suite on run `34071571139`.

Timeline verification covered:
1. Three retained datasets: Big Bible Story, Life of Jesus, and Genesis Journey.
2. All reorder/check/retry/result/replay state runs through `src/app/games.js`.
3. `src/features/games/timelines.js` is static content only.
4. Repeated failed checks cannot farm XP.
5. The first failed check awards +4 XP; a later solve awards +16, preserving +20 total for a solved round.
6. Correct-first completion awards +20 once.
7. Result persistence uses the shared Storage boundary.
8. Switching/leaving resets active Timeline state through the shared launcher lifecycle.
9. Mobile reorder controls remain usable at 390px with no horizontal overflow.
10. All earlier shell/account, Reader, Progress, Lesson, Daily Mission, Transform, Live Recordings, Media Library, Recall and Games regressions remained green.

Current bookkeeping:
- #32 Quick Recall — **Regression-tested**
- #33 Context Challenge — **Regression-tested**
- #34 Mixed Quest — **Regression-tested**
- #35 Per-book Recall — **Regression-tested**
- #36 Character Detective / Who Am I — **Regression-tested**
- #37 Timeline — **Verified**
- #41 Game launcher — **Regression-tested**
- #61 Media Library — **Regression-tested**
- #20 STEPBible tooling — **Implemented**
- Totals — **40 Regression-tested / 1 Verified / 1 Implemented / 58 Not started**

## Milestone 9 implementation order — Games

1. #41 Game launcher — **Regression-tested**.
2. #32 Quick Recall — **Regression-tested**.
3. #33 Context Challenge — **Regression-tested**.
4. #34 Mixed Quest — **Regression-tested**; frozen through `release/v3.11-mixed-quest`.
5. #35 Per-book Recall — **Regression-tested**; frozen through `release/v3.12-per-book-recall`.
6. #36 Character Detective / Who Am I — **Regression-tested**; frozen through `release/v3.13-character-detective`.
7. #37 Timeline game — **Verified**; exact bookkeeping freeze pending.
8. #38 Kids Memory Match — next implementation target.
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
