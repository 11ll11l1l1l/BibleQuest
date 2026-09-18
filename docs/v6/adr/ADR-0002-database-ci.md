# ADR-0002 — Reproducible Supabase/Postgres database CI

Status: ACCEPTED
Date: 2026-09-18
Supersedes: none

## Context

V5 contains strong static SQL/security guards and production-proven behavior, but V6 requires executable database authorization evidence. The project owner does not want additional paid infrastructure. CI must never rely on destructive testing against production.

## Decision

V6 will use reproducible ephemeral/local Supabase/Postgres infrastructure for database CI wherever supported by the repository runner.

- Production credentials and production data are never required for normal database CI.
- Migrations must replay from zero in an isolated disposable environment.
- Deterministic fixtures must include at least two congregations plus member, ministry-role and platform-privileged identities required by the test matrix.
- RLS allow/deny, grants/revokes, function security mode and cross-congregation isolation must be executed as realistic callers.
- Generated database types must be reproducible and drift-detectable.
- Existing static SQL checks remain fast guards but are not the sole V6 database proof.
- No paid Supabase project is required by this ADR.
- If hosted non-production infrastructure is later used, it must be explicitly approved and isolated from production.

## Alternatives considered

1. Test against production — rejected as unsafe.
2. Require a second paid hosted Supabase project — rejected as unnecessary and contrary to project constraints.
3. Keep static SQL inspection only — rejected because it cannot fully prove runtime authorization behavior.

## Consequences

Database CI will require local/ephemeral service startup and deterministic fixture management. Some CI jobs will be heavier, but they will provide executable security evidence without production mutation.

## Migration

1. Check in local Supabase configuration needed for reproducible startup.
2. Prove clean migration replay.
3. Add deterministic two-congregation fixtures.
4. Add executable RLS/function/grant tests.
5. Add generated-type drift checks.
6. Preserve static SQL guards as fast prechecks.
7. Expand domain coverage as V6 repository boundaries migrate.

## Required evidence

- zero-to-current migration replay;
- no production credential requirement;
- deterministic fixtures;
- cross-tenant denial tests;
- function/grant/search-path assertions;
- generated type drift failure;
- clean teardown/disposable state.

## Rollback

Database CI additions are tooling-only until a separately reviewed schema migration is introduced. Any migration that changes production schema remains independently reviewable and reversible under the existing migration policy.
