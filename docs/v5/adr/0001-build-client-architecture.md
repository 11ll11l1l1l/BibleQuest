# ADR-0001 — V5 Build and Client Architecture

Status: **ACCEPTED**
Date: 2026-09-13
Decision accepted from evidence: 2026-09-13
Supersedes: none

## Context

BibleQuest production currently has no `package.json` and no standard bundler/build graph. Browser modules are loaded directly, `build.sh`/validators protect static structure, large route owners render HTML imperatively, and there is no standard path for code splitting, typed contracts, CSS/asset processing or production source maps.

Reader and Games demonstrate the ceiling: both contain large route-level render/event owners that are risky to decompose while everything remains hand-wired browser JavaScript.

V5 explicitly permits architecture changes and needs a migration platform before those feature rewrites.

The temporary V5 architecture labs supplied two useful but intentionally non-authoritative evidence sets:

- the incremental Vite lab showed that stable-root PWA/install artifacts, router/session/bootstrap behavior and build-output intent can be characterized independently before replacing runtime owners; its dependency-free CI passed after one over-broad characterization assertion was corrected without changing production runtime behavior;
- the greenfield lab showed that a typed shell, lazy routes, explicit session/congregation contexts and repository contracts are technically viable, but it remained far from product parity and did not prove deterministic install, a production Vite build, browser/PWA parity or real database-backed operation.

Both experiments were blocked from proving a real deterministic Vite build because they did not obtain a verified dependency lock/install. That missing implementation evidence does not invalidate the build-system choice, but it remains a Phase 1 gate and must not be represented as complete.

## Decision

1. Adopt **Vite** as the V5 development/build system.
2. Adopt **TypeScript** for all new V5 architecture contracts and migrated modules.
3. Migrate incrementally from the accepted V4 runtime rather than performing a clean-slate application replacement. Legacy JavaScript may remain temporarily behind explicit compatibility boundaries; no big-bang TypeScript conversion is required.
4. Introduce the toolchain before replacing feature behavior. The first production-equivalent Vite output must preserve the accepted V4 route matrix, session/bootstrap semantics, deep links, static/PWA install paths and critical browser flows.
5. Produce deterministic deployable artifacts from a lockfile-backed install into an explicit build output directory. Release/build identity must remain attributable to the exact source SHA.
6. Treat source-side deployment intent and built-output correctness as separate contracts. Stable-root files such as the web manifest, service-worker URL and install icons must be explicitly owned rather than incidentally copied with the repository.
7. Establish route/domain lazy-loading boundaries progressively. Do not create a second competing router, session owner or bootstrap path during migration.
8. Begin TypeScript at new service/domain/repository/platform boundaries. Untouched legacy JavaScript must not be globally converted merely to satisfy the migration.
9. Move CSS/assets/images under the build pipeline progressively while preserving visual behavior during infrastructure-only migration.
10. Keep domain and data-access contracts independent of the chosen view technology wherever practical.
11. Do **not** mandate React, Preact or another full UI framework as part of this ADR. Lightweight components, Web Components, framework-free typed views or a small framework may be selected later only when a bounded migration spike demonstrates lower ownership complexity, acceptable bundle/runtime cost and stronger testability for the affected surface.
12. Preserve server-side authorization and privacy boundaries unchanged by the build migration. No privileged credential or authorization decision may move into the client bundle.

## Why incremental evolution is selected over greenfield replacement

The greenfield experiment demonstrated useful architectural patterns, especially typed route context, separated identity/tenant ownership, lazy feature loading and transport-independent repositories. Those patterns may be selectively re-implemented in the coordinated V5 stream.

It did not demonstrate product parity: most production routes/features remained missing or partial, real auth/backend/PWA operation was not connected, and deterministic build/browser evidence was still absent. Replacing the production client wholesale would therefore combine build migration, route/session cutover, state ownership changes and feature parity recovery into one risk surface.

The incremental experiment, by contrast, demonstrated that deployment artifacts and core bootstrap/router/session behavior can be characterized before replacement, allowing one owner at a time to move behind typed boundaries while preserving the accepted runtime as a rollback reference. Its artifact/build ideas are evidence only; lab code must not be bulk-merged.

