# BibleQuest v3 Rebuild Timeline

Updated: 2026-09-07 JST

This timeline is a progress view over `FEATURE_INVENTORY_V3.md`. The feature inventory remains the authoritative parity ledger.

## Current completion snapshot

- **Total old-version capabilities:** 100
- **Regression-tested:** 41
- **Verified:** 1
- **Implemented:** 1
- **Not started:** 57
- **Verified or better:** 42 / 100 (**42% strict parity completion**)
- **Fully regression-tested:** 41 / 100 (**41% stability coverage**)
- **Milestone 7:** Transform frozen at `release/v3.7-transform-complete`
- **Milestone 8:** Audio / Live Recordings / Media frozen through `release/v3.9-media-library`
- **Milestone 9:** Core Games frozen through `release/v3.14-timeline`
- **Milestone 10 current state:** #52 Expanded Guided Study Verified after accumulated run `34080576745`; exact bookkeeping gate still required before freeze
- **Next Bible-study target after freeze:** #51 Deep Questions
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
| 5 | Lesson engine | **Complete (engine)** | #31 Regression-tested; reused by Guided Study |
| 6 | Daily Mission | **Complete** | #28–30 Regression-tested |
| 7 | Transform | **Frozen complete** | #46–48 Regression-tested; `release/v3.7-transform-complete` |
| 8 | Audio / Live Recordings / Media | **Frozen complete** | #57–61 Regression-tested; through `release/v3.9-media-library` |
| 9 | Games core | **Frozen core** | #32–37, #41 Regression-tested; frozen through `release/v3.14-timeline` |
| 10 | Bible-study core | **Active** | #52 Verified; exact bookkeeping/freeze next, then #51/#49/#50 |
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
- Timeline later survived the full Guided Study accumulated run `34080576745` and is therefore now Regression-tested.

## Milestone 10 — Bible-study core

### #52 Expanded Guided Study — Verified

Guided Study is built on the already Regression-tested `src/engines/lesson.js`; it does not create a second lesson engine.

Verified owner boundaries:
1. Static curated definitions live in `src/features/study/content.js`.
2. `src/app/study.js` owns library selection, open/resume/restart, completion reconciliation, Reader handoff, and leave/close.
3. Lesson step/response/validation/persistence remains exclusively in `src/engines/lesson.js`.
4. `src/features/study/index.js` is presentation/event forwarding only.
5. Completion records one deterministic Progress event; reopening/repeated completion cannot farm XP or activity.
6. Guided Study intentionally adds no unverified XP reward; completion uses `xp: 0`, meaningful activity, and `{reflections:1}`.
7. Personal reflection/application remains private lesson response data at this stage and is never scored as spiritual quality, diagnosis, moral rank, or divine approval.

Initial studies:
- **Who Is My Neighbor?** — Luke 10:25–37
- **Abide and Bear Fruit** — John 15:1–17
- **Faith That Acts** — James 2:14–26

Each uses passage → context → observation → meaning → reflection → concrete response → completion.

Accumulated verification run `34080576745` passed:
- strengthened Study architecture boundaries
- all existing edge regressions
- Guided Study edge regression
- shell/account browser regression
- Reader, Progress, Lesson browser regressions
- full 390px Guided Study browser workflow
- Daily Mission
- Transform engine/basic/full
- Live Recordings
- Media Library
- Games

Guided Study browser verification included mobile no-overflow/touch targets, full Luke 10 completion, answer locking, private response persistence, deterministic completion event, reload/reopen, restart, and Reader handoff to Luke 10.

Three defects were caught and fixed before verification:
- dense content-freezer syntax error caught by architecture syntax validation
- Study `getState()` leaking the lower Lesson error after close, caught by edge regression
- Learn page stable `<h1>Learn</h1>` compatibility regression caught by the accumulated shell browser suite

### Next after Guided Study freeze

After the exact bookkeeping state passes one more accumulated gate and `release/v3.15-guided-study` is frozen:
1. #51 Deep Questions
2. #49 Story Journey
3. #50 Wisdom Situations
4. #53 Adaptive learning
5. #54 Open/weak-area review

Deep Questions should reuse Study/Lesson lifecycle where appropriate and should not create its own permanent note store; any save-note handoff should lead toward the future #55 Private local notes owner.

## Current bookkeeping

- #32 Quick Recall — **Regression-tested**
- #33 Context Challenge — **Regression-tested**
- #34 Mixed Quest — **Regression-tested**
- #35 Per-book Recall — **Regression-tested**
- #36 Character Detective / Who Am I — **Regression-tested**
- #37 Timeline — **Regression-tested**
- #41 Game launcher — **Regression-tested**
- #52 Expanded Guided Study — **Verified**
- #61 Media Library — **Regression-tested**
- #20 STEPBible tooling — **Implemented**
- Totals — **41 Regression-tested / 1 Verified / 1 Implemented / 57 Not started**

## Devotional / Ministry later milestone

This is a high-priority product requirement and is intentionally designed before implementation so privacy is not patched in later.

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
