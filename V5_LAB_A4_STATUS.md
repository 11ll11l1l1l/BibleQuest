# BibleQuest V5 Lab A4 — Component Rebuild Status

Updated: 2026-09-13 JST
Lab branch: `lab/v5-a4-component-rebuild`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Implementation head before this tranche: `cf0e1b9d692c5625ff8cca9aaec2029fbc5cc9e6`

## Hypothesis

A component-driven V5 can reduce BibleQuest's fragile UI/state debt without a clean-slate rewrite by introducing explicit, testable view primitives and state contracts first, then migrating large owners such as Reader and Games behind those boundaries while preserving backend/security contracts.

## Current experiment decision

**VIABLE — CONTINUE.**

No framework has been selected. The experiment remains framework-neutral while it measures whether small explicit components can absorb real Reader/Games complexity without introducing parallel state or event ownership.

## Completed work

- Added `src/v5/ui/primitives.mjs` as the dependency-free component boundary.
- Added `src/v5/ui/view-mount.mjs` as a deterministic single delegated action owner for future migrated subtrees.
- Added `tests/v5-component-primitives.mjs` and `tests/v5-view-mount.mjs`.
- Characterized the current Reader owner in `src/features/reader/index.js`: one route mount owns `change`, `click`, and `submit`; `reader` remains the domain/service state owner; async loading/error rendering is currently imperative markup inside that route.
- Added `src/v5/reader/async-view.mjs` as a Reader-specific presentation boundary for loading/error states.
- The Reader async component reuses shared V5 loading/error semantics and preserves the current retry and Japanese-to-BSB action selectors, avoiding a second listener owner or a behavior/licensing change.
- Added `tests/v5-reader-async-view.mjs` covering loading/error semantics, escaping, retry continuity and the Japanese failure/BSB path.
- This tranche deliberately does not wire the new async component into the shipped Reader yet; wiring is held until inherited Reader/browser evidence can validate the swap rather than creating an unproven production-surface change.

## Component/state decisions

1. Component APIs expose presentation and semantic state; feature/domain state remains with the existing service until a bounded migration proves a better owner.
2. One interaction owner per mounted subtree remains mandatory. The new `view-mount` must not be introduced beside Reader's existing route listener set.
3. Reader loading/error is the first extraction seam because it can be represented without moving chapter, search, verse-peek, translation, licensing or persistence state.
4. Compatibility action selectors are temporarily preserved in the Reader adapter so the existing route event owner can consume the new presentation without duplicate handlers.
5. Japanese translation failure behavior is protected: no fallback Scripture is synthesized; BSB remains an explicit user action.
6. Shared components continue escaping user/error text by default.
7. Framework selection remains open until at least one Reader interaction slice and one Games slice are measured.

## Tests and evidence

- Isolated exact-module execution: `node tests/v5-reader-async-view.mjs` — PASS (`v5 reader async view: PASS`).
- Assertions cover loading `role=status`/polite live region, error `role=alert`/assertive live region, escaped error content, retry continuity, Japanese failure notice, explicit BSB action, and absence of inline `onclick`.
- Existing Reader source was inspected at branch head `cf0e1b9d692c5625ff8cca9aaec2029fbc5cc9e6`; it retains a single route listener owner and existing reader service/state owner.
- No browser, responsive, PWA or shipped Reader parity evidence is claimed for the new adapter because it is not wired into the route in this tranche.
- No database/security behavior changed.

## Failures / constraints

- Repository work continues through the GitHub connector rather than a checked-out clone; local validation uses isolated copies of exact new module/test contents.
- Direct raw GitHub download from the execution container failed with transient DNS resolution, so a checkout-based inherited suite was unavailable in this run.
- The draft lab PR supplies inherited CI evidence only; it is never a merge candidate.

## Known debt

- The new primitives still have no dedicated CSS/design-token owner.
- Reader and Games remain monolithic shipped owners.
- Reader async presentation is extracted but not yet connected to the shipped route.
- The primitive/mount layer remains JavaScript because this lab baseline has no Vite/TypeScript toolchain.
- Real browser focus, responsive behavior and PWA semantics require browser-level evidence when a shipped surface first adopts these components.

## Next 3 tasks

1. Add focused Reader characterization around loading/error transitions and retry/explicit-BSB behavior using the existing route owner, then wire `async-view.mjs` only if parity is proven.
2. Extract the Reader verse-peek presentation model without moving `reader.peek`, context, vocabulary or dialog ownership prematurely.
3. Spike one representative Games launcher/question/result slice behind the same component/state contract and compare complexity before framework selection.

## Safety

No writes were made to `main`, `v5/architecture-upgrade`, another lab, Cloudflare production or Supabase production. No auth/RLS/privacy/licensing behavior was changed.
