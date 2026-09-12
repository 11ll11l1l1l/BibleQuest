# BibleQuest V4 Active Development Status

Updated: 2026-09-12 JST
Execution model: one serialized development stream
Active branch: `v4/modern-ui-overhaul`
Coordination: `V4_PARALLEL_COORDINATION.md` (historical filename; serialized model is authoritative)

## Mandatory companion checklist

Before selecting, implementing, certifying, or closing remaining V4 work, read `V4_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`. It is a release-blocking record of the user's requested features, exact acceptance details, custom artwork program, whole-app audit requirements, device/accessibility/PWA gates, and final release gates. A green general regression run does not override unchecked requested acceptance items in that checklist.

## Last fully verified active baseline

- Exact SHA: `76474d070da75cb8e0a9210642ea9e426b545200`
- Full accumulated regression run: `34666411786`
- Result: **PASS**
- This baseline includes the completed CEBOCB Cebuano/Bisaya Reader/source-guide integration and its accumulated regression coverage.

## Current tranche

**Tranche 13 — Admin + Content Review + Congregation + diagnostics/recovery**

State: **INTEGRATING / TESTING**

Work incorporated into the single active stream:

- `src/ui/admin-console-v4.css`
- `src/ui/admin-operations-v4.css`
- `src/ui/content-review-v4.css`
- `src/ui/congregation-v4.css`
- `src/ui/reset-recovery-v4.css`
- unified preservation contract: `tests/v4-tranche13-static.mjs`
- five V4 presentation styles activated from the shared `index.html` V4 override list

The five existing feature owners remain intentionally unchanged from exact pre-tranche active baseline `76474d070da75cb8e0a9210642ea9e426b545200`:

- `src/features/admin-console/index.js`
- `src/features/admin-operations/index.js`
- `src/features/content-review/index.js`
- `src/features/congregation/index.js`
- `src/features/reset-recovery/index.js`

No backend, RLS, auth, routing, privileged API, diagnostic authority, membership authority, review decision authority, or recovery ownership change is part of this tranche.

## Current gate still open

1. Register `tests/v4-tranche13-static.mjs` in the accumulated regression workflow.
2. Run the full accumulated regression against the resulting exact candidate SHA.
3. Repair any regression against the same active stream if needed.
4. Only after green evidence, mark Tranche 13 certified and synchronize the captain/report index.

## Remaining serialized visual queue after Tranche 13

The old two-lane ordering is retired. Remaining work is handled from one queue against current repository evidence:

1. Tranche 11 — Account + Notes + Transform + Psychometrics + Accessibility.
2. Tranche 12 — Community + Couples + Journey Groups + Live Rooms + Media/Recordings + Encouragements.
3. Reconcile any remaining V4 plan acceptance gaps, artwork/responsive/accessibility/performance polish, then exact V4 release-candidate gates.

The order may change only when repository evidence shows a dependency or blocker; no second implementation lane is created.

## Safety rules

- Repository evidence overrides stale chat summaries.
- Preserve V3 single-owner architecture and all current privacy/isolation contracts.
- Presentation-only work must not silently change business behavior.
- Every completed tranche requires exact-SHA evidence rather than inherited PASS status.
- Do not modify production/main merely to advance V4.
