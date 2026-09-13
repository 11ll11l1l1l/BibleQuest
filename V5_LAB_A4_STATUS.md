# BibleQuest V5 Lab A4 — Component Rebuild Status

Updated: 2026-09-13 JST
Lab branch: `lab/v5-a4-component-rebuild`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Implementation head before this status update: `2d70a9b205b847f01056a00808c4fe4ae0eac368`

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
- Inspected exact-head inherited CI for `90969b021baa9729fbfe73e5da92217ef99cf121`: security/privacy, field gate, Cloudflare preview smoke, Section H, whole-app browser audit, protected-page audit, and Cloudflare Pages preview all completed successfully; inherited `BibleQuest v3 regression` failed in `Run accumulated architecture validators` before edge/browser regression stages.
- Identified a deterministic validator incompatibility introduced by the intentional component boundary: `scripts/validate-v3-japanese-kougo.mjs` still required `data-jko-failure`, `data-reader-use-bsb`, and the no-synthesized-fallback copy to remain physically inside `src/features/reader/index.js`, even though accepted behavior now places those presentation contracts in `src/v5/reader/async-view.mjs`.
- Updated that Japanese gate without weakening the protected outcome: route behavior (`translation === 'jko'`, explicit `reader.setTranslation('bsb')`) remains required in the Reader owner; recovery presentation remains required in the async component; the gate now additionally requires the exact Reader→component import/delegation seam, scans both `.js` and `.mjs` sources for remote GetBible ownership, and forbids networking/storage/global-runtime ownership in the new component.

## Component/state decisions

1. Component APIs expose presentation and semantic state; feature/domain state remains with the existing service until a bounded migration proves a better owner.
2. One interaction owner per mounted subtree remains mandatory. The V5 view mount is not introduced beside Reader's existing route listener set.
3. Reader loading/error is now the first shipped component migration because it did not require moving chapter, search, verse-peek, translation, licensing or persistence state.
4. Compatibility action selectors are preserved so the existing route event owner consumes the new presentation without duplicate handlers.
5. Japanese translation failure behavior remains protected: no fallback Scripture is synthesized; BSB remains an explicit user action.
6. Shared components escape user/error text by default.
7. Framework selection remains open until at least one Reader interaction slice and one Games slice are measured.
8. Migration strategy favors presentation-first replacement with characterization around the old owner; event/state ownership moves only when there is explicit parity evidence and a single replacement owner.
9. Legacy architecture gates may evolve when a V5 boundary deliberately moves presentation ownership, but only by replacing physical-file assertions with equivalent-or-stronger behavior/ownership assertions; test deletion or weaker security/licensing evidence is not acceptable.

## Tests and evidence

- Previous isolated execution: `node tests/v5-reader-async-view.mjs` — PASS (`v5 reader async view: PASS`).
- Previous isolated execution: `node tests/v5-reader-route-async-characterization.mjs` — PASS (`v5 Reader route async characterization: PASS`) against the committed route/component dependency set before wiring.
- Exact-head CI at `90969b021baa9729fbfe73e5da92217ef99cf121`:
  - BibleQuest V4 Section I security privacy gates — PASS.
  - BibleQuest V4 Phase 6 field evidence gate — PASS.
  - BibleQuest V4 Cloudflare preview smoke — PASS.
  - BibleQuest V4 Section H release gates — PASS.
  - BibleQuest V4 whole-app browser audit — PASS.
  - BibleQuest V4 protected-page audit — PASS.
  - Cloudflare Pages branch preview — PASS.
  - BibleQuest v3 regression — FAIL in accumulated architecture validators; downstream edge/browser stages in that workflow were skipped.
- The Japanese validator failure mode is reproducible from source inspection: after component extraction, its old `ui.includes(...)` assertions for recovery presentation no longer match the Reader file although the same protected contracts are present in `src/v5/reader/async-view.mjs` and browser/security workflows pass.
- Gate repair implementation head: `2d70a9b205b847f01056a00808c4fe4ae0eac368`.
- Exact-head workflow evidence for the repair was not yet available immediately after the commit and is not claimed green.
- No backend, auth, RLS, privacy, translation licensing, production Cloudflare or production Supabase behavior changed.

## Failures / constraints

- Direct repository cloning remains unavailable from the execution container because GitHub DNS resolution fails; repository work continues through the GitHub connector.
- The inherited v3 regression is currently red on the prior lab head. The demonstrated stale Japanese validator contract has been repaired, but the full validator sequence must rerun before assuming it was the only failing validator.
- Exact-head edge/browser regression from the v3 regression workflow remains unproven because those stages were skipped after the architecture-validator failure.
- Draft-PR CI is evidence only; this lab PR is never a merge candidate.

## Known debt

- The new primitives still have no dedicated CSS/design-token owner.
- Reader remains a large owner despite the first presentation extraction.
- Games remains monolithic and has not yet exercised the component contract.
- The primitive/mount layer remains JavaScript because this lab baseline has no Vite/TypeScript toolchain.
- `scripts/validate-v3-architecture.mjs` still globally walks only `.js` files, so V5 `.mjs` modules are not yet included in its generic storage/navigation/backend ownership scan; the repaired Japanese-specific gate now covers `.mjs` for its remote-source boundary, but broader V5 architecture validation remains debt.

## Next 3 tasks

1. Inspect exact-head CI after `2d70a9b205b847f01056a00808c4fe4ae0eac368`; if another validator fails, repair the demonstrated stale ownership assertion with equivalent-or-stronger V5 evidence rather than weakening the gate.
2. Once inherited regression is green, extract the Reader verse-peek presentation model behind a component boundary without moving `reader.peek`, context, vocabulary or dialog ownership prematurely.
3. Spike one representative Games launcher/question/result slice behind the same component/state contract and compare complexity before framework selection.

## Safety

No writes were made to `main`, `v5/architecture-upgrade`, another lab, Cloudflare production or Supabase production. No auth/RLS/privacy/licensing behavior was weakened. Draft PR #190 remains `[LAB ONLY][DO NOT MERGE]`, draft, and targeted only at `main` for evidence.
