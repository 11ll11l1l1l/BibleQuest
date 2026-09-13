# BibleQuest V5 Lab A4 — Component Rebuild Status

Updated: 2026-09-13 JST
Lab branch: `lab/v5-a4-component-rebuild`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Implementation head before this status update: `159462179c131cc998dc96c938898dc754924ed9`

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
- Added `tests/v5-reader-async-view.mjs` for semantic loading/error presentation and Japanese recovery behavior.
- Added `tests/v5-reader-route-async-characterization.mjs` to protect route-level listener ownership, stale-request protection, retry behavior, explicit BSB recovery, and Japanese no-synthesized-fallback behavior.
- Executed the Reader route characterization in an isolated Node harness using the committed test and exact relevant component/source contracts: PASS (`v5 Reader route async characterization: PASS`).
- Wired only Reader loading/error presentation through `src/v5/reader/async-view.mjs`; the existing Reader route still owns listeners, state transitions, chapter/search/peek/dialog behavior and the `reader` service remains the data/domain owner.
- Strengthened the route characterization to assert the shipped Reader imports and delegates to the async component while retaining all prior ownership/recovery assertions.

## Component/state decisions

1. Component APIs expose presentation and semantic state; feature/domain state remains with the existing service until a bounded migration proves a better owner.
2. One interaction owner per mounted subtree remains mandatory. The V5 view mount is not introduced beside Reader's existing route listener set.
3. Reader loading/error is now the first shipped component migration because it did not require moving chapter, search, verse-peek, translation, licensing or persistence state.
4. Compatibility action selectors are preserved so the existing route event owner consumes the new presentation without duplicate handlers.
5. Japanese translation failure behavior remains protected: no fallback Scripture is synthesized; BSB remains an explicit user action.
6. Shared components escape user/error text by default.
7. Framework selection remains open until at least one Reader interaction slice and one Games slice are measured.
8. Migration strategy favors presentation-first replacement with characterization around the old owner; event/state ownership moves only when there is explicit parity evidence and a single replacement owner.

## Tests and evidence

- Previous isolated execution: `node tests/v5-reader-async-view.mjs` — PASS (`v5 reader async view: PASS`).
- Current run isolated execution: `node tests/v5-reader-route-async-characterization.mjs` — PASS (`v5 Reader route async characterization: PASS`) against the committed route contract and component dependency set before wiring.
- After wiring, `tests/v5-reader-route-async-characterization.mjs` was strengthened to require the async-view import/delegation in addition to the existing single-listener, stale-request, retry and BSB recovery contracts.
- The shipped Reader at implementation head `159462179c131cc998dc96c938898dc754924ed9` imports `renderReaderLoading`/`renderReaderError` and delegates only `host.innerHTML` for loading/error presentation to that component boundary.
- Draft PR #190 remained draft and triggered inherited workflows for the implementation head; at the status update they were pending/in-progress, so none is counted as passed.
- No backend, auth, RLS, privacy, translation licensing, production Cloudflare or production Supabase behavior changed.

## Failures / constraints

- Repository work continues through the GitHub connector rather than a checked-out clone because direct GitHub DNS resolution from the execution container is unavailable.
- A full checkout-based run of the strengthened post-wiring characterization is not yet available in this run; exact-head inherited CI is pending/in-progress.
- Browser, responsive and PWA evidence for the first shipped component migration remains required before claiming full parity.
- Draft-PR CI is evidence only; this lab PR is never a merge candidate.

## Known debt

- The new primitives still have no dedicated CSS/design-token owner.
- Reader remains a large owner despite the first presentation extraction.
- Games remains monolithic and has not yet exercised the component contract.
- The primitive/mount layer remains JavaScript because this lab baseline has no Vite/TypeScript toolchain.
- Real browser focus, responsive behavior and PWA semantics require exact-head browser evidence now that a shipped Reader surface imports the component layer.

## Next 3 tasks

1. Inspect exact-head draft-PR CI/browser evidence for the Reader async migration; repair only demonstrated regressions and do not weaken tests.
2. Extract the Reader verse-peek presentation model behind a component boundary without moving `reader.peek`, context, vocabulary or dialog ownership prematurely.
3. Spike one representative Games launcher/question/result slice behind the same component/state contract and compare complexity before framework selection.

## Safety

No writes were made to `main`, `v5/architecture-upgrade`, another lab, Cloudflare production or Supabase production. No auth/RLS/privacy/licensing behavior was changed. Draft PR #190 remains `[LAB ONLY][DO NOT MERGE]`, draft, and targeted only at `main` for evidence.
