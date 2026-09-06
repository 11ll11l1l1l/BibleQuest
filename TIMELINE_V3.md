# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-06 20:36 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`. The feature inventory remains the authoritative parity ledger.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 27
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 71
- **Verified or better:** 28 / 100 (**28% strict parity completion**)
- **Fully regression-tested:** 27 / 100 (**27% stability coverage**)
- **Active milestone:** 7 / 15 — Transform
- **Production:** v2 remains live; v3 has not replaced `gh-pages`

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
| 7 | Transform | **Active** | #46 Verified; #48 Regression-tested; #47 Full Transform is the active parity target |
| 8 | Audio / Live Recordings | **Blocked** | Starts only after #47 passes its real workflow, the accumulated suite is green, and the Transform milestone is frozen |
| 9 | Games | **Not started** | #32–43 migration/verification, including one game lifecycle owner |
| 10 | Bible World | **Not started** | #44–45 |
| 11 | Tutorial / avatar | **Not started** | #84–85 |
| 12 | Secondary features | **Not started** | Remaining guided study, notes, community, ministry, admin, PWA/offline, recovery, and related parity rows |
| 13 | Full old-vs-new audit | **Not started** | Reconcile every one of the 100 inventory rows; no compatibility-only row may be counted as parity |
| 14 | Mobile regression | **Not started** | Full accumulated mobile workflow pass after parity audit |
| 15 | Production deployment | **Not started** | Deploy v3 only after parity + stability gates pass; production v2 stays untouched before then |

## Active Transform gate

Full Transform (#47) must pass all of the following before the milestone can close:

1. Passage/input → transform → result works through the native v3 Transform path.
2. Leave → return restores the correct state without a stale Transform instance.
3. Guest workflow is isolated from account/cloud behavior.
4. Account workflow persists only through the defined v3 storage/session/service boundaries.
5. Mobile workflow is usable without overflow or broken controls.
6. Existing Basic Transform (#46) and Transform engine (#48) tests continue to pass.
7. The entire accumulated v3 regression suite passes.
8. The feature-ledger/timeline bookkeeping commit itself passes the entire suite again.
9. Freeze the exact green checkpoint as `release/v3.7-transform-complete`.

Expected bookkeeping after #47 first passes verification (before any later milestone can regression-promote #47):

- #46: **Regression-tested**
- #47: **Verified**
- #48: **Regression-tested**
- Totals: **28 Regression-tested / 1 Verified / 0 Implemented / 71 Not started**

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
- Do not replace production `gh-pages` with incomplete v3.
- Do not modify Cloudflare.
- Each milestone closes only on an exact green commit and a frozen known-good release snapshot.
- Every bug fix records a root cause and adds a regression test that would have caught the bug.
