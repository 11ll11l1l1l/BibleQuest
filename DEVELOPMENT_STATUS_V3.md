# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Frozen Transform checkpoint: `release/v3.7-transform-complete` at `e91ab8be922420ef7ab48b1ffde5dcb3db4a4634`.
- Frozen Audio/Recordings checkpoint: `release/v3.8-audio-recordings`.
- Frozen Media Library checkpoint: `release/v3.9-media-library`.
- Frozen Games core checkpoint: `release/v3.10-games-core`.
- Frozen Mixed Quest checkpoint: `release/v3.11-mixed-quest` at `51a73758a8a3bc8def2de87b6ffa3466bee845f0`.
- Frozen Per-book Recall checkpoint: `release/v3.12-per-book-recall` at `38fb34b1b068c6678957a0a25f6cda88fb185cf0`.
- Frozen Character Detective checkpoint: `release/v3.13-character-detective` at `7c33895158037727880a3ae8eb6c2d44ccef6621`.
- Frozen Timeline checkpoint: `release/v3.14-timeline` at `ddc40d54125185bfd47f96765182e76d89cb37c3`.
- Current development branch: `feature/v3-study-core`.
- Cloudflare remains untouched by the v3 rebuild.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 41 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 57 |
| Total | 100 |

Strict verified-or-better parity is now **42/100** and fully regression-tested stability coverage is **41/100**. Timeline (#37) is Regression-tested after the later Guided Study accumulated gate. Expanded Guided Study (#52) is Verified after run `34080576745`. #20 STEPBible lexical/context tooling remains Implemented parity debt.

## Completed milestone 7 — Transform

- #46 Basic Transform — Regression-tested.
- #47 Full Transform — Regression-tested.
- #48 Transform engine — Regression-tested.

## Completed milestone 8 — Audio / Live Recordings / Media

- #57 Audio manager — Regression-tested.
- #58 Recordings list — Regression-tested.
- #59 Live Recordings playback — Regression-tested.
- #60 Recording manager — Regression-tested.
- #61 Media Library — Regression-tested.
- `src/app/audio.js`, `src/app/recordings.js`, and `src/app/media-library.js` remain separate single owners with one shared player chain.
- Guest access makes no protected media cloud request.
- Leaving/switching playback tears down the prior player and accumulated later regressions remain green.

## Completed milestone 9 — Games core

- Quick Recall (#32) — Regression-tested.
- Context Challenge (#33) — Regression-tested.
- Mixed Quest (#34) — Regression-tested.
- Per-book Recall (#35) — Regression-tested.
- Character Detective / Who Am I (#36) — Regression-tested.
- Timeline (#37) — Regression-tested after the later Guided Study milestone passed.
- Game launcher (#41) — Regression-tested.
- Core Games are frozen through `release/v3.14-timeline`.
- Deeper Kids integration (#38–40) is intentionally deferred while the Bible-study core is prioritized. The separate Kids game surface remains accessible and is not being removed.

## Milestone 10 — Bible-study core

### Expanded Guided Study (#52) — Verified candidate complete

Functional accumulated run `34080576745` passed the full architecture, edge, and browser suite, including the new 390px Guided Study workflow and all earlier v3 subsystems.

Verified design:
- `src/engines/lesson.js` remains the only lesson lifecycle/state/persistence engine.
- `src/features/study/content.js` contains static curated study definitions only.
- `src/app/study.js` owns Guided Study library/open/resume/restart/completion/Reader handoff/close orchestration.
- `src/features/study/index.js` is presentation and event forwarding only.
- `src/core/progress.js` receives one deterministic completion event; reopening or repeated completion cannot duplicate activity/streak effects.
- Guided Study does not invent an unverified XP reward. Completion records `xp: 0`, meaningful activity, and one reflection metric.
- Objective lesson questions may be checked; personal reflection/application text is never scored as spiritual quality, diagnosis, moral rank, or divine approval.

Initial Scripture-first studies:
1. **Who Is My Neighbor?** — Luke 10:25–37.
2. **Abide and Bear Fruit** — John 15:1–17.
3. **Faith That Acts** — James 2:14–26.

Each follows passage → context → observation → meaning → private reflection → concrete response → completion.

Acceptance verified in run `34080576745`:
- Learn → Guided Study navigation.
- mobile 390px library/session without horizontal overflow.
- touch targets >=44px.
- full Good Samaritan study completion.
- answer locking and correct feedback.
- private text response persistence.
- deterministic completion progress with no duplicate award.
- reload/reopen completed state.
- explicit restart.
- Reader handoff to Luke 10.
- all earlier shell/account/reader/progress/lesson/Daily Mission/Transform/media/Games browser regressions remained green.

The exact bookkeeping state still requires one final accumulated run before the checkpoint is frozen as `release/v3.15-guided-study`.

## Future Devotional / Ministry requirement

`DEVOTIONAL_MINISTRY_DESIGN_V3.md` is now the design contract for the later high-priority ministry workflow.

Required future behavior:
- Pastor/Admin publishes first-class **Message**, **Devotional**, or **Task** posts through a freeform composer.
- Members receive eligible congregation posts in the future Ministry Hub/Inbox.
- A Task may contain question/prompt fields and members submit their own response.
- A normal member can read only the published post, their own response, their own status, and permitted aggregate completion count such as `18 answered`.
- Other members' response bodies remain unavailable to ordinary members at the API/RLS level, not merely hidden by UI.
- Authorized Pastor/Admin users can review individual responses only within their congregation scope.
- Ministry Hub, Inbox, Assignments, Workspace, and later push delivery must reuse one ministry post/task identity and service boundary.

Primary later inventory mapping: #66 and #73–78. Design documentation alone does not promote those rows.

## Next major milestone

After the exact Guided Study bookkeeping gate is green and `release/v3.15-guided-study` is frozen, continue Bible-study core with **#51 Deep Questions**. Deep Questions should reuse the verified Lesson/Study infrastructure where practical and should hand reflections/notes toward the future #55 private-notes owner rather than creating its own persistence model. Then continue #49 Story Journey and #50 Wisdom Situations before adaptive learning (#53–54).

Kids #38–40 remain deferred but accessible through the existing separate Kids surface.

## Defect / root-cause ledger

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-SIGNUP-001` — recovery-code issuance is independent from optional auto-sign-in.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate signup and post-recovery login are explicit tests.
- `V3-READER-ACCEPTANCE-001` — invalid search respects native form validation.
- `V3-PROGRESS-UI-001` — static label readability is separate from touch-target semantics.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-TRANSFORM-PROGRESS-001` — Full Transform used an unsupported `assessments` metric; the central progress owner defines and tests it.
- `V3-RECORDINGS-FREEZE-001` — v2 accumulated global media runtime, observer injection, and repeated player lifecycle patches. v3 replaces it with one Audio owner and one Recordings owner, explicit teardown, bounded requests, and one-player browser regression.
- `V3-AUDIO-VALIDATOR-001` — the architecture validator initially checked the wrong source token; it was corrected before functional CI proceeded.
- `V3-MEDIA-OWNER-001` — Media Library parity could have recreated a second player/backend path. v3 instead composes the already-verified Recordings and Audio owners, and architecture validation forbids iframe/backend ownership inside the Media Library layer.
- `V3-GAMES-SHELL-ACCEPTANCE-001` — the accumulated shell test hard-coded the old placeholder Play heading. The rebuilt Games route was correct; the test now asserts the stable route/launcher contract instead of placeholder copy.
- `V3-GAMES-OWNER-001` — old game modes shared fragmented global state and ad-hoc listeners. v3 centralizes launch/answer/score/replay/switch/leave and result persistence in `src/app/games.js`, with architecture and edge tests preventing duplicate owners or direct progress/storage bypass.
- `V3-RECALL-PACK-001` — old Per-book Recall mixed fetching, filtering, review-state mutation, XP, and rendering in one runtime. v3 isolates pack loading/validation/cache in `src/core/recall-packs.js`, keeps gameplay in the existing Games owner, filters quarantined/non-allow rows, and verifies malformed/unavailable pack handling.
- `V3-DETECTIVE-SELECTOR-001` — the first Character Detective browser gate used a non-unique `[data-game-launcher]` test selector after feedback rendered two valid launcher actions. The application lifecycle was correct; the acceptance selector was made explicit and retry run `34067063009` passed the entire suite.
- `V3-TIMELINE-XP-001` — the old Timeline retry path could award +4 XP repeatedly for repeated wrong checks. v3 records only the first miss, gives no additional reward for repeated failed checks, and awards the remaining +16 on later solve; edge/browser regression guards this behavior.
- `V3-STUDY-SYNTAX-001` — the first Guided Study content freezer compressed nested immutable transforms into one dense expression and had an unmatched parenthesis. The architecture syntax gate caught it before functional tests. It was replaced by an explicit `freezeStudy()` function and remains syntax-checked with every architecture run.
- `V3-STUDY-BOUNDARY-001` — after Study close, `getState()` initially leaked the lower Lesson-engine error instead of enforcing the Study owner's public boundary. Edge regression caught it; `getState()` now runs `requireOpen()` before delegating to Lesson.
- `V3-STUDY-LEARN-ACCEPTANCE-001` — adding Guided Study changed the stable Learn `<h1>` copy and broke the accumulated shell acceptance workflow. The stable `Learn` heading was restored while retaining the new Study entry and richer description; the old shell regression then passed unchanged.
- `V3-STUDY-READER-TEST-001` — the Guided Study Reader acceptance was hardened to wait for the actual Reader controls and assert `LUK` + chapter `10`, preventing a false pass/failure on the Reader's loading shell.

## Release rule

Expanded Guided Study passed the entire accumulated functional suite on run `34080576745`. The exact inventory/status/timeline/architecture bookkeeping state must pass the full suite once more before the checkpoint is frozen as `release/v3.15-guided-study`. Production v2 remains unchanged until all applicable capability rows satisfy the parity and stability gates.
