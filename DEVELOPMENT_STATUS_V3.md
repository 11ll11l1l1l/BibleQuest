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
| Regression-tested | 22 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 76 |
| Total | 100 |

## Completed milestones

- Milestone 1 — Foundation: #1–#5 Regression-tested.
- Milestone 2 — Account/auth: #6–#10 Regression-tested.
- Milestone 3 — Reader/data: #11–#13, #18–#19, #21–#23 Regression-tested; #20 STEPBible remains Implemented pending unavailable-data behavior.
- Milestone 4 — Progress: #24–#27 Regression-tested.
- Milestone 5 — Core lesson engine: #31 Verified on the full service + browser acceptance suite.

## Milestone 5 acceptance evidence

`src/engines/lesson.js` is the single guided-lesson lifecycle owner. The verified workflow covers definition validation, content/choice/confirmation/text steps, response locking, private correct-answer state, score/feedback reconstruction from stored responses, reload/resume, completion, repeated-completion safety, restart, teardown/reopen, version reset, malformed-session recovery, timestamp normalization, and storage-failure atomicity.

The lesson engine does not mutate XP/streak/badges and does not absorb game-specific mechanics. Progress remains in `src/core/progress.js`; future game lifecycle remains reserved for `src/engines/game.js`.

## Next major milestone

Milestone 6 — Daily Mission/Journey only:

- #28 Daily Mission/Journey
- #29 Daily passage rotation
- #30 Daily Mission completion bonus

Required implementation boundaries:

1. Daily Mission must be defined as a versioned five-step lesson using the verified lesson engine: Retrieve → Context → Learn → Apply → Reflect.
2. Daily passage selection must be deterministic from an explicit civil date/timezone boundary, not random at render time.
3. Each completed step must emit a deterministic progress event; retries/reloads must not duplicate XP.
4. The final completion bonus must use its own deterministic progress event and be awarded exactly once.
5. Opening the Bible passage must route through the existing reader owner rather than constructing another Bible loader/navigation path.
6. Mission UI may orchestrate the feature but may not own a second lesson state machine, progress model, router, or Bible data path.
7. Desktop/mobile and guest/account behavior must be tested without introducing cloud writes for guests.

No Transform, games, recordings, Bible World, tutorial, or unrelated feature implementation is allowed in this milestone.

## Drift check

The locked milestone order remains unchanged: Foundation → Account → Reader → Progress → Lesson Engine → Daily Mission → Transform → Audio/Live Recordings → Games → Bible World → Tutorial → secondary parity work → full audit → mobile regression → production deployment.

Current code still obeys the required single owners for router, session, storage, API, Bible data, reader state, progress, and lesson lifecycle. Production v2 remains isolated.

## Defect / root-cause ledger

- `V3-ROUTER-001` — synchronous single-owner route resolution fixed URL/view drift.
- `V3-AUTH-GATE-001` — static dependency pinning made the Supabase browser version auditable.
- `V3-SHELL-001` — brand and primary-nav selectors were separated while retaining one router.
- `V3-SIGNUP-001` — recovery-code issuance became the signup transaction boundary so auto-sign-in failure cannot lose the code.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate-account and post-recovery sign-in behaviors became explicit assertions.
- `V3-READER-ACCEPTANCE-001` — native invalid-search validation is tested as native validation rather than weakened to satisfy JavaScript expectations.
- `V3-PROGRESS-UI-001` — static progress-chip readability was separated from interactive 44px touch-target semantics.

No lesson-engine defect required a production-logic workaround during this milestone. Pre-publication hardening made stored responses, rather than stored feedback, authoritative for resume/scoring.

## Release rule

A release snapshot is created only after the exact ledger/status commit passes every configured v3 architecture, service, and accumulated browser gate. No feature status is advanced merely because its module exists.
