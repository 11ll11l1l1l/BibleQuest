# BibleQuest V4 Home Assignments Certification

## Certified candidate

- Active implementation branch: `v4/modern-ui-overhaul`
- Exact certified SHA: `c676e0ec821ffb1ff2d8ddc0ecdd6168c50a62e7`
- Rollback checkpoint: `release/v4-home-assignments`
- Full accumulated regression: `34678365877` — **PASS**
- Additional same-SHA accumulated run: `34678385543` — **PASS**
- Change class: controlled Home behavior/presentation integration using the existing singleton Assignments owner.

## Requirement closed

The requested Home assignment/status matrix is complete at this checkpoint. Home still delegates all task loading/opening to the existing `src/app/assignments.js` service and existing `assignments` route; no second assignment store, API owner, realtime owner, or response-data path was introduced.

Explicit Home states now exist for:

- loading;
- signed out;
- local-preview/offline cloud-unavailable mode;
- authenticated with no congregation;
- API/load failure with generic recovery copy and retry through the same Assignments service;
- no open assignments;
- completed/no-pending work;
- one open assignment;
- multiple open assignments;
- started/in-progress assignment;
- due-soon assignment;
- overdue assignment.

Every state keeps a direct action into the existing Assignments route. Active rows continue to prioritize overdue, then due-soon, then in-progress, then pending work. Completed and not-yet-open scheduled tasks are excluded from the active list.

Home projects only safe metadata. Submission text, leader feedback, private review responses, peer answers, and raw API/server error details are not rendered on Home. Signed-out and local-preview states fail closed and do not expose cloud assignment metadata.

## Implementation

- `src/features/home/assignment-summary.js`
  - pure Home presentation projection;
  - explicit state renderer;
  - active-task urgency/order logic;
  - output limited to approved metadata.
- `src/features/home/index.js`
  - retains the existing Home owner;
  - calls the existing Assignments service;
  - renders loading/result/error states;
  - retry calls the same `assignments.load()` owner;
  - task-open uses the existing `assignments.open(id)` before navigating to the existing Assignments route.
- `src/ui/home-assignment-states-v4.css`
  - distinct structural loading/info/error/success states;
  - responsive mobile layout;
  - stronger-contrast treatment;
  - reduced-motion-safe loading presentation.

## Regression protection

`tests/v4-home-assignments-edge.mjs` is now part of the accumulated `.github/workflows/v3-regression.yml` edge gate and verifies:

- urgency ordering and the exact 48-hour due-soon boundary;
- started versus pending state;
- completed/scheduled filtering;
- explicit loading/signed-out/offline/no-congregation/error/empty/completed/active state markup;
- one-open and multiple-open counts;
- direct Assignments action on every state;
- retry presence on load failure;
- no raw error disclosure;
- no submission/leader-feedback leakage;
- exact safe projected field set;
- HTML escaping of assignment metadata.

Existing Home/dashboard, Assignments, architecture, privacy/security, mobile-width and browser regressions remain unweakened and passed in the same exact-candidate accumulated run.

## Verification evidence

Run `34678365877` on exact SHA `c676e0ec821ffb1ff2d8ddc0ecdd6168c50a62e7` passed:

- Cloudflare/build deployment gate;
- accumulated architecture/single-owner validators;
- accumulated edge/security/privacy regressions, including the expanded Home assignment matrix contract;
- guarded field-harness syntax checks;
- complete accumulated browser/mobile Playwright suite.

The independently dispatched same-SHA accumulated run `34678385543` also completed successfully.

## Result

**HOME ASSIGNMENT/STATUS ACCEPTANCE MATRIX: CERTIFIED / CLOSED.**

The next requested Priority-1 acceptance gate is Calendar, followed by full Assignments page audit, Daily Journey/Mission, and Progress/Grow unless repository evidence shows a dependency that changes that order.
