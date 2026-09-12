# BibleQuest V5 Lab A1 — Incremental Vite Architecture Status

Lab identity: `BQ-V5-LAB-A1-INCREMENTAL`
Branch: `lab/v5-a1-incremental-vite`
Baseline origin: clean accepted V5 planning `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Status updated: 2026-09-13 JST

## Hypothesis

BibleQuest can reach V5 architecture quality through disciplined incremental evolution: preserve accepted V4 behavior while introducing a real Vite build graph, TypeScript-capable contracts, deterministic artifacts, route/domain lazy-loading seams, typed services and progressively migrated components. A clean-slate rewrite is not assumed necessary.

## Exact lab state inspected

- Starting lab HEAD for this run: `1f504dec812f11453f82e30af61cdf3d6c547060`.
- Code/toolchain HEAD immediately before this status commit: `62df42c38dfd4b57c29b2c81a99fcc3d12fd01e1`.
- This status file is written as the final commit of the tranche; the branch HEAD containing this file is the authoritative run endpoint.

## Completed work

### Tranche 1 — non-invasive build/toolchain scaffold

- Added `package.json` with pinned Vite `8.2.2` and TypeScript `7.0.2` development dependencies.
- Pinned the supported Node floor to `>=22.12.0`, satisfying current Vite 8 runtime requirements without changing browser behavior.
- Added `vite.config.ts` with deterministic `dist/` output ownership, hashed JS/chunk/assets, manifest generation, source maps and an ES2022 build target.
- Added `tsconfig.json` for incremental TypeScript adoption: strict new TS boundaries, `allowJs` migration compatibility, no big-bang JS checking or emit.
- Added `node_modules/`, `dist/` and `*.tsbuildinfo` ignores.
- Did not modify `index.html`, bootstrap/router/session, service worker, feature modules, data/storage, Supabase, CSS or production deployment ownership in this tranche.

## Validation / evidence

- Repository authority confirms Phase 1 requires Vite, TypeScript-capable module boundaries, deterministic `dist/`, source maps and incremental JS compatibility.
- Existing `index.html` remains the V4 runtime entry with the full CSS chain and `src/app/bootstrap.js`; therefore this tranche does not silently replace runtime ownership.
- `package.json` and `tsconfig.json` are syntactically valid JSON by construction.
- Current npm-registry access from the execution environment was unavailable/too slow to complete `npm install --package-lock-only` within the run, so no lockfile or successful Vite build is claimed yet.
- No browser/PWA parity claim is made yet. `sw.js` and other runtime-fetched root/static content still require an explicit build-copy strategy before the Vite artifact can be considered deployable.

## Failures / blockers

1. Deterministic install is incomplete because `package-lock.json` has not yet been generated and verified.
2. Vite build execution has not yet been proven on this branch.
3. Root/runtime static resources that are not part of the HTML/module graph (especially `sw.js`, and any fetch-addressed data/assets) need an explicit inventory and output-copy contract before preview deployment.
4. Existing inherited workflows still assume the source-root V4 deployment/build model; this lab has not altered them yet.

These are expected first-spike gaps, not evidence that the incremental hypothesis has failed.

## Architecture decisions learned

- Vite + incremental TypeScript is compatible with the existing direct-module entry model as a first migration seam; no framework rewrite is required to begin.
- The current HTML is asset-heavy and the service worker is registered outside Vite's normal imported module graph, so artifact parity must be solved deliberately rather than by assuming `vite build` automatically reproduces every source-root file.
- TypeScript should initially type new architecture/service boundaries only. Enabling `checkJs` globally would create broad migration noise and freeze incidental V4 implementation detail.
- Build migration must remain distinct from Reader/Games/state refactors until exact route/PWA parity is demonstrated.

## Known debt

- Missing lockfile and `npm ci` proof.
- No build artifact inventory/diff yet.
- No route-level lazy imports yet.
- No typed service contract migrated yet.
- No V5-specific unit runner/lint command yet; add only after the basic build is executable.
- No bundle/image budgets until a production-equivalent build exists.

## Next 3 tasks

1. Generate and commit a deterministic lockfile, then run `npm ci`, `npm run typecheck` and `npm run build`; record exact results and artifact inventory.
2. Inventory all root/static/runtime-fetched resources and add the smallest explicit Vite public/copy strategy needed for V4-equivalent `dist/`, including `sw.js`, manifest/icons and fetch-addressed data without copying repository-only docs/tests.
3. Add characterization around bootstrap/router/session and migrate one low-risk route/domain boundary to a typed lazy-loaded adapter, proving incremental code splitting without changing behavior.

## Viability

**VIABLE — CONTINUE.**

The first tranche exposes a bounded artifact-parity problem rather than a need for clean-slate replacement. Incremental migration still appears technically credible, provided deterministic install/build and static-resource parity are proven before runtime-owner migration.