Therefore V5 adopts a **typed incremental replacement strategy on Vite**, while remaining free to redesign individual migrated modules substantially once their behavior/security contracts are characterized.

## Alternatives considered

### Keep native unbundled ES modules

Rejected as the V5 default because it preserves the exact limitations V5 is intended to remove: no standard dependency graph/toolchain, weaker refactor ergonomics, no first-class type/build pipeline and limited asset/code-splitting infrastructure.

### Clean-slate typed client replacement

Rejected as the coordinated product migration strategy. The greenfield spike proved architectural viability but not enough parity or operational evidence to justify replacing the accepted V4 runtime in one cutover. Useful greenfield boundaries may still be re-implemented incrementally.

### Full immediate framework rewrite

Rejected. It would combine build migration, state migration, component rewrite and feature rewrite into one high-risk event.

### Vite + mandatory React-style full app rewrite

Rejected by this ADR. The existing codebase is DOM/service oriented, and neither lab supplied evidence that a mandatory framework rewrite is superior to typed incremental boundaries. Framework/component technology remains a later bounded decision.

## Consequences

- `package.json` and the committed lockfile become release-relevant inputs.
- Node/package-manager versions must be pinned or otherwise made deterministic for CI and release tooling.
- Dependency/security scanning becomes possible and necessary.
- Cloudflare preview/release workflows eventually must deploy built output rather than assuming source-root static files.
- Deep routes, PWA installation URLs and service-worker paths must be explicitly preserved and tested.
- Existing validators must intentionally distinguish source contracts from built-output contracts.
- TypeScript migration can proceed at domain/platform boundaries without blocking untouched legacy modules.
- Route-level code splitting becomes available, but chunking must be measured rather than maximized blindly.
- Bundle/chunk/image budgets are added only after a production-equivalent bundle exists.
- The accepted V4 runtime remains the behavior reference until each migrated owner has parity evidence or an explicit later ADR changes the contract.

## Phase 1 migration order

1. Add package manager metadata, committed lockfile and pinned supported Node/toolchain versions.
2. Add Vite and TypeScript-capable configuration with legacy-JS compatibility.
3. Define explicit source and stable-root static/PWA artifact ownership.
4. Produce deterministic `dist/` output and built-output validation.
5. Run current static/security/route/session/PWA/browser evidence against the built application and repair migration defects without weakening valid tests.
6. Record initial bundle/chunk/asset inventory and budgets.
7. Introduce typed platform/service boundaries behind the existing authoritative bootstrap/router/session path.
8. Add route/domain lazy loading where the measured startup/bundle result justifies it.
9. Migrate one low-risk feature end-to-end before Reader/Games or another high-risk owner.
10. Remove old direct-entry/legacy ownership only after no live route depends on it and parity evidence is accumulated-green.

## Required Phase 1 evidence

Acceptance of this ADR authorizes the architecture direction; it does **not** claim the implementation is complete. Phase 1 still requires executable proof of:

- deterministic lockfile-backed install and production build in CI;
- committed Node/package-manager/tool versions suitable for reproducible development and CI;
- exact-SHA build/release identity;
- route and deep-link parity against built output;
- auth/session/bootstrap startup parity;
- explicit stable-root manifest/service-worker/install-icon preservation;
- PWA installation and current offline/recovery baseline not regressed;
- privacy/security gates against the built client;
- browser evidence for routing/session/PWA changes;
- a first migrated feature demonstrating typed domain/data/view boundaries without duplicate ownership;
- bundle/chunk/asset report with enforceable initial budgets;
- source maps suitable for privacy-safe diagnostics without shipping secrets or privileged configuration.

Pending, skipped or environment-unavailable checks are not PASS.

## Rollback

Until V5 production promotion, V4 `main`/archive remains the production rollback reference. During migration, compatibility adapters may keep legacy modules callable from the V5 shell. The old entry/runtime owner is not removed until the Vite-built path has equivalent-or-stronger automated/browser evidence and a manual production promotion decision is made.
