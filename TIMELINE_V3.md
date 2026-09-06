# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`. The feature inventory remains the authoritative parity ledger.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 28
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 70
- **Verified or better:** 29 / 100 (**29% strict parity completion**)
- **Fully regression-tested:** 28 / 100 (**28% stability coverage**)
- **Milestone 7:** Transform implementation and acceptance complete; final bookkeeping regression/freeze is the release gate
- **Next milestone:** 8 / 15 — Audio / Live Recordings
- **Production:** v2 remains live; v3 has not replaced production

Feature status words retain their strict meanings from `FEATURE_INVENTORY_V3.md`. Milestone states below are only schedule/progress labels and do not replace feature statuses.

## 15-milestone rebuild sequence

| Milestone | Scope | Milestone state | Completion evidence / remaining work |
|---:|---|---|---|
| 1 | Shell / navigation | **Complete** | #1–5 Regression-tested |
| 2 | Authentication / session | **Complete** | #6–10 Regression-tested |
| 3 | Bible data / content | **Partial — parity gaps deferred** | #11–13, #18–19, #21–23 Regression-tested; #20 Implemented; #14–17 Not started |
| 4 | User progress / state | **Complete** | #24–27 Regression-tested |
| 5 | Lesson engine | **Complete (engine)** | #31 Regression-tested. Individual game/lesson experiences #32–40 belong to the later Games migration |
| 6 | Daily Mission | **Complete** | #28–30 Regression-tested |
| 7 | Transform | **Complete candidate** | #46 and #48 Regression-tested; #47 Verified; accumulated suite green at `16a611708f55147008aa00b361309cbd1dc9999d`; final ledger/status/timeline regression and release freeze pending |
| 8 | Audio / Live Recordings | **Next** | #57–60; one audio owner and one recording owner; no legacy freeze-prone runtime architecture |
| 9 | Games | **Not started** | #32–43 migration/verification, including one game lifecycle owner |
| 10 | Bible World | **Not started** | #44–45 |
| 11 | Tutorial / avatar | **Not started** | #84–85 |
| 12 | Secondary features | **Not started** | Remaining guided study, notes, community, ministry, admin, PWA/offline, recovery, and related parity rows |
| 13 | Full old-vs-new audit | **Not started** | Reconcile every one of the 100 inventory rows; no compatibility-only row may be counted as parity |
| 14 | Mobile regression | **Not started** | Full accumulated mobile workflow pass after parity audit |
| 15 | Production deployment | **Not started** | Deploy v3 only after parity + stability gates pass; production v2 stays untouched before then |

## Transform completion gate

The Transform milestone is considered frozen only when all of the following are true:

1. Native v3 Basic and Full workflows use the same single Transform engine/orchestration ownership.
2. Full Transform personality and thinking-pattern workflows complete and restore saved results.
3. Private reflection/journal persistence survives reload and result recalculation cannot farm XP.
4. Guest workflow performs no Supabase request.
5. Mobile workflow remains usable without overflow or undersized controls.
6. Existing foundation/account/reader/progress/lesson/Daily Mission regressions continue to pass.
7. The accumulated v3 regression suite passes.
8. The final feature-ledger/status/timeline bookkeeping commit passes the entire suite again.
9. The exact green checkpoint is frozen as `release/v3.7-transform-complete`.

Current correct bookkeeping before the later Audio milestone can regression-promote #47:

- #46: **Regression-tested**
- #47: **Verified**
- #48: **Regression-tested**
- #20: **Implemented**
- Totals: **28 Regression-tested / 1 Verified / 1 Implemented / 70 Not started**

## Milestone 8 acceptance contract

Audio / Live Recordings must not recreate the v2 patch stack. The v3 target is:

1. One audio/player owner for play, pause, seek, stop, state publication and teardown.
2. One recording-session owner for list/source selection, switching, lifecycle cleanup and errors.
3. Recordings list loads through a defined data boundary with explicit loading, empty and failure states.
4. Starting one recording must not create duplicate players or listeners.
5. Switching recordings stops/tears down the previous source before activating the next.
6. Leaving the page destroys playback state cleanly; returning creates one fresh view over the owner state.
7. Unsupported/failed media produces a recoverable visible error rather than a frozen shell.
8. Desktop and 390px mobile workflows pass.
9. The entire accumulated v3 suite passes before any Audio/Recordings row is promoted.

## Deferred parity debt that must be cleared before 100%

The rebuild sequence may advance while isolated work is deferred, but the project cannot claim parity until these and every other remaining row are Verified or Regression-tested. The currently visible earlier-milestone debt is:

- #14 Japanese 口語訳 — Not started
- #15 Japanese furigana — Not started
- #16 Japanese vocabulary learning — Not started
- #17 NLT live path — Not started
- #20 STEPBible lexical/context tools — Implemented, not yet Verified

These items must be returned to no later than the full old-vs-new audit milestone if they are not completed earlier.

## Release discipline

- Do not modify `main` during the rebuild line.
- Do not replace production with incomplete v3.
- Do not modify Cloudflare during the isolated rebuild.
- Each milestone closes only on an exact green commit and a frozen known-good release snapshot.
- Every bug fix records a root cause and adds a regression test that would have caught the bug.
- After the Transform freeze, remove automatic v3 push-triggered GitHub Actions and return CI execution to manual-only operation.
