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
| Regression-tested | 23 |
| Verified | 3 |
| Implemented | 1 |
| Not started | 73 |
| Total | 100 |

## Completed milestones

- Milestone 1 — Foundation: #1–#5 Regression-tested.
- Milestone 2 — Account/auth: #6–#10 Regression-tested.
- Milestone 3 — Reader/data: #11–#13, #18–#19, #21–#23 Regression-tested; #20 STEPBible remains Implemented pending unavailable-data behavior.
- Milestone 4 — Progress: #24–#27 Regression-tested.
- Milestone 5 — Core lesson engine: #31 Regression-tested.
- Milestone 6 — Daily Mission/Journey: #28–#30 Verified.

## Milestone 6 acceptance evidence

Daily Journey is implemented as one dated five-step lesson on the shared engine: Retrieve → Context → Learn → Apply → Reflect. `src/app/daily-mission.js` stores no parallel mission state and uses only the lesson, progress and reader owners.

Verified behavior includes pure non-persisting home preview, deterministic civil-date rotation, timezone-boundary rollover, invalid-date rejection, independent next-day sessions, reload/resume at an intermediate stage, Reader round-trip through the existing owner/router, five deterministic step progress events, cross-service retry healing, exactly one non-meaningful +25 completion bonus, completion reload without duplicate XP, streak continuation, guest execution with zero Supabase traffic, desktop flow, and 390px mobile layout/touch targets.

## Next major milestone

Milestone 7 — Transform:

1. Audit basic Transform (#46), full Transform (#47), and the multiple old Transform paths (#48).
2. Build `src/engines/transform.js` as the single deterministic Transform state owner before feature UI migration.
3. Preserve private local reflection behavior and explicit guest/account boundaries.
4. Reuse existing Bible reader/service contracts for passage selection rather than creating another Bible loader.
5. Do not copy the old standalone runtime recovery/global-module architecture into v3.
6. No Audio/Recordings, Games, Bible World, Tutorial, or secondary-feature implementation until Transform is frozen.

## Defect / root-cause ledger

- `V3-ROUTER-001` — synchronous single-owner route resolution fixed URL/view drift.
- `V3-AUTH-GATE-001` — static dependency pinning made the Supabase browser version auditable.
- `V3-SHELL-001` — brand and primary-nav selectors were separated while retaining one router.
- `V3-SIGNUP-001` — recovery-code issuance became the signup transaction boundary so auto-sign-in failure cannot lose the code.
- `V3-ACCOUNT-ACCEPTANCE-001` — duplicate-account and post-recovery sign-in behaviors became explicit assertions.
- `V3-READER-ACCEPTANCE-001` — native invalid-search validation is tested as native validation rather than weakened to satisfy JavaScript expectations.
- `V3-PROGRESS-UI-001` — static progress-chip readability was separated from interactive touch-target semantics.

No Daily Journey acceptance defect required a code workaround after publication; the candidate passed its architecture, service, accumulated browser and dedicated Daily Journey suites.

## Release rule

A snapshot is frozen only after the exact ledger/status commit passes every configured architecture, service and accumulated browser gate.
