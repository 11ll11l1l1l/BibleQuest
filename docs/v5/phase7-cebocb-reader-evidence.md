# V5 Phase 7 — CEBOCB Reader re-verification

Baseline checked: `v5/feature-completion` @ `dfcb851b38326edef0e4969958eb15866c673c8d`.

## Why this tranche exists

The CEBOCB implementation and its strong V4 validator/browser smoke still exist, but the V4 workflow only auto-runs for `v4/modern-ui-overhaul`. At the start of this tranche GitHub reported zero workflow runs for `v5/feature-completion`, so V5 had no current-head CEBOCB execution evidence.

## Required V5 evidence

`tests/v5-cebocb-reader-reverification.mjs` must pass on the candidate and proves the current tree still has:

- all 66 canonical CEBOCB packs and source anchors accepted by the canonical validator;
- bundled `cebocb` registry ownership with visible `Cebuano/Bisaya · OCCB` labeling;
- verse-bridge support retained in both Reader service and Reader UI;
- the existing browser smoke's bridge, peek, search, license/source, and 390px mobile contracts still present.

`.github/workflows/v5-cebocb-reverify.yml` then executes the actual browser behavior on PRs targeting `v5/feature-completion` when CEBOCB/Reader ownership changes. It runs the canonical/current-head contract, bridge edge test, the real CEBOCB Reader Playwright smoke at 390px, and the existing Reader smoke on the exact candidate SHA.

## Acceptance rule

Phase 7 CEBOCB re-verification is **not PASS merely because these files exist**. PASS requires a successful exact-head workflow run containing the real browser smoke. Static or source-only inspection must be reported as partial evidence only.

No Reader runtime, Bible data behavior, source packs, backend, schema, production configuration, V6 architecture, or V7 overhaul behavior is changed by this tranche.
