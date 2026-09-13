# BibleQuest V5 Lab A4 — Component Rebuild Status

Updated: 2026-09-13 JST
Lab branch: `lab/v5-a4-component-rebuild`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Implementation head before this tranche: `f3cc8f179ebfcf89318b8ba14b4421cd7cb6a9e3`

## Hypothesis

A component-driven V5 can reduce BibleQuest's fragile UI/state debt without a clean-slate rewrite by introducing explicit, testable view primitives and state contracts first, then migrating large owners such as Reader and Games behind those boundaries while preserving backend/security contracts.

## Current experiment decision

**VIABLE — CONTINUE.**

No framework has been selected. The experiment remains framework-neutral while it measures whether small explicit components can absorb real Reader/Games complexity without introducing parallel state or event ownership.

## Completed work

- Added `src/v5/ui/primitives.mjs` as the dependency-free component boundary.
- Added `src/v5/ui/view-mount.mjs` as a deterministic single delegated action owner for future migrated subtrees.
- Added focused primitive/mount tests.
- Characterized the current Reader owner in `src/features/reader/index.js`: one route mount owns `change`, `click`, and `submit`; `reader` remains the domain/service state owner.
- Added `src/v5/reader/async-view.mjs` as a Reader-specific presentation boundary for loading/error states.
- The Reader async component preserves retry and Japanese-to-BSB action selectors and does not create another listener owner.
- Added `tests/v5-reader-async-view.mjs` for semantic loading/error presentation and Japanese recovery behavior.
- Added `tests/v5-reader-route-async-characterization.mjs` to protect the existing route-level async contract before wiring the extracted component: one route listener owner, stale-request operation token, initial load, retry behavior, explicit BSB recovery, and Japanese no-synthesized-fallback messaging.
- The shipped Reader is still intentionally unchanged; the extracted async component remains unwired until characterization plus broader inherited/browser evidence is available.

## Component/state decisions

1. Component APIs expose presentation and semantic state; feature/domain state remains with the existing service until a bounded migration proves a better owner.
2. One interaction owner per mounted subtree remains mandatory. The V5 view mount must not be introduced beside Reader's existing route listener set.
3. Reader loading/error remains the first extraction seam because it does not require moving chapter, search, verse-peek, translation, licensing or persistence state.
4. Compatibility action selectors are temporarily preserved so the existing route event owner can consume a future presentation swap without duplicate handlers.
5. Japanese translation failure behavior is protected: no fallback Scripture is synthesized; BSB remains an explicit user action.
6. Shared components escape user/error text by default.
7. Framework selection remains open until at least one Reader interaction slice and one Games slice are measured.

## Tests and evidence

- Previous isolated execution: `node tests/v5-reader-async-view.mjs` — PASS (`v5 reader async view: PASS`).
- New characterization file added: `tests/v5-reader-route-async-characterization.mjs`.
- New characterization assertions cover single Reader `change`/`click`/`submit` ownership and cleanup; operation-token stale-request protection; initial load; retry continuity; explicit BSB switch with search/highlight reset; and async-view loading/error/Japanese recovery semantics.
- The current Reader source at `f3cc8f179ebfcf89318b8ba14b4421cd7cb6a9e3` confirms these accepted contracts remain present.
- Full execution of the new route characterization is not yet claimed in this connector-only run; no checked-out repository/browser harness was available.
- No browser, responsive, PWA, database or security behavior changed.

## Failures / constraints

- Repository work continues through the GitHub connector rather than a checked-out clone.
- The new route characterization has been committed but has not yet been executed in a full repository checkout in this run.
- Draft-PR CI is evidence only; this lab PR is never a merge candidate.

## Known debt

- The new primitives still have no dedicated CSS/design-token owner.
- Reader and Games remain monolithic shipped owners.
- Reader async presentation is extracted but not yet connected to the shipped route.
- The primitive/mount layer remains JavaScript because this lab baseline has no Vite/TypeScript toolchain.
- Real browser focus, responsive behavior and PWA semantics require browser-level evidence when a shipped surface first adopts these components.

## Next 3 tasks

1. Execute the new Reader route characterization in repository CI/local checkout; if green, wire only `renderReaderLoading`/`renderReaderError` into the existing Reader owner without changing listener/state/service ownership.
2. Extract the Reader verse-peek presentation model without moving `reader.peek`, context, vocabulary or dialog ownership prematurely.
3. Spike one representative Games launcher/question/result slice behind the same component/state contract and compare complexity before framework selection.

## Safety

No writes were made to `main`, `v5/architecture-upgrade`, another lab, Cloudflare production or Supabase production. No auth/RLS/privacy/licensing behavior was changed.
