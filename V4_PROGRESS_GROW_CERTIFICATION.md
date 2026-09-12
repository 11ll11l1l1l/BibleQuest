# BibleQuest V4 Progress / Grow Acceptance Certification

Updated: 2026-09-12 JST

## Certified checkpoint

- Release checkpoint: `release/v4-progress-grow`
- Exact candidate SHA: `6c55de27154b9f856faaf80d7cd17b18124c54f3`
- Full accumulated regression run: `34680840140`
- Result: **PASS**
- Temporary verification PR: #133, closed unmerged after exact-SHA evidence was captured.

## Accepted V4 scope

Progress / Grow is certified as a preserved single-owner surface. The tranche did not change `src/core/progress.js` or `src/features/progress/index.js`; both are byte-locked by `tests/v4-progress-static.mjs` to the last fully verified V4 product checkpoint.

The V4 acceptance contract confirms canonical XP, streak, meaningful-activity, chapter and badge projection, existing transformation/personality/psychometrics/avatar entry points, semantic artwork, responsive composition, and preservation of the canonical progress/reward service.

## Acceptance evidence

The exact candidate passed:

- Cloudflare/build deployment gate;
- accumulated architecture validators;
- accumulated edge/security/privacy regressions;
- guarded field-harness syntax checks;
- complete accumulated Playwright browser/mobile regressions;
- `tests/v4-progress-static.mjs`;
- `tests/v4-progress-page-smoke.mjs` at 320px and desktop;
- retained `tests/v3-progress-edge.mjs`, `tests/v3-progress-smoke.mjs`, `tests/v3-progress-phase-b-static.mjs`, and `tests/v3-progress-phase-b-smoke.mjs`.

Existing regressions continue to protect idempotency, local civil-date streak behavior, badges, malformed-state normalization, stars/coins reward ownership, no unintended Kids Memory XP, persisted progress, semantic artwork, action target size and mobile no-overflow behavior.

## Files changed in the certified candidate

Relative to the previous fully verified V4 runtime/product checkpoint, the Progress/Grow acceptance tranche changed only certification/documentation/test infrastructure:

- `tests/v4-progress-static.mjs`
- `tests/v4-progress-page-smoke.mjs`
- `.github/workflows/v3-regression.yml`
- V4 status/checklist/certification documentation

No Progress/Grow runtime, feature, service or reward owner was changed.

## Release rule

This certification closes the dedicated Progress / Grow page-level Priority-1 acceptance item. Any later change to Progress/Grow presentation is still subject to the enclosing exact-SHA V4 acceptance/release suite; service/reward-owner changes require a new explicit ownership review and full certification.