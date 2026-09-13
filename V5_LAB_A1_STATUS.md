# BibleQuest V5 Lab A1 — Incremental Vite Architecture Status

Lab identity: `BQ-V5-LAB-A1-INCREMENTAL`
Branch: `lab/v5-a1-incremental-vite`
Baseline origin: clean accepted V5 planning `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Status updated: 2026-09-13 JST

## Hypothesis

BibleQuest can reach V5 architecture quality through disciplined incremental evolution: preserve accepted V4 behavior while introducing a real Vite build graph, TypeScript-capable contracts, deterministic artifacts, route/domain lazy-loading seams, typed services and progressively migrated components. A clean-slate rewrite is not assumed necessary.

## Exact lab state inspected

- Starting lab HEAD for this run: `704a3335841f903d8c4e0897477a6f4d1b3a14a2`.
- Code/toolchain HEAD immediately before this status commit: `f73ea67c8a3b813740b2d9dd3238e1ffcbf8bb4b`.
- This status file is written as the final commit of the tranche; the branch HEAD containing this file is the authoritative run endpoint.

## Completed work

### Tranche 1 — non-invasive build/toolchain scaffold

- Added `package.json` with pinned Vite `8.2.2` and TypeScript `7.0.2` development dependencies.
- Pinned the supported Node floor to `>=22.12.0`.
- Added `vite.config.ts` with deterministic `dist/` output ownership, hashed JS/chunk/assets, manifest generation, source maps and an ES2022 build target.
- Added `tsconfig.json` for incremental TypeScript adoption: strict new TS boundaries, `allowJs` migration compatibility, no big-bang JS checking or emit.
- Added `node_modules/`, `dist/` and `*.tsbuildinfo` ignores.

### Tranche 2 — executable V4 static/PWA artifact contract

- Added `config/v5-static-artifacts.json` as the explicit list of root-URL artifacts that must remain stable across the Vite migration: web manifest, install icons, app icon and `sw.js`.
- Added dependency-free `scripts/v5-artifact-contract.mjs` to validate repository-relative path safety, root-copy uniqueness/existence, every local `index.html` href/src, manifest icon existence/root preservation, the stable service-worker URL, and the bootstrap source entry.
- Added `npm run check:artifact-contract` without changing application runtime behavior.
- Kept `index.html`, bootstrap/router/session, service worker behavior, feature modules, Supabase, storage and production deployment untouched.

## Validation / evidence

- Current `index.html` still owns the V4 page shell and imports `src/app/bootstrap.js` plus the existing CSS chain; root install/PWA resources include `manifest.webmanifest`, `app-icon.svg` and `pwa-icon-192.png`.
- Current `manifest.webmanifest` references four install icons; the artifact contract preserves all four referenced files at stable root paths.
- Current `sw.js` is a legacy service-worker retirement shim and still requires stable root availability for existing installs.
- The new checker was executed against a synthetic repository fixture using Node `v22.16.0`: positive fixture PASS; a negative fixture with a root icon removed from the copy contract failed as intended.
- A direct checkout of the real lab branch for exact repository execution was attempted but the execution container could not resolve `github.com`; therefore no claim is made that the checker has executed against the complete real checkout yet.
- A second `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` attempt timed out because registry access remains unavailable/too slow; no lockfile, `npm ci`, TypeScript or Vite build pass is claimed.
- Draft PR #187 remains open, draft, unmerged and targeted only to `main` for CI/preview evidence.

## Failures / blockers

1. Deterministic install remains incomplete because `package-lock.json` has not been generated and verified.
2. Vite build execution has not yet been proven on this branch.
3. The artifact copy **contract** now exists, but Vite does not yet implement that root-copy contract into `dist/`; implementation must follow only with build-level proof.
4. Exact checker execution against a complete checkout is pending because the execution container could not resolve GitHub for cloning.
5. Existing inherited workflows still assume the source-root V4 deployment/build model; this lab has not altered them yet.

These are bounded experimental gaps, not evidence that the incremental hypothesis has failed.

## Architecture decisions learned

- Vite + incremental TypeScript remains compatible with the existing direct-module entry model as a first migration seam; no framework rewrite is required to begin.
- Static/PWA parity is now separable into two classes: `src/` resources that belong to Vite's graph, and stable root-URL resources that require explicit artifact preservation. This gives the build migration a small auditable boundary instead of copying the entire repository.
- `manifest.webmanifest` and its referenced icon URLs must move together; hashing only one side would break install metadata.
- `sw.js` must retain its root URL while existing installs may still request it, even if V5 later replaces its strategy through a deliberate PWA migration.
- TypeScript should initially type new architecture/service boundaries only. Enabling `checkJs` globally would create broad migration noise and freeze incidental V4 implementation detail.
- Build migration must remain distinct from Reader/Games/state refactors until exact route/PWA parity is demonstrated.

## Known debt

- Missing lockfile and `npm ci` proof.
- No production-equivalent `dist/` artifact inventory/diff yet.
- Root-copy contract is characterized but not yet implemented in Vite.
- No route-level lazy imports yet.
- No typed service contract migrated yet.
- No V5-specific unit runner/lint command yet; add only after the basic build is executable.
- No bundle/image budgets until a production-equivalent build exists.

## Next 3 tasks

1. Generate and commit a deterministic lockfile, then run `npm ci`, `npm run typecheck`, `npm run check:artifact-contract` and `npm run build`; record exact results and artifact inventory.
2. Implement the smallest Vite-owned root-copy mechanism driven by `config/v5-static-artifacts.json`, then assert the built `dist/` preserves those exact URLs without copying repository-only docs/tests.
3. Add characterization around bootstrap/router/session and migrate one low-risk route/domain boundary to a typed lazy-loaded adapter, proving incremental code splitting without changing behavior.

## Viability

**VIABLE — CONTINUE.**

The experiment now has an executable boundary between Vite-owned module resources and stable root PWA/install artifacts. The remaining blocker is build execution and implementation proof, not an architectural requirement for a clean-slate rewrite.
