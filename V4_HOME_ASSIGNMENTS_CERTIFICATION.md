# BibleQuest V4 Home Assignments Certification

## Certified candidate

- Branch under test: `v4/modern-ui-overhaul`
- Exact certified SHA: `d97e04829926aa8ce999101d64c45c539849187a`
- Rollback checkpoint: `release/v4-home-assignments`
- Change class: **Class C — behavior/data integration**, isolated from the previously certified Home presentation tranche.

## Requirement closed

The V4 release requirement that current congregation Assignments remain visible from the Home page is complete.

Home now reuses the existing singleton Assignments service and existing `assignments` route. It does not create a second store, API client, realtime owner, or response-data path.

The Home summary:

- shows current assignment metadata prominently on Home when the existing Assignments owner returns a ready state;
- excludes completed assignments and assignments whose scheduled opening has not arrived;
- exposes text-visible `Overdue`, `Due soon`, `In progress`, and `Pending` states;
- prioritizes overdue, then due-soon, then in-progress, then pending work;
- opens the selected task through `assignments.open(id)` before navigating to the existing Assignments route;
- provides a `See all` action to the same existing route;
- fails closed if the cloud-backed assignment load fails;
- renders only safe task metadata and never projects submission text, leader feedback, private review responses, or peer answer text onto Home.

The single-owner architecture remains intact: bootstrap constructs exactly one `createAssignmentsService(...)`, and both Home and the full Assignments page receive that same owner.

## New regression protection

- `tests/v4-home-assignments-static.mjs`
  - locks the singleton owner/wiring contract;
  - protects Home data hooks and direct-route action;
  - forbids private response-field projection;
  - protects responsive/reduced-motion/contrast presentation requirements.
- `tests/v4-home-assignments-edge.mjs`
  - deterministically verifies active-task filtering and urgency ordering;
  - checks the exact 48-hour due-soon boundary;
  - verifies only the approved metadata projection survives;
  - verifies signed-out/local-preview states expose no assignment metadata.
- `tests/v4-home-assignments-smoke.mjs`
  - executes at 390px mobile width;
  - verifies status text, active-task ordering, direct-open ordering, `See all`, load-failure behavior, no private-data leakage, touch-target sizing, and no horizontal overflow.
- `.github/workflows/v4-home-assignments-verify.yml`
  - runs the isolated Home/Assignments gate and dispatches the complete accumulated regression suite only after the focused gate passes.

## Verification evidence

Targeted Home Assignments workflow:

- Run: `34665387872`
- SHA: `d97e04829926aa8ce999101d64c45c539849187a`
- Result: **PASS**
- Passed deployment build, existing Home visual/dashboard contracts, new Home Assignments static and state contracts, single-owner/Assignments architecture validators, Assignments privacy/behavior regressions, new 390px Home privacy/direct-open smoke, existing Assignments browser regressions, and final mobile-width acceptance.

Complete accumulated regression:

- Run: `34665430650`
- SHA: `d97e04829926aa8ce999101d64c45c539849187a`
- Result: **PASS**
- Passed Cloudflare deployment gate, all accumulated architecture validators, all accumulated edge regressions, guarded-harness syntax checks, and the complete accumulated browser/mobile suite.

## Result

**HOME ASSIGNMENTS RELEASE BLOCKER: CERTIFIED / CLOSED.**

The next Lane A release blocker is the requested Cebuano/Bisaya Bible translation. It must be implemented as an isolated translation/data tranche using a redistribution-compatible source, existing Bible registry/Reader ownership, offline bundled packs, complete attribution, and full canonical-pack validation.
