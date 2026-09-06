# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged** (`gh-pages` is not used for v3 development).
- Last frozen milestone: `release/v3.4-progress-core` at `b3f6f140606ff06fdffb2af3bfc565b0b5f63352`.
- Current work branch: `feature/v3-lesson-engine`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 18 |
| Verified | 4 |
| Implemented | 1 |
| Not started | 77 |
| Total | 100 |

The counts remain unchanged while #31 Core lesson engine is under implementation.

## Completed milestones

- Milestone 1 — Foundation: #1–#5 Regression-tested.
- Milestone 2 — Account/auth: #6–#10 Regression-tested.
- Milestone 3 — Reader/data: #11–#13, #18–#19, #21–#23 Regression-tested; #20 STEPBible remains Implemented pending unavailable-data behavior.
- Milestone 4 — Progress: #24–#27 Verified.

## Current milestone — Milestone 5 Core lesson engine

Target row: #31 Core lesson engine.

The old audit found the same lifecycle machinery repeated across Quick Recall, Context Challenge, Mixed Quest, Story Journey, Wisdom Situations, Deep Questions, Timeline and Play Together: local current-step variables, manual response locks, feedback rendering, next/finish transitions, ad-hoc progress calls, and feature-specific teardown.

The clean engine contract:

1. `src/engines/lesson.js` owns guided-lesson lifecycle persistence.
2. Supported guided step types are content, choice, confirmation and text response.
3. Definitions have stable IDs and versions; a definition-version change resets stale persisted session state.
4. Interactive responses lock after the first accepted value; exact repeated input is idempotent and conflicting second input fails.
5. Correct-answer indexes stay private inside the engine and are not exposed in public step snapshots.
6. Persisted feedback is never authoritative: resume reconstructs feedback and score from the versioned definition plus normalized stored responses.
7. Reload/reopen resumes the same active or completed lifecycle; malformed timestamps/session structure recover to a fresh session.
8. Restart deliberately resets only that lesson session; close tears down in-memory ownership without deleting persisted resume state.
9. Storage writes commit before in-memory state changes so persistence failure cannot leave a phantom response/completion in memory.
10. The engine reports completion but does not mutate XP/streak/badges; progress remains owned by `src/core/progress.js`.
11. Game-specific ordering, timers, pass-and-play and scoring orchestration remain for the future game engine rather than expanding this foundation prematurely.

## Next major milestone

After #31 is frozen, migrate #28–#30 Daily Mission/Journey onto the lesson engine, including deterministic daily passage rotation and an idempotent completion bonus through the progress service.

## Defect / root-cause ledger

- `V3-ROUTER-001` — synchronous single-owner route resolution fixed URL/view drift.
- `V3-AUTH-GATE-001` — static dependency pinning made the Supabase browser version auditable.
- `V3-SHELL-001` — brand and primary-nav selectors were separated while retaining one router.
- `V3-SIGNUP-001` — recovery-code issuance became the signup transaction boundary so auto-sign-in failure cannot lose the code.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate-account and post-recovery sign-in behaviors became explicit assertions.
- `V3-READER-ACCEPTANCE-001` — native invalid-search validation is tested as native validation rather than weakened to satisfy JavaScript expectations.
- `V3-PROGRESS-UI-001` — static progress-chip readability was separated from interactive 44px touch-target semantics.

Any lesson-engine defect found by acceptance will be recorded before promotion.

## Release rule

A release snapshot is created only after the exact ledger/status commit passes every configured v3 architecture, service, and accumulated browser gate. No feature status is advanced merely because its module exists.
