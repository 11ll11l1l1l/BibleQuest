# BibleQuest V4 Whole-App Browser Audit Certification

Updated: 2026-09-12 JST
Status: CERTIFIED

## Certified candidate

- Candidate SHA: `65d08e93d4df2629db78f83f52ce3c610ce8bb25`
- Preserved checkpoint: `release/v4-whole-app-browser-audit`
- Integration PR: #145 (`work/v4-whole-app-browser-audit` -> `v4/modern-ui-overhaul`)
- Integration merge commit: `e45dff7ea1d1d83063b9084a6ff0263db389c958`

## Exact-SHA evidence

The exact candidate above passed all required verification before integration:

- Focused whole-app browser audit: run `34690641958` — PASS.
- Protected-page audit: run `34690641974` — PASS.
- Full accumulated regression: run `34690725670` — PASS, including build/deployment, architecture validators, accumulated edge regressions, guarded field-harness syntax, and the complete browser/mobile regression stage.

Verification-only PR #146 was used solely to obtain the exact-SHA accumulated-suite evidence against `main` and was closed without merging.

## Whole-app state matrix

Browser-rendered acceptance now explicitly covers:

- loading state and loading -> ready/empty transition;
- empty/no-active-assignment state;
- signed-out state;
- offline/local-preview state;
- authenticated/no-congregation state;
- safe API error state, including confirmation that raw service details are not exposed;
- successful completion state and awarded-points feedback;
- document/host overflow during the above state transitions.

The controlled state matrix is backed by the real `assignmentsPage` renderer and is cross-checked with independent browser regressions for Assignments, Daily Journey, Games, Cloud Notes, Offline Shell, and Operational Recovery.

## Maintained-route browser matrix

`tests/v4-whole-app-deep-routes-smoke.mjs` traverses all 42 maintained routes at 320 px and 430 px. Each route is checked for:

- nonblank rendering;
- no startup-failure or generic recovery fallback;
- no accidental Page Not Found route;
- no document-level horizontal overflow;
- main content remaining inside the viewport;
- no unexpected console/page errors;
- no late topbar/navigation geometry drift;
- no material late leading-content shift.

The audit also performs English, Japanese, and Cebuano/Bisaya text-expansion stress on representative high-value routes and verifies that those strings do not create document overflow or escape the viewport.

## Real defect found and fixed

The first exhaustive run found a genuine 320 px overflow on `#/backup`: the document expanded from a 320 px viewport to 367 px.

Root cause: the V4 generic panel label layout placed the `Backup JSON` label text and the browser-native file picker in one horizontal flex row. The native file input's intrinsic width exceeded the remaining mobile panel width.

Fix: `src/ui/reset-recovery-v4.css` now stacks and constrains only `input[data-backup-file]` and its direct label. This is presentation-only. No backup export/import/reset behavior, service ownership, security logic, storage, route, or data contract changed.

The rerun then passed the complete 42-route matrix, localization stress, focused whole-app gate, protected-page audit, and full accumulated suite on the exact candidate SHA.

## Release implication

Section G's browser-required whole-app polish items are now closed by repository evidence: loading, empty, error, success/completion, signed-out, offline/recovery, deep-page clipping/document overflow, layout-shift resilience, and English/Japanese/Cebuano text-expansion resilience.

This certification does **not** close Section H's broader release gates such as all target viewport widths, tablet/desktop/orientation/safe-area coverage, keyboard/focus/screen-reader verification, asset/performance review, installed-PWA field checks, reconnect field behavior, or physical Android Chrome/Brave verification. Those remain separate release work.