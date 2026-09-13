# BibleQuest V5 Lab A1 — Incremental Vite Architecture Status

Lab identity: `BQ-V5-LAB-A1-INCREMENTAL`
Branch: `lab/v5-a1-incremental-vite`
Baseline origin: clean accepted V5 planning `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Status updated: 2026-09-13 JST

## Hypothesis

BibleQuest can reach V5 architecture quality through disciplined incremental evolution: preserve accepted V4 behavior while introducing a real Vite build graph, TypeScript-capable contracts, deterministic artifacts, route/domain lazy-loading seams, typed services and progressively migrated components. A clean-slate rewrite is not assumed necessary.

## Exact lab state inspected

- Starting lab HEAD for this run: `13612e6985640008a2c367d5cded23497da81348`.
- This status file is part of the tranche commit; the branch HEAD containing it is the authoritative endpoint for this run.

## Completed work

### Tranche 1 — non-invasive build/toolchain scaffold

- Added `package.json` with pinned Vite `8.2.2` and TypeScript `7.0.2` development dependencies.
- Pinned the supported Node floor to `>=22.12.0`.
- Added `vite.config.ts` with deterministic `dist/` output ownership, hashed JS/chunk/assets, manifest generation, source maps and an ES2022 build target.
- Added `tsconfig.json` for incremental TypeScript adoption: strict new TS boundaries, `allowJs` migration compatibility, no big-bang JS checking or emit.

### Tranche 2 — executable V4 static/PWA artifact contract

- Added `config/v5-static-artifacts.json` as the explicit list of stable root-URL artifacts.
- Added `scripts/v5-artifact-contract.mjs` to validate the source-side contract.
- Kept application runtime behavior untouched.

### Tranche 3 — contract-driven Vite root artifact emission

- Added `scripts/v5-static-artifacts.mjs`, a dependency-free build helper that loads the existing contract, rejects unsafe paths/output directories, copies only declared stable-root files, and byte-verifies every copy.
- Added `scripts/v5-copy-static-artifacts.mjs` as a standalone executable path for CI/debugging independent of Vite.
- Wired the same helper into `vite.config.ts` through a build-only `closeBundle` plugin so Vite owns root artifact emission without copying the repository wholesale.
- Added `npm run copy:static-artifacts`.
- No router, session, Reader, Games, Supabase, storage, service-worker behavior, or production deployment configuration changed.

## Validation / evidence

- Current V5 plan requires deterministic deployable `dist/`, explicit asset handling and preservation of PWA/deep-route behavior before feature refactors.
- ADR-0001 proposes Vite + incremental TypeScript and specifically requires deep routes/PWA/service-worker paths to be preserved during cutover; it remains `PROPOSED` on this lab baseline.
- The new helper/CLI were executed with Node `v22.16.0` against a synthetic repository fixture: declared root artifacts copied successfully and nested declared paths were preserved.
- Byte equality of source/destination is checked by the helper itself after every copy.
- Negative synthetic execution using an output directory outside the repository failed as intended with `[static-artifacts] outDir must stay inside the repository root`.
- Exact full-repository `npm ci`, typecheck and Vite build are still not claimed because `package-lock.json` is not yet available and dependency installation remains unproven.
- No production or Supabase state was touched.

## Failures / blockers

1. Deterministic install remains incomplete because `package-lock.json` has not been generated and verified.
2. Vite build execution has not yet been proven on the exact lab branch.
3. Built-output parity beyond the stable-root artifact subset is not yet characterized.
4. Existing inherited workflows still assume the source-root V4 deployment/build model.
5. ADR-0001 is still `PROPOSED`; this disposable lab is evidence for the decision, not approval of it.

## Architecture decisions learned

- A small explicit artifact contract is sufficient to bridge stable PWA/install URLs into Vite without copying unrelated repository files into `dist/`.
- The artifact contract now has one implementation owner reused by both Vite and a standalone CLI, avoiding divergent copy logic.
- Stable-root emission can remain independent of router/session/feature migration, reducing the blast radius of Phase 1.
- The helper deliberately rejects output outside the repository and verifies copied bytes, making the build seam deterministic and auditable.
- TypeScript migration should still begin at new architecture/service boundaries rather than globally checking legacy JS.

## Known debt

- Missing lockfile and `npm ci` proof.
- No exact Vite production build or production-equivalent `dist/` inventory yet.
- No built-output validator for Vite-rewritten `index.html`/manifest relationships yet.
- No route-level lazy imports yet.
- No typed service contract migrated yet.
- No V5-specific unit runner/lint command yet.
- No bundle/image budgets until a production-equivalent build exists.

## Next 3 tasks

1. Generate and commit a deterministic lockfile, then run `npm ci`, `npm run typecheck`, `npm run check:artifact-contract` and `npm run build`; record exact results and artifact inventory.
2. Add a built-output validator that checks emitted `index.html`, Vite manifest and stable-root PWA/install URLs against `dist/` after a real build.
3. Add characterization around bootstrap/router/session and migrate one low-risk route/domain boundary to a typed lazy-loaded adapter only after build parity is demonstrated.

## Viability

**VIABLE — CONTINUE.**

The incremental experiment now has both a source-side artifact contract and a single auditable implementation path for Vite/CLI emission. The remaining gating risk is deterministic dependency installation and full build parity, not evidence that a clean-slate rewrite is necessary.
