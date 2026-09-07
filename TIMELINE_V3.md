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
- **Milestone 9:** Core Games frozen through `release/v3.14-timeline`
- **Current target:** #52 Expanded Guided Study on `feature/v3-study-core`
- **Kids arcade:** remains accessible; deeper #38–40 integration is deferred while Bible-study core is prioritized
- **Later high-priority ministry requirement:** Pastor/Admin Message + Devotional + Task publishing, member private task responses, Pastor/Admin-only response bodies, member-visible aggregate answer count; see `DEVOTIONAL_MINISTRY_DESIGN_V3.md`
- **Production:** v2 remains live; v3 has not replaced production

Feature status words retain their strict meanings from `FEATURE_INVENTORY_V3.md`. Design documentation alone never promotes a feature row.

## Reprioritized rebuild sequence

| Milestone | Scope | Milestone state | Completion evidence / remaining work |
|---:|---|---|---|
| 1 | Shell / navigation | **Complete** | #1–5 Regression-tested |
| 2 | Authentication / session | **Complete** | #6–10 Regression-tested |
| 3 | Bible data / content | **Partial — parity gaps deferred** | #11–13, #18–19, #21–23 Regression-tested; #20 Implemented; #14–17 Not started |
| 4 | User progress / state | **Complete** | #24–27 Regression-tested |
| 5 | Lesson engine | **Complete (engine)** | #31 Regression-tested; now reused by Guided Study |
| 6 | Daily Mission | **Complete** | #28–30 Regression-tested |
| 7 | Transform | **Frozen complete** | #46–48 Regression-tested; `release/v3.7-transform-complete` |
| 8 | Audio / Live Recordings / Media | **Frozen complete** | #57–61 Regression-tested; through `release/v3.9-media-library` |
| 9 | Games core | **Frozen core** | #32–36, #41 Regression-tested; #37 Verified; frozen through `release/v3.14-timeline` |
| 10 | Bible-study core | **Active** | #52 first; then #51/#49/#50 as shared Study infrastructure permits |
| 11 | Devotional / Ministry foundation | **Designed, not implemented** | High priority later; maps primarily to #66 and #73–78 |
| 12 | Bible World / tutorial / remaining parity | **Not started** | #44–45, #84–85 and other remaining parity rows |
| 13 | Full old-vs-new audit | **Not started** | Reconcile all 100 inventory rows; no compatibility-only row counts as parity |
| 14 | Mobile regression | **Not started** | Full accumulated mobile workflow pass after parity audit |
| 15 | Production deployment | **Not started** | Deploy v3 only after parity + stability gates pass |

## Milestone 9 evidence — Games core

- Games core passed accumulated run `34064004752` and is frozen as `release/v3.10-games-core`.
- Mixed Quest passed run `34065176532` plus bookkeeping run `34065347665` and is frozen as `release/v3.11-mixed-quest`.
- Per-book Recall passed run `34065874003` plus bookkeeping run `34066568163` and is frozen as `release/v3.12-per-book-recall` at `38fb34b1b068c6678957a0a25f6cda88fb185cf0`.
- Character Detective passed retry run `34067063009` plus bookkeeping run `34067320927` and is frozen as `release/v3.13-character-detective` at `7c33895158037727880a3ae8eb6c2d44ccef6621`.
- Timeline passed the full accumulated functional run `34071571139` and exact bookkeeping run `34071916832`.
- Timeline is frozen as `release/v3.14-timeline` at `ddc40d54125185bfd47f96765182e76d89cb37c3`.

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
10. All earlier accumulated regressions remained green.

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

## Milestone 10 — Bible-study core

### First target: #52 Expanded Guided Study

Guided Study must reuse the already Regression-tested `src/engines/lesson.js` lifecycle instead of creating another lesson engine.

Planned boundaries:
1. Static curated study definitions in `src/features/study/content.js`.
2. `src/app/study.js` owns study selection/open/resume/restart/completion handoff/leave.
3. Lesson step/response/validation/persistence remains exclusively in `src/engines/lesson.js`.
4. `src/features/study/index.js` is presentation only.
5. Completion records one deterministic Progress event; reopening cannot farm XP/streak.
6. Study flow emphasizes Scripture passage/context, observation, understanding, reflection, and application.
7. Personal reflection/application is never scored as spiritual quality or divine approval.
8. Resume, restart, leave/return, mobile, persistence, and accumulated regression must pass before #52 can become Verified.

After #52 is frozen, next Bible-study priorities should reuse the same infrastructure where appropriate:
- #51 Deep Questions
- #49 Story Journey
- #50 Wisdom Situations
- then #53 Adaptive learning and #54 weak-area review when their prerequisites are stable

## Devotional / Ministry later milestone

This is a high-priority product requirement but is intentionally designed before implementation so privacy is not patched in later.

Required future behavior:
1. Pastor/Admin can publish a freeform **Message**, **Devotional**, or **Task**.
2. Congregation members receive published items in the future Ministry Hub/Inbox.
3. Tasks can contain one or more questions/prompts and members can submit their own freeform response.
4. Individual response bodies are visible only to authorized Pastor/Admin for that congregation and to the member who authored their own response.
5. Ordinary members may see only allowed aggregate completion information such as `18 answered`; they cannot read peer answers.
6. Privacy is enforced server-side/RLS/API, not by hiding UI elements.
7. Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push reuse one ministry post/task identity and service boundary.

Detailed contract: `DEVOTIONAL_MINISTRY_DESIGN_V3.md`.

Primary later inventory mapping: #66 and #73–78. No status promotion occurs until implementation and regression are complete.

## Kids accessibility decision

The separate Kids game surface remains available for parity/accessibility. Deeper integration of #38 Kids Memory Match, #39 Hiragana Match, and #40 Kids Bible Who Am I is deferred while core Bible-study and devotional/ministry work is prioritized.

Any unfinished Kids implementation remains isolated from the clean Bible-study branch and cannot be used as evidence to promote #38–40.

## Deferred parity debt that must be cleared before 100%

- #14 Japanese 口語訳 — Not started
- #15 Japanese furigana — Not started
- #16 Japanese vocabulary learning — Not started
- #17 NLT live path — Not started
- #20 STEPBible lexical/context tools — Implemented, not yet Verified
- #38–40 deeper Kids integration — deferred, not promoted

## Release discipline

- Do not modify `main` during the rebuild line.
- Do not replace production with incomplete v3.
- Do not modify Cloudflare during the isolated rebuild.
- Each milestone closes only on an exact green bookkeeping commit and a frozen known-good release snapshot.
- Every bug fix records a root cause and adds a regression test that would have caught the bug.
- Normal v3 CI remains manual-only; isolated one-shot verification branches may temporarily use a push trigger solely for a single accumulated gate.
