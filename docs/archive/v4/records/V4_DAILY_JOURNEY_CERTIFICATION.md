# BibleQuest V4 Daily Journey Acceptance Certification

Updated: 2026-09-12 JST

## Certified checkpoint

- Release checkpoint: `release/v4-daily-journey`
- Exact candidate SHA: `fbd8b474a3f8f71044b9cae48b47528f2075436a`
- Full accumulated regression run: `34680442340`
- Result: **PASS**
- Temporary verification PR: #132, closed unmerged after exact-SHA evidence was captured.

## Accepted V4 scope

Daily Journey retains the existing five-step Retrieve → Context → Learn → Apply → Reflect flow, existing Reader handoff, progress/reward ownership, persistence and replay/idempotency behavior. The V4 acceptance tranche fixed only the presentation boundary for thrown errors so arbitrary backend/storage/engine exception text is no longer rendered directly to the user.

The existing Daily Journey service and content owners were not changed by this tranche. `src/app/daily-mission.js` and `src/features/daily-mission/content.js` remain byte-locked by `tests/v4-daily-journey-static.mjs` to the pre-audit baseline.

## Acceptance evidence

The exact candidate passed:

- Cloudflare/build deployment gate;
- accumulated architecture validators;
- accumulated edge/security/privacy regressions;
- guarded field-harness syntax checks;
- complete accumulated Playwright browser/mobile regressions;
- `tests/v4-daily-journey-static.mjs`;
- `tests/v4-daily-journey-page-smoke.mjs`;
- retained `tests/v3-daily-mission-edge.mjs` and `tests/v3-daily-mission-smoke.mjs`.

The browser acceptance protects the V4 presentation boundary against raw open/respond/advance/Reader errors while retaining functional navigation and user-action behavior. Existing regressions continue to protect civil-date rollover, exact XP/reward semantics, idempotent completion, persisted/resumed progress, Reader integration, guest/no-cloud behavior, and mobile no-overflow/touch-target contracts.

## Files changed in the certified candidate

Relative to pre-audit active V4 head `42f2bfbc9dba73088a4a996edf61c0b7787578a8`:

- `src/features/daily-mission/index.js`
- `tests/v4-daily-journey-static.mjs`
- `tests/v4-daily-journey-page-smoke.mjs`
- `.github/workflows/v3-regression.yml`

No Daily Journey service/content owner was replaced or duplicated.

## Release rule

This certification closes the Priority-1 Daily Mission / Daily Journey page-level acceptance item. Later changes affecting Daily Journey runtime, service/content owners, progress semantics, Reader handoff, presentation error handling or responsive behavior require a new exact-SHA certification run before release.