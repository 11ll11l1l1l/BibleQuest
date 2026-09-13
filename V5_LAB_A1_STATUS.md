# BibleQuest V5 Lab A1 — Incremental Vite Architecture Status

Lab identity: `BQ-V5-LAB-A1-INCREMENTAL`
Branch: `lab/v5-a1-incremental-vite`
Baseline origin: clean accepted V5 planning `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Status updated: 2026-09-13 JST

## Hypothesis

BibleQuest can reach V5 architecture quality through disciplined incremental evolution: preserve accepted V4 behavior while introducing a real Vite build graph, TypeScript-capable contracts, deterministic artifacts, route/domain lazy-loading seams, typed services and progressively migrated components. A clean-slate rewrite is not assumed necessary.

## Exact lab state inspected

- Starting lab HEAD for this run: `9e4cf34d5bca508c7a8782d4fe3ad8cd98679aee`.
- Bootstrap-test repair commit validated by isolated CI: `40489aa5e916ce90accdaa8b4c36a83aa8538f68`.
- The branch HEAD containing this status file is the authoritative endpoint for this run.
- Persistent draft evidence PR: `#187`, `[LAB ONLY][DO NOT MERGE] V5 A1 incremental architecture`, targeting `main` only for CI/preview evidence.

## Completed work

### Tranche 1 — non-invasive build/toolchain scaffold
- Pinned Vite `8.2.2`, TypeScript `7.0.2`, Node `>=22.12.0`, deterministic `dist/` naming and strict TypeScript for new boundaries with `allowJs` migration compatibility.

### Tranche 2 — executable V4 static/PWA artifact contract
- Added `config/v5-static-artifacts.json` and source-side contract validation without changing runtime behavior.

### Tranche 3 — contract-driven Vite root artifact emission
- Added one dependency-free implementation owner for stable-root copies, reused by Vite and a standalone CLI, with path safety and byte verification.

### Tranche 4 — built-output parity validator
- Added built-output validation for emitted HTML references, Vite manifest entries, web-manifest icons and byte-equivalent stable-root artifacts.

### Tranche 5 — dependency-free router/session characterization
- Added executable characterization for router default/fallback/navigation ownership and session authenticated publication, expiry fail-closed behavior and cleanup-before-sign-out ordering.
- Added the isolated lab CI workflow using Node `22.16.0`.

### Tranche 6 — bootstrap composition-root characterization
- Added `tests/v5-bootstrap-ownership-characterization.test.mjs` without changing runtime code.
- Characterizes one guarded startup owner/actionable startup failure UI, fail-closed initial session state, one route table/one router construction, shell-before-router ordering, non-blocking offline/session startup after initial route delivery, and centralized pagehide disposal of stateful owners.
- Extended `.github/workflows/v5-lab-a1-boundaries.yml` so this characterization runs in dependency-free CI.

### Tranche 7 — characterization reliability repair
- Investigated the exact-head failure of the new bootstrap characterization rather than adding migration code on top of a red boundary gate.
- Root cause: the test pattern `/\bstart\(\);/g` also matched the `start();` suffix inside `router.start();`, so a valid router method call was incorrectly counted as a second direct bootstrap-owner invocation.
- Replaced the assertion with `/(?<![\w$.])start\(\);/g`, which distinguishes the direct bootstrap owner call from member-method starts while preserving the intended single-start-owner contract.
- No production/runtime code changed.

## Validation / evidence

- Exact fix commit `40489aa5e916ce90accdaa8b4c36a83aa8538f68`: `V5 Lab A1 Boundary Characterization` run `#12` completed **SUCCESS**.
- In that exact run the source artifact contract, router/session characterization and repaired bootstrap ownership characterization all completed successfully.
- On the same fix commit, the V4 Section I security/privacy gate and Phase 6 field-evidence gate had already completed successfully when status was recorded; several broader inherited workflows were still in progress and are not claimed as passed here.
- Previous failed run on `9e4cf34d5bca508c7a8782d4fe3ad8cd98679aee` was isolated to the bootstrap-characterization step; source artifact and router/session checks passed before it.
- Deterministic dependency installation and a real Vite production build remain unproven because no verified `package-lock.json` exists yet.
- No production, Cloudflare production, Supabase state, database schema, router/session runtime or feature implementation was changed.

## Failures / blockers

1. Deterministic install remains incomplete because `package-lock.json` has not been generated and verified; registry access has repeatedly timed out from the available execution environment.
2. Vite build execution has not yet been proven on the exact lab branch.
3. The built-output validator is validated synthetically but cannot be exercised against a real `dist/` until dependency installation succeeds.
4. Existing inherited workflows still assume the source-root V4 deployment/build model; the lab workflow is isolated experimental evidence, not a production CI replacement.
5. ADR-0001 remains `PROPOSED`; this disposable lab supplies evidence for that decision and does not approve it.

## Architecture decisions learned

- Characterization gates themselves need root-cause review when red; a false-positive test must be narrowed to the intended contract rather than freezing unrelated implementation details.
- Direct bootstrap ownership and service lifecycle methods are distinct contracts. Tests should recognize one naked bootstrap `start()` owner without constraining legitimate `router.start()` or other service starts.
- Source-side artifact validation and built-output validation should remain separate: one protects deployment intent and the other proves actual build output.
- Router, session and bootstrap ownership can be characterized with dependency-free executable tests before migration, reducing the risk of accidentally creating parallel owners during incremental decomposition.
- Bootstrap currently acts as the composition root for service construction, route ownership, shell wiring, startup sequencing and teardown. V5 can split loading/composition incrementally if it keeps one authoritative startup/navigation/session path.
- Initial route delivery is intentionally not blocked on offline-shell or remote session boot; lazy-loading and typed shell work should preserve useful startup rather than serializing all async initialization.
- Session migration must preserve fail-closed expiry handling, sanitized user publication and pre-sign-out cleanup ordering.
- TypeScript migration should begin at new architecture/service boundaries rather than globally checking legacy JS.

## Known debt

- Missing lockfile and `npm ci` proof.
- No exact Vite production build or real `dist/` inventory yet.
- No route-level lazy imports yet.
- No typed service contract migrated yet.
- No general V5 lint/unit harness beyond dependency-free lab characterization.
- No bundle/image budgets until a production-equivalent build exists.

## Next 3 tasks

1. Obtain deterministic dependency installation; run `npm ci`, artifact contract, typecheck, production build and built-output validation against the real repository.
2. Once a real build passes, record artifact/bundle inventory and establish initial JS/CSS/image budgets.
3. Introduce one low-risk typed lazy-loaded route/domain adapter behind the characterized bootstrap/router/session contracts, preserving one authoritative route owner and rollback compatibility.

## Viability

**VIABLE — CONTINUE.**

The incremental experiment now has green dependency-free CI around deployment intent plus router, session and bootstrap ownership after correcting an over-broad characterization assertion. The failure provided useful evidence that the characterization layer can be repaired without changing accepted V4 runtime behavior. The unresolved package-registry path still blocks real Vite artifact proof, but it does not currently invalidate the incremental architecture hypothesis.
