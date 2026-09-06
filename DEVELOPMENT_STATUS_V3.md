# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged**.
- Last frozen milestone: `release/v3.5-lesson-engine` at `e63325882a07681c396d5ecc6e0b0a9765a2e892`.
- Current work branch: `feature/v3-daily-mission`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 22 |
| Verified | 1 |
| Implemented | 1 |
| Not started | 76 |
| Total | 100 |

Counts remain unchanged while Milestone 6 is under implementation. #28–#30 advance only after the complete acceptance and accumulated suite pass.

## Completed milestones

- Milestone 1 — Foundation: #1–#5 Regression-tested.
- Milestone 2 — Account/auth: #6–#10 Regression-tested.
- Milestone 3 — Reader/data: #11–#13, #18–#19, #21–#23 Regression-tested; #20 STEPBible remains Implemented pending unavailable-data behavior.
- Milestone 4 — Progress: #24–#27 Regression-tested.
- Milestone 5 — Core lesson engine: #31 Verified.

## Current milestone — Milestone 6 Daily Mission/Journey

Target rows:

- #28 Daily Mission/Journey
- #29 Daily passage rotation
- #30 Daily Mission completion bonus

Implementation contract:

1. The five movements are a versioned lesson definition: Retrieve → Context → Learn → Apply → Reflect.
2. `src/app/daily-mission.js` is orchestration only. It owns no browser persistence and no second lesson state machine.
3. Passage rotation is deterministic from a civil date supplied through the progress service timezone boundary.
4. Step awards use deterministic IDs `daily:<date>:step:<step>`; the completion bonus uses `daily:<date>:complete`.
5. Step progress is reconciled from persisted lesson responses on reopen, allowing a failed cross-service progress write to heal without duplicate XP.
6. The +25 completion bonus is non-meaningful for streak/activity count and can be awarded only once.
7. Context opens Scripture by setting the existing reader owner and routing through the existing router.
8. Home can preview today’s passage without opening/persisting a lesson session.
9. Guest execution remains local and must generate no Supabase traffic.
10. Transform, recordings, games, Bible World and other later milestones remain untouched.

## Next major milestone

After #28–#30 are frozen, begin Milestone 7 — Transform. First audit and create the single Transform engine before migrating basic/full Transform workflows.

## Defect / root-cause ledger

- `V3-ROUTER-001` — synchronous single-owner route resolution fixed URL/view drift.
- `V3-AUTH-GATE-001` — static dependency pinning made the Supabase browser version auditable.
- `V3-SHELL-001` — brand and primary-nav selectors were separated while retaining one router.
- `V3-SIGNUP-001` — recovery-code issuance became the signup transaction boundary so auto-sign-in failure cannot lose the code.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate-account and post-recovery sign-in behaviors became explicit assertions.
- `V3-READER-ACCEPTANCE-001` — native invalid-search validation is tested as native validation rather than weakened to satisfy JavaScript expectations.
- `V3-PROGRESS-UI-001` — static progress-chip readability was separated from interactive touch-target semantics.

Any Daily Journey defect found by acceptance will be recorded before promotion.

## Release rule

A snapshot is frozen only after the exact ledger/status commit passes every configured architecture, service and accumulated browser gate.
