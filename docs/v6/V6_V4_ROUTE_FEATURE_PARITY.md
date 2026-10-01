# BibleQuest V6 — V4 route/feature parity matrix

Updated: 2026-10-01 JST

Purpose: provide a frozen, machine-checkable V4→V6 route and feature-owner inventory for the V6 release gate.

## Authority and scope

The V4 maintained-route baseline is the 42-route browser inventory in `tests/v4-whole-app-deep-routes-smoke.mjs`. The current V6 route authority is `src/app/bootstrap.js`.

The machine-readable contract is `docs/v6/V6_V4_ROUTE_FEATURE_PARITY.json`. The executable guard is `tests/v6/v4-route-feature-parity.test.ts`.

The gate requires all 42 V4 maintained deep links to remain present in V6 and each row to resolve to a concrete V6 feature owner under `src/features/<featureOwner>/index.js`. Aliases are explicit rather than inferred.

This matrix does not certify browser rendering, backend behavior, physical-device behavior, or production deployment. Those remain separate V6 acceptance gates. The V6 checklist row should be promoted only after the exact candidate containing this matrix passes the applicable automated gate and is integrated.

## Frozen V4 baseline mapped to V6

| V4 route | V6 route | V6 feature owner | Status |
|---|---|---|---|
| `#/home` | `#/home` | `src/features/home/index.js` | Preserved |
| `#/mission` | `#/mission` | `src/features/daily-mission/index.js` | Preserved |
| `#/learn` | `#/learn` | `src/features/learn/index.js` | Preserved |
| `#/study` | `#/study` | `src/features/study/index.js` | Preserved |
| `#/deep-questions` | `#/deep-questions` | `src/features/deep-questions/index.js` | Preserved |
| `#/story-journey` | `#/story-journey` | `src/features/story-journey/index.js` | Preserved |
| `#/wisdom-situations` | `#/wisdom-situations` | `src/features/wisdom-situations/index.js` | Preserved |
| `#/adaptive-learning` | `#/adaptive-learning` | `src/features/adaptive-learning/index.js` | Preserved |
| `#/bible-world` | `#/bible-world` | `src/features/bible-world/index.js` | Preserved |
| `#/open-review` | `#/open-review` | `src/features/open-review/index.js` | Preserved |
| `#/private-notes` | `#/private-notes` | `src/features/private-notes/index.js` | Preserved |
| `#/cloud-notes` | `#/cloud-notes` | `src/features/cloud-notes/index.js` | Preserved |
| `#/couples-family` | `#/couples-family` | `src/features/couples-family/index.js` | Preserved |
| `#/couples-cloud` | `#/couples-cloud` | `src/features/couples-cloud/index.js` | Preserved |
| `#/journey-groups` | `#/journey-groups` | `src/features/journey-groups/index.js` | Preserved |
| `#/encouragements` | `#/encouragements` | `src/features/encouragements/index.js` | Preserved |
| `#/community` | `#/community` | `src/features/community/index.js` | Preserved |
| `#/live-rooms` | `#/live-rooms` | `src/features/live-rooms/index.js` | Preserved |
| `#/ministry-hub` | `#/ministry-hub` | `src/features/ministry-hub/index.js` | Preserved |
| `#/notification-center` | `#/notification-center` | `src/features/notification-center/index.js` | Preserved |
| `#/workspace` | `#/workspace` | `src/features/workspace/index.js` | Preserved |
| `#/team-center` | `#/team-center` | `src/features/team-center/index.js` | Preserved |
| `#/leaderboards` | `#/leaderboards` | `src/features/leaderboards/index.js` | Preserved |
| `#/recognition` | `#/recognition` | `src/features/congregation-recognition/index.js` | Preserved |
| `#/assignments` | `#/assignments` | `src/features/assignments/index.js` | Preserved |
| `#/content-review` | `#/content-review` | `src/features/content-review/index.js` | Preserved |
| `#/reader` | `#/reader` | `src/features/reader/index.js` | Preserved |
| `#/play` | `#/play` | `src/features/games/index.js` | Preserved |
| `#/grow` | `#/grow` | `src/features/progress/index.js` | Preserved |
| `#/transform` | `#/transform` | `src/features/transform/index.js` | Preserved |
| `#/personality-profile` | `#/personality-profile` | `src/features/personality-profile/index.js` | Preserved |
| `#/psychometrics` | `#/psychometrics` | `src/features/psychometrics/index.js` | Preserved |
| `#/avatar-vault` | `#/avatar-vault` | `src/features/avatar-vault/index.js` | Preserved |
| `#/my-mission` | `#/my-mission` | `src/features/mission/index.js` | Preserved |
| `#/calendar` | `#/calendar` | `src/features/calendar/index.js` | Preserved |
| `#/recordings` | `#/recordings` | `src/features/recordings/index.js` | Preserved |
| `#/media` | `#/media` | `src/features/recordings/index.js` | Preserved |
| `#/more` | `#/more` | `src/features/more/index.js` | Preserved |
| `#/accessibility` | `#/accessibility` | `src/features/accessibility/index.js` | Preserved |
| `#/backup` | `#/backup` | `src/features/backup/index.js` | Preserved |
| `#/congregation` | `#/congregation` | `src/features/congregation/index.js` | Preserved |
| `#/account` | `#/account` | `src/features/account/index.js` | Preserved |

## Explicit owner aliases

The preserved route is unchanged, but these routes intentionally use a differently named V6 feature owner:

- `#/mission` → `daily-mission`
- `#/recognition` → `congregation-recognition`
- `#/play` → `games`
- `#/grow` → `progress`
- `#/my-mission` → `mission`
- `#/media` → `recordings`

## Additive V6 routes

V6 also contains routes that are additive to the frozen V4 maintained-route set and therefore do not replace or rewrite the baseline: `#/bible-quest`, `#/explorer`, `#/leader-center`, `#/ministry-announcements`, `#/challenges`, and `#/help`.

The executable gate verifies those remain additive while all 42 V4 baseline routes stay preserved.
