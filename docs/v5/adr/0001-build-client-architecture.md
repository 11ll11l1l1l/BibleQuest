# ADR-0001 — V5 Build and Client Architecture

Status: **PROPOSED**
Date: 2026-09-13
Supersedes: none

## Context

BibleQuest production currently has no `package.json` and no standard bundler/build graph. Browser modules are loaded directly, `build.sh`/validators protect static structure, large route owners render HTML imperatively, and there is no standard path for code splitting, typed contracts, CSS/asset processing or production source maps.

Reader and Games demonstrate the ceiling: both contain large route-level render/event owners that are risky to decompose while everything remains hand-wired browser JavaScript.

V5 explicitly permits architecture changes and needs a migration platform before those feature rewrites.

## Proposed decision

1. Adopt **Vite** as the V5 development/build system.
2. Adopt **TypeScript** for new V5 architecture contracts and migrated modules.
3. Allow legacy JavaScript temporarily through an incremental migration configuration; do not require a big-bang TS conversion.
4. Build deployable production artifacts into a deterministic output directory and preserve exact-SHA Cloudflare release verification.
5. Establish route/domain lazy-loading boundaries.
6. Move CSS/assets/images under the build pipeline while preserving current visuals during infrastructure migration.
7. Choose the UI component technology only after a short migration spike compares the smallest credible options against the existing DOM-heavy code. Vite + TypeScript does not require adopting a large UI framework.
8. Keep domain logic independent of the chosen view technology wherever practical.

## Alternatives considered

### Keep native unbundled ES modules

Rejected as the V5 default because it preserves the exact limitations V5 is intended to remove: no standard dependency graph/toolchain, weaker refactor ergonomics, no first-class type/build pipeline and limited asset/code-splitting infrastructure.

### Full immediate framework rewrite

Rejected. It would combine build migration, state migration, component rewrite and feature rewrite into one high-risk event. V5 should still migrate one owner at a time.

### Vite + mandatory React-style full app rewrite

Not selected at this stage. The existing codebase is DOM/service oriented; framework choice should be justified by migration evidence, bundle/performance cost and testing ergonomics rather than popularity.

## Consequences

- `package.json`/lockfile become release-relevant inputs.
- Dependency/security scanning becomes possible and necessary.
- Cloudflare configuration/workflows must deploy built output rather than assuming source-root static files.
- Deep routes/PWA/service-worker paths must be explicitly preserved.
- Existing validators need adaptation to inspect source and/or built output intentionally.
- TypeScript migration can proceed at domain boundaries without blocking untouched legacy modules.

## Migration

1. Add toolchain without changing runtime behavior.
2. Produce Vite build equivalent to current app.
3. Run current route/browser/security/PWA suite against built output.
4. Move entry/bootstrap ownership into typed V5 shell.
5. Migrate feature modules sequentially.
6. Remove old direct-entry assumptions only after parity is proven.

## Required evidence before ACCEPTED implementation is considered complete

- deterministic install/build in CI;
- route/deep-link parity;
- auth/session startup parity;
- Cloudflare exact-SHA preview deployment from build output;
- PWA install/offline/recovery baseline not regressed;
- first migrated feature proves typed domain/view boundary;
- bundle/chunk report available.

## Rollback

Until V5 production promotion, V4 `main`/archive remains the rollback reference. During V5 migration, compatibility adapters may keep legacy modules callable from the V5 shell; old entry architecture is not removed until equivalent built behavior is green.
