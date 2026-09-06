# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`. The feature inventory remains the authoritative parity ledger.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 33
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 65
- **Verified or better:** 34 / 100 (**34% strict parity completion**)
- **Fully regression-tested:** 33 / 100 (**33% stability coverage**)
- **Milestone 7:** Transform frozen at `release/v3.7-transform-complete`
- **Milestone 8A:** Audio / Live Recordings frozen at `release/v3.8-audio-recordings`
- **Milestone 8B:** Media Library verified; final bookkeeping gate pending
- **Next target:** Milestone 9 — Games (#32–43)
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
| 8 | Audio / Live Recordings / Media | **Complete candidate** | #57–60 Regression-tested; #61 Verified; final exact bookkeeping regression then freeze `release/v3.9-media-library` |
| 9 | Games | **Next** | #32–43; start with one launcher/lifecycle owner (#41) plus Quick Recall (#32) |
| 10 | Bible World | **Not started** | #44–45 |
| 11 | Tutorial / avatar | **Not started** | #84–85 |
| 12 | Secondary features | **Not started** | Remaining guided study, notes, community, ministry, admin, PWA/offline, recovery, and related parity rows |
| 13 | Full old-vs-new audit | **Not started** | Reconcile all 100 inventory rows; no compatibility-only row counts as parity |
| 14 | Mobile regression | **Not started** | Full accumulated mobile workflow pass after parity audit |
| 15 | Production deployment | **Not started** | Deploy v3 only after parity + stability gates pass |

## Milestone 8 completion evidence

Audio / Live Recordings passed its accumulated suite on run `34044293858`; the Audio bookkeeping suite later passed on run `34044792031`. Media Library then passed the entire later accumulated suite on run `34045487840`.

The later Media Library run demonstrated:
1. Existing shell/account/Reader/progress/lesson/Daily Mission/Transform regressions remain green.
2. Audio/Recordings edge and browser regressions remain green, regression-promoting #57–60.
3. Media Library architecture and edge tests pass.
4. Guest route makes no protected cloud request.
5. Browse, All/Featured filter and search work.
6. Media opens through the existing Recordings → Audio ownership chain.
7. Play/pause/seek/stop work without a second player.
8. Back-to-library, source reopen, route leave and return leave no hidden/duplicate player.
9. Desktop and 390px mobile workflows pass with no overflow and 44px minimum controls.
10. Media Library remains a browse orchestration layer rather than another backend/player runtime.

Current bookkeeping:
- #47 Full Transform — **Regression-tested**
- #57 Audio manager — **Regression-tested**
- #58 Recordings list — **Regression-tested**
- #59 Live Recordings playback — **Regression-tested**
- #60 Recording manager — **Regression-tested**
- #61 Media Library — **Verified**
- #20 STEPBible tooling — **Implemented**
- Totals — **33 Regression-tested / 1 Verified / 1 Implemented / 65 Not started**

## Milestone 9 implementation order — Games

To avoid rebuilding the old fragmented runtime, Games starts by defining one launcher/lifecycle boundary and immediately exercising it with a real game.

1. #41 Game launcher — one launch/switch/teardown/session owner.
2. #32 Quick Recall — first complete game through that launcher; answer → feedback → score → next → finish → replay.
3. #33 Context Challenge.
4. #34 Mixed Quest.
5. #35 Per-book Recall.
6. #36 Character Detective / Who Am I.
7. #37 Timeline game.
8. #38 Kids Memory Match.
9. #39 Hiragana Match.
10. #40 Kids Bible Who Am I.
11. #42 Same-room Play Together.
12. #43 Live Rooms.

Each game must use defined shared lifecycle/progress/content interfaces, clean up all listeners/state on switch/leave, pass mobile interaction, and run the entire accumulated suite before promotion.

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
