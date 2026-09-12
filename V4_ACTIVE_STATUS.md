# BibleQuest V4 Active Development Status

Updated: 2026-09-12 JST
Execution model: one serialized development stream
Active branch: `v4/modern-ui-overhaul`
Coordination: `V4_PARALLEL_COORDINATION.md` is historical; this file plus `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` define the active serialized state.

## Mandatory companion checklist

Before selecting, implementing, certifying, or closing remaining V4 work, read `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`. It is release-blocking. A green general regression run does not override unchecked requested acceptance items.

## Latest fully verified V4 runtime/product checkpoint

- Gate: **Primary Home / Learn / Play / Grow / More family coherence**
- Checkpoint: `release/v4-primary-family`
- Exact SHA: `c7a78d71354696130efa07e6d7f010deae7795a0`
- Full accumulated regression run: `34681411008`
- Result: **PASS**
- Passed: Cloudflare/build deployment gate, accumulated architecture validators, accumulated edge/security/privacy regressions, guarded field-harness syntax, and complete accumulated browser/mobile Playwright suite.
- Evidence: `V4_PRIMARY_FAMILY_CERTIFICATION.md`.

The certified tranche preserved shell/router/bootstrap and service ownership. It removed stale internal-development wording from Play, Grow and More and added focused 320px/desktop primary-family acceptance. An earlier exploratory candidate was rejected by CI and is not a checkpoint; the corrected candidate restored the HTML escaping contract and preserves canonical Progress ownership.

The same fully green exact product SHA also certifies requested Memory Meadow #38 behavior as `release/v4-memory-meadow`; see `V4_MEMORY_MEADOW_CERTIFICATION.md`.

Later documentation/checklist commits do not create a new runtime/product identity unless runtime/product bytes change and earn their own complete verification.

## Recent Priority-1 checkpoints

- Calendar: `release/v4-calendar` -> `658f202d65481f4486a2f6c010cf0f2248f8b391`, run `34679464999` PASS.
- Full Assignments page: `release/v4-assignments-page` -> `65d7ef14b6e1bf5dc8925a88c5838bc233e9fd95`, run `34680055519` PASS.
- Daily Journey: `release/v4-daily-journey` -> `fbd8b474a3f8f71044b9cae48b47528f2075436a`, run `34680442340` PASS.
- Progress / Grow: `release/v4-progress-grow` -> `6c55de27154b9f856faaf80d7cd17b18124c54f3`, run `34680840140` PASS.
- Primary family: `release/v4-primary-family` -> `c7a78d71354696130efa07e6d7f010deae7795a0`, run `34681411008` PASS.
- Memory Meadow #38 behavior: `release/v4-memory-meadow` -> `c7a78d71354696130efa07e6d7f010deae7795a0`, same run `34681411008` PASS.
- Home assignment/status matrix: `release/v4-home-assignments` -> `c676e0ec821ffb1ff2d8ddc0ecdd6168c50a62e7`, runs `34678365877` and `34678385543` PASS.
- Community / Relational: `release/v4-community-family` -> `e72b6427fdc2c7e742152264c5091d80f9e6ad6d`, run `34677870938` PASS.

## Priority-1 status

The serialized Priority-1 page/family acceptance queue is complete. Calendar, Assignments, Daily Journey, Progress/Grow, and the coherent Home/Learn/Play/Grow/More family are all exact-SHA certified.

Memory Meadow #38 behavior is also closed without a runtime rewrite because the current implementation exactly matches the requested contracts:

- mobile: 6 pairs / 12 cards / 3 columns;
- wide: 8 pairs / 16 cards / 4 columns at the 420px rendered-game breakpoint;
- match delay: 350 ms;
- mismatch delay: 650 ms;
- pair-resolution input locking with stale-token protection;
- stars + coins completion rewards through canonical Progress;
- explicit zero XP.

## Current named-flow blocker: Couples Journey

The current Couples feature already provides local conversation cards, listening practice, Couple Check-in, Repair Room, faith/date-night cards, 7-day practices and separate Couples cloud pairing. However, the requested husband-wife communication **journey/level system plus self-assessment** is not represented as a persistent model in the current Couples service. It must not be marked complete merely because adjacent Couples features exist.

Known implementation constraints:

- preserve the existing Couples local/cloud separation and privacy model;
- do not turn the relationship level into a diagnosis, spiritual grade, winner/loser score, or coercive comparison;
- integrate with existing Couples UX rather than creating a duplicate Couples owner;
- retain the existing safety boundary for fear, threats, coercion, stalking or violence;
- use a positive-to-negative communication-level framework and a scored self-assessment as requested.

Exact historical level names/scoring are not currently encoded in repository documentation, so implementation must create one explicit repository-owned specification before runtime changes and certify it with focused tests.

## Main-branch artwork note

`main` moved independently to `66484a7df3f4ac59417981da511e4fcf14c10e18` during this work. Compare evidence shows the movement consists of newly uploaded V4 PNG artwork, not runtime code. Assets include core/navigation, Games, Memory Meadow, Community, Bible World, Ministry/More and system artwork.

Those assets were intentionally not merged into the certified behavioral checkpoint. Artwork integration remains a separate controlled tranche so visual changes cannot obscure behavioral regressions. Do not modify or merge `main` merely to advance V4.

## Remaining release-blocking work

Proceed in this order unless repository evidence exposes a higher-severity blocker:

1. **Couples Journey communication-level/self-assessment implementation and certification.**
2. **CEBOCB preservation audit** through the latest V4 runtime/product checkpoint.
3. **Custom artwork/icon integration** — reconcile the new `assets/v4/...` files with the active V4 branch, retain deterministic/canonical asset ownership, and integrate in isolated visual tranches without changing business behavior.
4. **Whole-app polish + responsive/accessibility/performance/PWA audit** — all maintained routes/states, target phone widths, tablet/desktop, safe areas, keyboard/screen reader, reduced motion, localization expansion and asset cost.
5. **Security/privacy/field evidence** — real multi-account isolation for Assignments/Groups/Teams/Couples/Live Rooms without weakening RLS or data boundaries.
6. **Exact V4 release candidate** — reconcile plan/issue/checklist, freeze one SHA, complete all gates, preview/staging, installed-PWA/physical-device evidence, then promote while preserving the V3 rollback reference.

## Safety rules

- Repository evidence overrides stale chat summaries.
- Preserve V3 single-owner architecture and current privacy/isolation contracts.
- Presentation-only work must not silently change business behavior.
- Every runtime/product tranche requires exact-SHA evidence; documentation-only commits do not inherit a new product identity.
- Do not weaken tests to obtain green status.
- Do not modify production/main merely to advance V4.