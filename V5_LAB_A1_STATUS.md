# BibleQuest V5 Lab A1 — Incremental Vite Architecture Status

Lab identity: `BQ-V5-LAB-A1-INCREMENTAL`
Branch: `lab/v5-a1-incremental-vite`
Baseline origin: clean accepted V5 planning `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Status updated: 2026-09-13 JST

## Hypothesis

BibleQuest can reach V5 architecture quality through disciplined incremental evolution: preserve accepted V4 behavior while introducing a real Vite build graph, TypeScript-capable contracts, deterministic artifacts, route/domain lazy-loading seams, typed services and progressively migrated components. A clean-slate rewrite is not assumed necessary.

## Exact lab state inspected

- Starting lab HEAD for this run: `83e62e074003bd68e1e38c7414be71494e1ab3f8`.
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

### Tranche 5 — dependency-free router/session characterization
- Added `tests/v5-incremental-runtime-boundaries.test.mjs` using Node's built-in test runner; no package installation is required.
- Characterized router default-home startup, not-found fallback, centralized navigation-request ownership, verified authenticated session publication, expired-session fail-closed behavior, and sign-out cleanup ordering.
- Added `npm run test:v5-boundaries`.
- Added `.github/workflows/v5-lab-a1-boundaries.yml` for exact-revision dependency-free CI on this isolated lab branch/draft PR.
- No router, session, Reader, Games, Supabase, storage or production runtime implementation was changed.

## Validation / evidence

- Previous built-output validator syntax/synthetic positive/negative fixture checks remain recorded from Tranche 4.
- Dependency-free GitHub Actions run `34734662501` executed on exact head `bdce1ab18a7dfbfd5a901a4752dcb4529282a9ed` using Node `22.16.0` and completed successfully.
- In that run, `node scripts/v5-artifact-contract.mjs` passed.
- In that run, `node --test tests/v5-incremental-runtime-boundaries.test.mjs` passed.
- The local execution container still cannot resolve `github.com`, so local checkout execution was unavailable; GitHub Actions is the authoritative executable proof for this tranche.
- Deterministic dependency installation and a real Vite production build remain unproven because no verified `package-lock.json` exists yet.
- No production or Supabase state was touched.

## Failures / blockers

1. Deterministic install remains incomplete because `package-lock.json` has not been generated and verified; registry access has repeatedly timed out from the available execution environment.
2. Vite build execution has not yet been proven on the exact lab branch.
3. The built-output validator is validated synthetically but cannot be exercised against a real `dist/` until dependency installation succeeds.
4. Existing inherited workflows still assume the source-root V4 deployment/build model; the lab-specific workflow is intentionally isolated evidence, not a production CI replacement.
5. ADR-0001 remains `PROPOSED`; this disposable lab is evidence for the decision, not approval of it.

## Architecture decisions learned

- Source-side artifact validation and built-output validation should remain separate: the former protects deployment intent; the latter proves what Vite actually emitted.
- Router and session behavior can be characterized with dependency-free executable tests before migration, reducing the risk of introducing parallel navigation/session ownership during incremental decomposition.
- The current router contract is small enough to preserve explicitly while changing how route modules are loaded later.
- Session migration must preserve fail-closed expiry handling, sanitized user publication and pre-sign-out cleanup ordering; these are behavioral/security contracts, not implementation details.
- The incremental architecture can continue hardening runtime seams independently of the blocked package-install path.
- TypeScript migration should still begin at new architecture/service boundaries rather than globally checking legacy JS.

## Known debt

- Missing lockfile and `npm ci` proof.
- No exact Vite production build or real `dist/` inventory yet.
- No bootstrap ownership characterization yet.
- No route-level lazy imports yet.
- No typed service contract migrated yet.
- No general V5 lint/unit harness beyond the dependency-free boundary suite.
- No bundle/image budgets until a production-equivalent build exists.

## Next 3 tasks

1. Obtain deterministic dependency installation; run `npm ci`, artifact contract, typecheck, production build and the built-output validator against the real repository.
2. Once the real build passes, record artifact/bundle inventory and establish initial JS/CSS/image budgets without weakening V4 behavior.
3. Add bootstrap ownership characterization, then introduce one low-risk lazy-loaded typed route/domain adapter while retaining the characterized router/session contracts.

## Viability

**VIABLE — CONTINUE.**

The incremental experiment now has executable pre-migration contracts around its deployment artifacts plus the two highest-risk central runtime seams, router and session. The remaining package-registry blocker limits real Vite build proof but no longer prevents useful architecture-safety progress.
