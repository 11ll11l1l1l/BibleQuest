# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Cloudflare remains untouched by the v3 rebuild.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.
- Frozen checkpoints now extend through `release/v3.16-deep-questions` at `e287fb6179bddece7d9cb31e5496924e524f83fd`.
- Deep Questions bookkeeping run `34082727818` passed before that freeze.
- Prior Bible-study checkpoint: `release/v3.15-guided-study` at `cf8740e623460f062c321d01d903267e79885c4c` after run `34081724365`.
- Earlier frozen core line remains unchanged through Transform, Audio/Recordings/Media, Games, Mixed Quest, Per-book Recall, Character Detective, and Timeline.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 43 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 55 |
| Total | 100 |

Strict verified-or-better parity is **44/100**. Fully regression-tested stability coverage is **43/100**.

Current promotions:
- #52 Expanded Guided Study — Regression-tested.
- #51 Deep Questions — Regression-tested after surviving Story Journey run `34083462882`.
- #49 Story Journey — Verified after run `34083462882`.
- #20 STEPBible lexical/context tooling — Implemented.

## Milestone 10 — Bible-study core

### Expanded Guided Study (#52)

Frozen at `release/v3.15-guided-study`. It continues to use `src/engines/lesson.js` as the only Lesson lifecycle/state/persistence engine and `src/app/study.js` as the thin Study orchestration owner. Personal reflection/application is not spiritually scored and completion uses one deterministic meaningful Progress event with `xp: 0`.

### Deep Questions (#51)

Frozen at `release/v3.16-deep-questions` after functional run `34082339971` and bookkeeping run `34082727818`.

Owner boundaries remain:
- `src/features/deep-questions/content.js` — static definitions only.
- `src/app/deep-questions.js` — one Deep Questions orchestration owner.
- `src/engines/lesson.js` — sole lifecycle/session/response persistence engine.
- `src/app/reader.js` — sole Reader state owner.
- `src/features/deep-questions/index.js` — presentation/event forwarding only.
- No invented XP or spiritual-quality scoring.

Deep Questions survived Story Journey accumulated run `34083462882`; it is therefore Regression-tested.

### Story Journey (#49) — Verified

Story Journey was rebuilt cleanly from the retained v2 behavior instead of importing the old runtime.

Verified behavior:
- 10 retained Story Journeys.
- 5 scene steps followed by one checkpoint.
- leave/return and reload resume through the shared Lesson engine.
- checkpoint answers lock correctly and complete the Lesson session.
- verified v2 reward parity: correct checkpoint `+15 XP`; incorrect checkpoint `+4 XP`.
- a correct checkpoint increments `quizCorrect` exactly once.
- completion uses deterministic Progress event identity derived from story id, definition version, and Lesson attempt start; reopening a completed attempt cannot duplicate XP or counters.
- restart creates a new Lesson attempt and therefore a new eligible checkpoint event.
- Reader handoff opens the story's verified book/chapter through the existing Reader owner.
- mobile browser verification runs at 390px with no horizontal overflow and controls >=44px.
- stable Learn heading remains `Learn`.
- no console/page errors were found.

Architecture:
- `src/features/story-journey/content.js` — static retained story/checkpoint definitions only.
- `src/app/story-journey.js` — single Story Journey orchestration owner.
- `src/engines/lesson.js` — sole scene/checkpoint lifecycle and persistence engine.
- `src/core/progress.js` — sole XP/counter/event owner.
- `src/app/reader.js` — sole Reader state owner.
- `src/features/story-journey/index.js` — presentation/event forwarding only.

Full accumulated functional run `34083462882` passed architecture validation, all accumulated edge regressions, the Story Journey edge regression, and the complete browser suite including Story Journey at 390px. No Story Journey application defect was found by this functional gate, so no post-gate bug patch was required.

The exact Story Journey bookkeeping state still requires one final accumulated run before any `release/v3.17-story-journey` checkpoint may be frozen.

## Next Bible-study target

