# BibleQuest V4 Active Development Status

Updated: 2026-09-12 JST
Execution model: one serialized development stream
Active branch: `v4/modern-ui-overhaul`
Coordination: `V4_PARALLEL_COORDINATION.md` is historical; this file plus `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` define the active serialized state.

## Mandatory companion checklist

Before selecting, implementing, certifying, or closing remaining V4 work, read `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`. It is release-blocking. A green general regression run does not override unchecked requested acceptance items.

## Last fully verified V4 product checkpoint

- Checkpoint: `release/v4-community-family`
- Exact SHA: `e72b6427fdc2c7e742152264c5091d80f9e6ad6d`
- Full accumulated regression run: `34677870938`
- Result: **PASS**
- Passed: Cloudflare/build deployment gate, accumulated architecture validators, accumulated edge regressions, guarded field-harness syntax, and complete accumulated browser/mobile Playwright suite.
- V4 feature/service owners for the Community tranche are byte-locked to pre-tranche baseline `7b2abd7507adf5b7363fe068d5038f54d1c7263a` by `tests/v4-community-family-static.mjs`.

Later commits on `v4/modern-ui-overhaul` may update documentation/checklists. They do not create a new certified product identity unless runtime/product bytes change and earn their own complete verification.

## Serialized family-queue status

The original V4 family implementation queue is complete through the final Community / Relational tranche.

Certified/retained work includes:

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

## Community / Relational certification completed this cycle

New V4 presentation owner:

- `src/ui/community-family-v4.css`

Unified preservation contract:

- `tests/v4-community-family-static.mjs`

Covered routes/surfaces:

- Community Bridge;
- Couples local/device experience;
- Couple Journey cloud experience;
- Journey Groups;
- Team Center;
- Live Rooms;
- Congregation Recognition;
- Leaderboards;
- Encouragements;
- Media Library;
- Live Recordings.

The tranche deliberately did **not** modify any corresponding `src/features/**/index.js` owner. It added responsive relational composition, structural privacy/role boundaries, explicit destructive-action presentation, Live Room connection/code hierarchy, and wide browse/player layouts while retaining the certified Community family accent tokens.

## Remaining release-blocking work

The next work is no longer another broad family conversion. It is acceptance closure and requested polish, in this order unless repository evidence exposes a blocker:

1. **Home assignment/status acceptance reconciliation** — prove every requested signed-out/offline/no-congregation/loading/error/open/started/due/overdue/completed state against the existing Assignments owner and clear only the states actually evidenced.
2. **Priority-1 page audits** — Calendar, Assignments, Daily Journey/Mission, Progress/Grow and coherent Home/Learn/Play/Grow/More reachability.
3. **Named-flow audits** — Memory Meadow exact #38 behavior; Couples Journey/communication-level requirements; preserve CEBOCB through all later work.
4. **Custom artwork/icon program** — finish inventory, generated asset sheets, deterministic cutter/naming pipeline and replacement of remaining generic/placeholder artwork.
5. **Whole-app polish + responsive/accessibility/performance/PWA audit** — all maintained routes and states, target phone widths, tablet/desktop, safe areas, keyboard/screen reader, reduced motion, localization expansion and asset cost.
6. **Security/privacy/field evidence** — account isolation and real multi-account Assignments/Groups/Teams/Couples/Live Rooms evidence without weakening RLS or data boundaries.
7. **Exact V4 release candidate** — freeze one SHA, complete all release gates, preview/staging, installed-PWA/physical-device evidence, then promote while preserving the known-good V3 rollback reference.

## Safety rules

- Repository evidence overrides stale chat summaries.
- Preserve V3 single-owner architecture and current privacy/isolation contracts.
- Presentation-only work must not silently change business behavior.
- Every runtime/product tranche requires exact-SHA evidence; documentation-only commits do not inherit a new product identity.
- Do not weaken tests to obtain green status.
- Do not modify production/main merely to advance V4.
