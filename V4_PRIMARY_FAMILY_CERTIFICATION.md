# BibleQuest V4 Primary App-Family Acceptance Certification

Updated: 2026-09-12 JST

## Certified checkpoint

- Release checkpoint: `release/v4-primary-family`
- Exact product SHA: `c7a78d71354696130efa07e6d7f010deae7795a0`
- Full accumulated regression run: `34681411008`
- Result: **PASS**
- Verification PR: #134, closed unmerged after exact-SHA evidence was captured.

## Accepted scope

Home, Learn, Play, Grow and More are certified as one coherent V4 primary app family.

The tranche preserved the existing shell/router/bootstrap ownership and only removed stale internal-development language from Play, Grow and More. It did not replace route ownership, services, persistence, authentication, progress/reward ownership or backend behavior.

The prior exploratory candidate `5538934efe721dfbd2248153386f964a8151ed08` was **not certified**. Its CI run correctly caught an over-broad Progress presentation byte-lock and an accidental missing semicolon in the `&quot;` HTML escape entity. Both were corrected before the certified candidate. The canonical Progress service remains byte-locked while presentation hooks/ownership/artwork/responsive behavior remain explicitly guarded.

## Acceptance evidence

Exact SHA `c7a78d71354696130efa07e6d7f010deae7795a0` passed:

- Cloudflare/build deployment gate;
- all accumulated architecture validators;
- all accumulated edge/security/privacy regressions;
- guarded field-harness syntax checks;
- complete accumulated Playwright browser/mobile suite;
- `tests/v4-primary-family-static.mjs`;
- `tests/v4-primary-family-smoke.mjs` at 320px and desktop;
- retained shell, final-mobile-width, Home rail, Learn, Games, Progress and More regressions.

The V4 family contract verifies:

- exactly one primary shell navigation owner with Home / Learn / Play / Grow / More;
- active-route `aria-current` semantics;
- bootstrap-owned route/callback wiring;
- Home high-value rail order: Daily Journey, Reader, Assignments, Calendar, Progress;
- Learn entry points remain reachable;
- Play retains Memory Meadow and Play Together entry points;
- Grow retains Transformation, Personality Profile, Psychometrics and Avatar Vault entry points;
- More retains five grouped families and its maintained destinations;
- stale internal rebuild/development wording is absent from primary user-facing surfaces;
- no document overflow at 320px or desktop in the focused family smoke;
- primary navigation targets remain at least 44px.

## Release rule

This certification closes the last Priority-1 page/family-coherence gate. Later V4 work now advances to named-flow acceptance, artwork integration, whole-app polish, responsive/accessibility/PWA/device evidence, privacy/field evidence, and final release-candidate certification.