After the Story Journey bookkeeping gate is green and `release/v3.17-story-journey` is frozen, continue directly with:
1. #50 Wisdom Situations
2. #53 Adaptive learning
3. #54 Open/weak-area review

Kids #38–40 remain deferred but accessible through the existing Kids surface.

## Future Devotional / Ministry requirement

`DEVOTIONAL_MINISTRY_DESIGN_V3.md` remains the later high-priority design contract.

Required future behavior:
- Pastor/Admin publishes first-class Message, Devotional, or Task posts through one freeform ministry service/model.
- Members receive eligible congregation posts.
- Tasks can contain one or more freeform prompts and member responses.
- Members can read their own response but not other members' response bodies.
- Pastor/Admin can review individual responses only inside their congregation scope.
- Members may see allowed aggregate counts such as `18 answered`.
- Privacy must be enforced by backend/API/RLS, not UI hiding.
- Ministry Hub, Inbox, Assignments, Workspace, and Assignment Push must reuse one coherent post/task identity.

Primary later inventory mapping remains #66 and #73–78. Design documentation alone does not promote those rows.

## Defect / root-cause ledger retained

- `V3-ROUTER-001` — single synchronous router fixed URL/view drift.
- `V3-AUTH-GATE-001` — static Supabase version pin is architecture-auditable.
- `V3-SHELL-001` — brand and primary navigation selectors are distinct.
- `V3-SIGNUP-001` — recovery-code issuance is independent from optional auto-sign-in.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate signup and post-recovery login are explicit tests.
- `V3-READER-ACCEPTANCE-001` — invalid search respects native form validation.
- `V3-PROGRESS-UI-001` — static label readability is separate from touch-target semantics.
- `V3-TRANSFORM-OWNER-001` — orchestration no longer defines a competing Transform calculation owner.
- `V3-TRANSFORM-PROGRESS-001` — Full Transform used an unsupported `assessments` metric; the central progress owner defines and tests it.
- `V3-RECORDINGS-FREEZE-001` — v3 replaced fragmented global media lifecycle with one Audio owner, one Recordings owner, explicit teardown, bounded requests, and one-player regression.
- `V3-AUDIO-VALIDATOR-001` — the architecture validator initially checked the wrong source token and was corrected before functional CI proceeded.
- `V3-MEDIA-OWNER-001` — Media Library composes the verified Recordings and Audio owners instead of creating a second player/backend path.
- `V3-GAMES-SHELL-ACCEPTANCE-001` — shell acceptance now asserts stable Games route/launcher contract instead of placeholder copy.
- `V3-GAMES-OWNER-001` — v3 centralizes launch/answer/score/replay/switch/leave/result persistence in `src/app/games.js`.
- `V3-RECALL-PACK-001` — pack loading/validation/cache is isolated in `src/core/recall-packs.js`; gameplay remains in Games owner.
- `V3-DETECTIVE-SELECTOR-001` — Character Detective test selector was made explicit after a non-unique selector false failure.
- `V3-TIMELINE-XP-001` — repeated failed Timeline checks cannot farm XP; regression protects the remaining +16 solve award.
- `V3-STUDY-SYNTAX-001` — dense Guided Study freezer syntax was replaced by explicit `freezeStudy()` and remains syntax-gated.
- `V3-STUDY-BOUNDARY-001` — Study `getState()` now enforces its own public boundary before delegating to Lesson.
- `V3-STUDY-LEARN-ACCEPTANCE-001` — stable Learn `<h1>` was restored and protected.
- `V3-STUDY-READER-TEST-001` — Reader acceptance waits for actual controls and asserts correct book/chapter.

No new Story Journey defect entry is added because the first full functional gate passed without an application failure.

## Release rule

Story Journey passed the entire accumulated functional suite on run `34083462882`. The exact inventory/status/timeline/architecture bookkeeping state must pass the full suite once more before `release/v3.17-story-journey` may be frozen. Production v2 remains unchanged until all applicable capability rows satisfy parity and stability gates.
