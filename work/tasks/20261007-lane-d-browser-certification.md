# Lane D — automated authenticated browser certification

Date: 2026-10-07
Canonical issue: #1303
Base branch: `v7/development`
Starting base SHA: `7af82b5c8078eccdb6390d97d072d7df32394857`
Branch: `v7/lane-d-browser-certification-20261007`

## Scope

Refresh the useful authenticated populated-browser work from PR #1265 onto live V7 integration and extend it into Lane D release-quality automation.

## Acceptance covered

- exact candidate SHA checkout and clean-tree verification
- disposable current-schema Supabase reset
- real leader/member password sign-in through the built Account UI
- populated Library rendering and taxonomy filtering
- responsive checks at 320, 390, and 430 CSS px
- keyboard focus traversal and `:focus-visible` confirmation
- WCAG A/AA automated accessibility scan including contrast
- 125% root text scaling without horizontal overflow
- locale change/reload while preserving authenticated state
- mentor ONE 2 ONE pair/authoring/assignment surfaces
- sign-out and account switch to mentee
- assigned curriculum track/module/lesson navigation
- no browser page errors
- sanitized per-SHA JSON evidence for PASS/FAIL

## Evidence boundary

This gate uses disposable synthetic data and device emulation. It establishes repeatable browser behavior and accessibility evidence, not production promotion or editorial/rights approval. Final Lane D convergence still consumes the Lane A catalog, Lane B approval report, and Lane C authenticated journey evidence before exact-SHA release promotion.
