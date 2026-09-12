# BibleQuest V4 Active Development Status

Updated: 2026-09-12 JST
Execution model: one serialized development stream
Active branch: `v4/modern-ui-overhaul`
Coordination: `V4_PARALLEL_COORDINATION.md` is historical; this file plus `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` define the active serialized state.

## Mandatory companion checklist

Before selecting, implementing, certifying, or closing remaining V4 work, read `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`. It is release-blocking. A green general regression run does not override unchecked requested acceptance items.

## Last fully verified V4 runtime/product checkpoint

- Checkpoint: `release/v4-home-assignments`
- Exact SHA: `c676e0ec821ffb1ff2d8ddc0ecdd6168c50a62e7`
- Full accumulated regression run: `34678365877`
- Additional same-SHA accumulated run: `34678385543`
- Result: **PASS**
- Passed: Cloudflare/build deployment gate, accumulated architecture validators, accumulated edge/security/privacy regressions, guarded field-harness syntax, and complete accumulated browser/mobile Playwright suite.
- The expanded `tests/v4-home-assignments-edge.mjs` is part of accumulated CI rather than an uncalled standalone test.

Later documentation/checklist commits do not create a new runtime/product identity unless runtime/product bytes change and earn their own complete verification.

## Latest exact acceptance/certification checkpoint

- Gate: **Calendar V4 page-level acceptance**
- Checkpoint: `release/v4-calendar`
- Exact SHA: `658f202d65481f4486a2f6c010cf0f2248f8b391`
- Full accumulated regression run: `34679464999`
- Result: **PASS**
- The Calendar certification candidate changed only `tests/v4-calendar-static.mjs` and `.github/workflows/v3-regression.yml` relative to the pre-audit active V4 head `844ba32b00c95c34ad101b18f9195789ae79762a`.
- `src/app/calendar.js` and `src/features/calendar/index.js` remained byte-for-byte unchanged and are locked by the new V4 acceptance contract.
- Evidence: `V4_CALENDAR_CERTIFICATION.md`.

Because the Calendar tranche is certification-only, the runtime/product bytes remain equivalent to the prior certified product line while the acceptance evidence and CI contract advance.

## Serialized family-queue status

The original V4 family implementation queue is complete through Community / Relational. Certified/retained work includes:

- infrastructure bootstrap safety net;
- shared V4 foundation and icon system;
- global shell/navigation;
- Home dashboard and horizontal shortcut rail;
- Learn hub;
- Reader;
- Games + Avatar Vault;
- Ministry / Assignments / Workspace / Notifications presentation work;
- Journey family work;
- Study family work;
- Trust / Reflection work (Account, Notes, Transform, Personality/Psychometrics, Accessibility);
- Admin / Content Review / Congregation / diagnostics/recovery;
- CEBOCB Cebuano/Bisaya Reader/source-guide integration;
- More hub grouping and direct Home congregation/assignment access;
- six-family accent identity system;
- Community / Couples / Journey Groups / Teams / Live Rooms / Recognition / Leaderboards / Media / Recordings / Encouragements.

Community / Relational remains separately recoverable at `release/v4-community-family` -> `e72b6427fdc2c7e742152264c5091d80f9e6ad6d`, run `34677870938` PASS.

## Home assignment/status acceptance completed

Certified states include loading, signed out, local-preview/offline cloud-unavailable mode, authenticated with no congregation, API/load failure with generic retry, no open assignments, completed/no-pending work, one/multiple open assignments, started/in-progress, due soon and overdue.

The Home projection remains privacy-minimized: only approved task metadata is rendered. Submission text, leader feedback and raw API/server errors are excluded. Every state keeps a direct action into the existing Assignments route and task opening still uses the existing singleton Assignments service.

Primary implementation/evidence:

- `src/features/home/assignment-summary.js`
- `src/features/home/index.js`
- `src/ui/home-assignment-states-v4.css`
- `tests/v4-home-assignments-edge.mjs`
- `V4_HOME_ASSIGNMENTS_CERTIFICATION.md`

## Calendar acceptance completed

Calendar is now closed as a Priority-1 page-level V4 acceptance gate. Existing Calendar ownership, persistence, permission and mutation behavior was preserved; the new V4 static acceptance contract certifies the V4 presentation layer, owner boundaries, retained mobile/artwork regressions and accumulated-CI registration.

Primary evidence:

- `src/ui/journey-v4.css`
- `tests/v4-calendar-static.mjs`
- `tests/v3-calendar-edge.mjs`
- `tests/v3-calendar-smoke.mjs`
- `tests/v3-calendar-phase-b-static.mjs`
- `tests/v3-calendar-phase-b-smoke.mjs`
- `V4_CALENDAR_CERTIFICATION.md`

## Remaining release-blocking work

The next work is acceptance closure and requested polish, in this order unless repository evidence exposes a blocker:

1. **Priority-1 page audits** — full Assignments page first, then Daily Journey/Mission, Progress/Grow, and coherent Home/Learn/Play/Grow/More reachability.
2. **Named-flow audits** — Memory Meadow exact #38 behavior; Couples Journey/communication-level requirements; preserve CEBOCB through all later work.
3. **Custom artwork/icon program** — finish inventory, generated asset sheets, deterministic cutter/naming pipeline and replacement of remaining generic/placeholder artwork.
4. **Whole-app polish + responsive/accessibility/performance/PWA audit** — all maintained routes and states, target phone widths, tablet/desktop, safe areas, keyboard/screen reader, reduced motion, localization expansion and asset cost.
5. **Security/privacy/field evidence** — account isolation and real multi-account Assignments/Groups/Teams/Couples/Live Rooms evidence without weakening RLS or data boundaries.
6. **Exact V4 release candidate** — freeze one SHA, complete all release gates, preview/staging, installed-PWA/physical-device evidence, then promote while preserving the known-good V3 rollback reference.

## Safety rules

- Repository evidence overrides stale chat summaries.
- Preserve V3 single-owner architecture and current privacy/isolation contracts.
- Presentation-only work must not silently change business behavior.
- Every runtime/product tranche requires exact-SHA evidence; documentation-only commits do not inherit a new product identity.
- Do not weaken tests to obtain green status.
- Do not modify production/main merely to advance V4.