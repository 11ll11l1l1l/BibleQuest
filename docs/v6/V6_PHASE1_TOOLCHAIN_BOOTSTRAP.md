# V6 Phase-1 Toolchain Bootstrap

Status: initial bounded bootstrap
Branch owner: manual/on-demand integration tranche
Production impact: none until the V6 build is separately certified and deployment is deliberately switched

## Purpose

Introduce the first deterministic V6 build/tooling boundary without changing the released V5 production deployment path.

This tranche adds:

- an exact Node 22 LTS pin shared by `.nvmrc` and `package.json`;
- exact Vite and TypeScript versions in `package.json`;
- a strict incremental TypeScript boundary under `src/v6/` while legacy JavaScript remains allowed during migration;
- a Vite shadow build in `dist-v6/`;
- an exact build-SHA injection point;
- `bq-build.json` build identity metadata;
- a compatibility-copy layer for the existing top-level V5 runtime files plus `assets/`, `data/`, and `kids-games/`;
- a dependency-free toolchain smoke check.

## Safety boundary

The existing release workflow and current V5 production path remain unchanged. This bootstrap does **not** claim route/browser/PWA parity and does **not** switch Pages or Cloudflare deployment to `dist-v6/`.

The compatibility-copy layer exists so the Vite migration can be proven incrementally instead of requiring an immediate rewrite of the legacy script graph.

## Required next work

A1 must complete this Phase-1 slice by:

1. generating and committing the deterministic npm lockfile in an npm-connected environment;
2. running `npm ci`, `npm run check:v6-toolchain`, `npm run typecheck`, and `npm run build`;
3. validating the built output against inherited V5 static tests;
4. adding CI for install/typecheck/build/unit gates;
5. running Chromium browser parity against the built output;
6. proving deep links, auth startup, PWA install/offline shell behavior, and required narrow-phone widths;
7. adding bundle/chunk/image budgets;
8. only then proposing a deployment-path change.

Do not mark the corresponding V6 acceptance checklist items complete until those proofs exist.
