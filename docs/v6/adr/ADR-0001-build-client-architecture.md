# ADR-0001 — V6 build/client architecture

Status: ACCEPTED
Date: 2026-09-18
Supersedes: none

## Context

BibleQuest V5 is released at `f6a0cff0e63ddf676b77b8470d84678958fe9d70`. The current application is a working browser-first JavaScript codebase with a large inherited regression suite. V6 must modernize the build and module boundaries without using the migration as a reason to rewrite working product behavior.

## Decision

V6 will adopt Vite as the deterministic client build/dev pipeline and introduce TypeScript incrementally at new architecture boundaries.

- Existing JavaScript remains valid during migration.
- New durable architecture contracts should prefer TypeScript.
- Legacy modules move behind typed boundaries before large rewrites.
- The build must emit a deterministic deployable `dist/` artifact with exact source/build identity.
- Deep links, authentication startup, service-worker registration, installability and accepted V5 routes must remain behavior-compatible during migration.
- Route/domain code splitting is introduced where it materially reduces startup cost.
- CSS/assets/images become build-owned without changing product appearance merely for migration.
- Typecheck, lint, unit, build and parity gates become normal CI commands.
- No framework-wide UI rewrite is required by this ADR.

## Alternatives considered

1. Keep the hand-wired browser-script build indefinitely — rejected because it preserves the current module/tooling ceiling.
2. Rewrite the application in one pass — rejected because regression and integration risk are too high.
3. Introduce a different UI framework as a prerequisite — rejected; V6 needs a build/kernel upgrade, not a forced page rewrite.

## Consequences

The migration can proceed in bounded slices while preserving V5 behavior. For a period, JavaScript and TypeScript will coexist. The repository gains package/toolchain ownership and generated build artifacts.

## Migration

1. Add package metadata, lockfile and pinned supported Node toolchain.
2. Add Vite with a production-equivalent build entry.
3. Preserve current app startup and deep-link behavior.
4. Add TypeScript configuration that permits staged JS migration.
5. Establish typed shell/session/router/data contracts.
6. Migrate low-risk slices first.
7. Remove legacy build paths only after parity evidence.

## Required evidence

- deterministic install/build;
- exact build identity;
- inherited V5 static/security gates green;
- critical route/auth/deep-link browser parity;
- PWA/install/offline behavior retained;
- no new client secret exposure.

## Rollback

Until the V6 build is certified, the released V5 build path remains the rollback reference. New Vite/TypeScript boundaries must be introduced in revertible tranches.
