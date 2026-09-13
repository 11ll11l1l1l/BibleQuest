# BibleQuest V5 Lab A1 — Incremental Vite Architecture Status

Lab identity: `BQ-V5-LAB-A1-INCREMENTAL`
Branch: `lab/v5-a1-incremental-vite`
Baseline origin: clean accepted V5 planning `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Status updated: 2026-09-13 JST

## Hypothesis

BibleQuest can reach V5 architecture quality through disciplined incremental evolution: preserve accepted V4 behavior while introducing a real Vite build graph, TypeScript-capable contracts, deterministic artifacts, route/domain lazy-loading seams, typed services and progressively migrated components. A clean-slate rewrite is not assumed necessary.

## Exact lab state inspected

- Starting lab HEAD for this run: `9b3da6471dafd5f191398c3152283cb899adfaf5`.
- The branch HEAD containing this status file is the authoritative endpoint for this run.

## Completed work

### Tranche 1 — non-invasive build/toolchain scaffold
- Pinned Vite `8.2.2`, TypeScript `7.0.2`, Node `>=22.12.0`, deterministic `dist/` naming and strict TypeScript for new boundaries with `allowJs` migration compatibility.

### Tranche 2 — executable V4 static/PWA artifact contract
- Added `config/v5-static-artifacts.json` and source-side contract validation without changing runtime behavior.

### Tranche 3 — contract-driven Vite root artifact emission
- Added one dependency-free implementation owner for stable-root copies, reused by Vite and a standalone CLI, with path safety and byte verification.

### Tranche 4 — built-output parity validator
- Added `scripts/v5-built-output-contract.mjs` plus `scripts/v5-check-built-output.mjs`.
- Added `npm run check:built-output`.
- The validator requires emitted `index.html`, verifies every local `href`/`src` resolves inside `dist/`, requires `.vite/manifest.json` and at least one emitted entry chunk, validates entry JS/CSS files, validates web-manifest icon targets, and byte-compares every declared stable-root artifact against its source.
- No router, session, Reader, Games, Supabase, storage, service-worker runtime behavior, or production configuration changed.

## Validation / evidence

- `node --check` passed for both new validator modules under Node `v22.16.0`.
- Synthetic production-like fixture passed with an emitted HTML entry, Vite manifest, JS/CSS entry assets, web manifest, icon and stable-root artifacts.
- Negative fixture with a referenced CSS asset removed failed as intended with `missing index reference` and non-zero exit.
- A fresh `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` attempt timed out after 180 seconds, so deterministic install and real Vite build are still not claimed.
- No production or Supabase state was touched.

## Failures / blockers

1. Deterministic install remains incomplete because `package-lock.json` has not been generated and verified; registry access timed out again this run.
2. Vite build execution has not yet been proven on the exact lab branch.
3. The built-output validator is validated synthetically but cannot be exercised against a real `dist/` until dependency installation succeeds.
4. Existing inherited workflows still assume the source-root V4 deployment/build model.
5. ADR-0001 remains `PROPOSED`; this disposable lab is evidence for the decision, not approval of it.

## Architecture decisions learned

- Source-side artifact validation and built-output validation should remain separate: the former protects deployment intent; the latter proves what Vite actually emitted.
- A real build can be rejected when HTML points at missing assets, Vite manifest entries are incomplete, PWA icons are absent, or stable-root files drift from source, without coupling validation to application feature code.
- The incremental architecture can continue hardening its deployment boundary independently of router/session/domain migration.
- TypeScript migration should still begin at new architecture/service boundaries rather than globally checking legacy JS.

## Known debt

- Missing lockfile and `npm ci` proof.
- No exact Vite production build or real `dist/` inventory yet.
- No route-level lazy imports yet.
- No typed service contract migrated yet.
- No V5-specific unit runner/lint command yet.
- No bundle/image budgets until a production-equivalent build exists.

## Next 3 tasks

1. Obtain deterministic dependency installation; run `npm ci`, artifact contract, typecheck, production build and the new built-output validator against the real repository.
2. Once the real build passes, record artifact/bundle inventory and establish initial JS/CSS/image budgets without weakening V4 behavior.
3. Add bootstrap/router/session characterization and migrate one low-risk route/domain boundary to a typed lazy-loaded adapter only after build parity is demonstrated.

## Viability

**VIABLE — CONTINUE.**

The incremental experiment now has an auditable source contract, a single build-emission owner and an independent built-output parity gate. Registry availability remains the principal external blocker to full build proof; it is not evidence that the incremental architecture is inferior.
