# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`. The feature inventory remains the authoritative parity ledger.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 29
- **Verified:** 4
- **Implemented:** 1
- **Not started:** 66
- **Verified or better:** 33 / 100 (**33% strict parity completion**)
- **Fully regression-tested:** 29 / 100 (**29% stability coverage**)
- **Milestone 7:** Transform frozen at `release/v3.7-transform-complete`
- **Milestone 8A:** Audio / Live Recordings verified
- **Active target:** Milestone 8B — Media Library (#61)
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
| 8 | Audio / Live Recordings / Media | **Active** | #57–60 Verified; #61 Media Library next |
| 9 | Games | **Not started** | #32–43 migration/verification, including one game lifecycle owner |
| 10 | Bible World | **Not started** | #44–45 |
| 11 | Tutorial / avatar | **Not started** | #84–85 |
| 12 | Secondary features | **Not started** | Remaining guided study, notes, community, ministry, admin, PWA/offline, recovery, and related parity rows |
| 13 | Full old-vs-new audit | **Not started** | Reconcile all 100 inventory rows; no compatibility-only row counts as parity |
| 14 | Mobile regression | **Not started** | Full accumulated mobile workflow pass after parity audit |
| 15 | Production deployment | **Not started** | Deploy v3 only after parity + stability gates pass |

## Milestone 8A evidence

Audio / Live Recordings passed the entire accumulated suite on isolated verification run `34044293858` at `a4493a9b72d6d3ef1d1ccc4f4e6371b30f75ae99`.

Acceptance demonstrated:
1. One Audio/player owner.
2. One Recordings lifecycle owner.
3. Defined API/media boundary with bounded request failure.
4. Guest access produces no cloud request.
5. Loading, empty and error states are explicit.
6. Play, pause, seek and stop operate through the single owner.
7. Switching sources tears the prior iframe down first.
8. Leaving and returning does not leave hidden/duplicate players.
9. Unsupported/malformed recording sources fail safely.
10. Legacy valid YouTube live URLs remain readable even when a stored `youtube_id` is missing.
11. Desktop and 390px mobile browser regressions pass.
12. All earlier v3 milestones remained green, regression-promoting Full Transform (#47).

Current bookkeeping:
- #47 Full Transform — **Regression-tested**
- #57 Audio manager — **Verified**
- #58 Recordings list — **Verified**
- #59 Live Recordings playback — **Verified**
- #60 Recording manager — **Verified**
- #20 STEPBible tooling — **Implemented**
- Totals — **29 Regression-tested / 4 Verified / 1 Implemented / 66 Not started**

## Milestone 8B acceptance contract — Media Library (#61)

1. Browse supported published media through an owning media service/data boundary.
2. Explicit loading, empty, permission and failure states.
3. Open supported media through existing Audio/Recordings ownership when playback is required; do not create another player owner.
4. External resources use validated safe links and clean return behavior.
5. Leaving and returning keeps shell/navigation stable and does not leak media state or listeners.
6. Guest/account boundaries are explicit; guests must not accidentally contact protected cloud data.
7. Desktop and 390px mobile workflows pass without overflow or unusable controls.
8. Architecture validation must reject a second media/player runtime.
9. The entire accumulated v3 suite must pass before #61 is promoted.
10. After #61 is Verified, #57–60 become Regression-tested and the exact green bookkeeping checkpoint is frozen as the complete Milestone 8 release.

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
- Each milestone closes only on an exact green commit and a frozen known-good release snapshot.
- Every bug fix records a root cause and adds a regression test that would have caught the bug.
- Normal v3 CI remains manual-only; isolated one-shot verification branches may temporarily use a push trigger solely to execute a single accumulated gate.
