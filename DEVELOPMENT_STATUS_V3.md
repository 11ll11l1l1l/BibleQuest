# BibleQuest v3 Development Status

Updated: 2026-09-07

`FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production v2 remains unchanged.
- Cloudflare remains untouched by the v3 rebuild.
- Current development branch: `feature/v3-study-core`.
- Normal v3 GitHub Actions remain manual-only; isolated verification branches are one-shot CI gates only.
- Latest frozen checkpoint: `release/v3.17-story-journey` at `7690cc18b723fda1bed7802d2a56f49648f7f6b0`.
- Story Journey functional run `34083462882` and corrected bookkeeping run `34083885682` both passed before that freeze.
- Earlier Bible-study checkpoints remain `release/v3.16-deep-questions` at `e287fb6179bddece7d9cb31e5496924e524f83fd` and `release/v3.15-guided-study` at `cf8740e623460f062c321d01d903267e79885c4c`.
- Earlier frozen core line remains unchanged through Transform, Audio/Recordings/Media, Games, Mixed Quest, Per-book Recall, Character Detective, and Timeline.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 44 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 54 |
| Total | 100 |

Strict verified-or-better parity is **45/100**. Fully regression-tested stability coverage is **44/100**.

Current promotions:
- #52 Expanded Guided Study — Regression-tested.
- #51 Deep Questions — Regression-tested.
- #49 Story Journey — Regression-tested after surviving Wisdom Situations functional run `34084573320`.
- #50 Wisdom Situations — Verified after functional run `34084573320`; exact bookkeeping gate pending.
- #20 STEPBible lexical/context tooling — Implemented.

## Milestone 10 — Bible-study core

### Expanded Guided Study (#52)

Frozen at `release/v3.15-guided-study`. It continues to use `src/engines/lesson.js` as the only Lesson lifecycle/state/persistence engine and `src/app/study.js` as the thin Study orchestration owner. Personal reflection/application is not spiritually scored and completion uses one deterministic meaningful Progress event with `xp: 0`.

### Deep Questions (#51)

Frozen at `release/v3.16-deep-questions` after functional run `34082339971` and bookkeeping run `34082727818`. It uses the shared Lesson engine, keeps private notes inside Lesson responses, delegates Reader handoff to the Reader owner, and has no invented XP or spiritual-quality scoring.

### Story Journey (#49) — Regression-tested

Frozen at `release/v3.17-story-journey` after functional run `34083462882` and corrected bookkeeping run `34083885682`.

Retained behavior remains:
- 10 Story Journeys.
- 5 scenes plus one Scripture checkpoint.
- resume/reload/restart through the shared Lesson engine.
- correct checkpoint `+15 XP`; incorrect checkpoint `+4 XP`.
- correct checkpoint increments `quizCorrect` exactly once.
- deterministic Progress identity prevents duplicate reward on reopen.
- Reader handoff through the existing Reader owner.
- 390px mobile no-overflow and >=44px controls.

Story Journey survived the later complete Wisdom Situations functional run `34084573320`, so #49 is now Regression-tested.

### Wisdom Situations (#50) — Verified

The retained v2 source was recovered before rebuilding. The clean v3 implementation preserves the old behavior without importing its direct `localStorage`, global state, or overlay runtime.

Recovered parity evidence:
- 24 difficult situations (`hw01`–`hw24`).
- each situation has a title, competing tension, scenario, four deliberately plausible options, one strongest supported option, a general explanation, four per-option rationales, Scripture references, and difficulty 4 or 5.
- opening Wisdom starts a random situation.
- the immediately previous situation is excluded from the next random choice when alternatives exist.
- the first answer locks the attempt and reveals the strongest supported option, all four rationales, and Scripture references.
- the original reward was `+8 XP` and `+1 situations` for completing an answered situation regardless of whether the member selected the strongest option.
- the v3 rebuild therefore does **not** convert Wisdom into a spiritual-quality score or award extra Bible quiz correctness for choosing the strongest option.

Clean architecture:
- `src/features/wisdom-situations/content.js` — sole static source for the 24 retained immutable definitions and one-step Lesson definitions.
- `src/app/wisdom-situations.js` — sole Wisdom orchestration owner over Lesson + Progress.
- `src/engines/lesson.js` — sole answer lock, attempt identity, completion, restart, and session persistence owner.
- `src/core/progress.js` — sole XP/counter/event owner; verified central `situations` metric added here.
- `src/features/wisdom-situations/index.js` — presentation/event forwarding only.
- `src/ui/wisdom-situations.css` — Wisdom presentation styling only.
- the stable Learn heading remains `Learn`.

Reward identity is deterministic per Lesson attempt: `wisdom-situation:<id>:v<definitionVersion>:<startedAt>`. Reopening the same completed attempt reconciles as a duplicate and cannot award XP/counters again. Restart or a newly opened situation creates a new Lesson attempt and is eligible once.

Functional run `34084573320` passed:
- architecture validation.
- all accumulated edge regressions.
- Wisdom Situations edge regression covering all 24 definitions, four options/rationales, answer reveal, +8 XP/+1 situation, no `quizCorrect` inflation, duplicate prevention, replay, non-repeat selection, close boundary, and invalid RNG handling.
- all accumulated browser regressions.
- Wisdom Situations browser regression at 390px covering Learn routing, stable heading, weaker/strongest feedback, rationale/reference reveal, Progress persistence, reload, replay, another-situation behavior, >=44px controls, no overflow, and no console/page errors.

The exact inventory/status/timeline/architecture bookkeeping state must still pass one full accumulated suite before `release/v3.18-wisdom-situations` may be frozen.

## Next major milestone

After the Wisdom Situations bookkeeping gate is green and `release/v3.18-wisdom-situations` is frozen, continue directly with:
1. #53 Adaptive learning
2. #54 Open/weak-area review

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
- `V3-STORY-BOOKKEEPING-001` — Story Journey bookkeeping renamed the validator-required `Next major milestone` queue heading. Architecture run `34083748928` blocked the freeze; the heading was restored and the validator assertion remains the regression guard.
- `V3-WISDOM-ESCAPE-001` — the first Wisdom presentation draft mapped the quote character to an incomplete HTML entity. The escaping map was corrected before functional CI; the retained Wisdom browser regression exercises rendered scenario/result content and fails on page/console errors.

## Release rule

Wisdom Situations passed the entire accumulated functional suite on run `34084573320`. The exact bookkeeping state must pass the full suite once more before `release/v3.18-wisdom-situations` may be frozen. Production v2 remains unchanged until all applicable capability rows satisfy parity and stability gates.
