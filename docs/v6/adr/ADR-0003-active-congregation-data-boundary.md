# ADR-0003 — Active-congregation context and tenant-scoped data boundary

Status: ACCEPTED
Date: 2026-09-18
Supersedes: none

## Context

BibleQuest V5 has a working congregation-membership owner that keeps the active congregation in memory, defaults to the first valid loaded membership, preserves a still-valid active selection on reload, rejects switching to a congregation outside the authenticated user's memberships, and clears effective context on account change/sign-out.

V6 needs this behavior to become a reusable kernel contract. Tenant selection must remain separate from authentication identity, and UI visibility must never become authorization. V6 also needs a way to stop an in-flight request from committing stale data after the user changes congregation.

## Decision

V6 will use an explicit tenant-context boundary with these rules:

- authenticated user identity and active congregation are separate values;
- membership rows are the only client-side source from which an active congregation may be selected;
- a tenant-scoped repository request carries an explicit immutable {userId, congregationId, generation} scope;
- changing identity, active congregation, or the effective membership set advances the tenant generation;
- results created under an older generation must be rejected as stale before they mutate durable/view state;
- repository contracts accept tenant scope explicitly instead of reading an implicit global congregation;
- server authorization and RLS remain authoritative for every protected action;
- the V5 first-valid-membership fallback is preserved during migration for behavior parity;
- active-congregation persistence, if introduced later, is only a preference hint and must be revalidated against current authenticated memberships before use;
- tenant switching must not carry queued writes, cached sensitive data, or in-flight commits across identities or congregations.

Per-key AbortController request coordination is the default client primitive for superseding stale work. Safe application failures use a small privacy-safe taxonomy rather than surfacing arbitrary backend error strings.

## Alternatives considered

1. Continue allowing each feature to choose a congregation independently — rejected because stale and cross-tenant state becomes difficult to reason about and test.
2. Put identity, role and congregation into one large global store — rejected because it broadens invalidation and coupling.
3. Persist an active congregation id and trust it on startup — rejected because local persistence is not membership authority.
4. Rely only on server RLS without client tenant scope — rejected because RLS is necessary for security but does not prevent stale or confusing cross-tenant client state.

## Consequences

New V6 tenant-sensitive repositories gain explicit scope parameters. Existing V5 features can continue operating through compatibility adapters until migrated. Some calls become slightly more verbose, but their tenant dependency becomes testable and visible.

A tenant generation token can invalidate work even when the same user remains authenticated. Feature owners must handle stale/cancelled work as a normal state rather than treating it as a user-facing server failure.

## Migration

1. Introduce the typed tenant context, request coordinator, async state and repository contracts alongside V5 owners.
2. Characterize each feature before migration.
3. Adapt one low-risk feature to consume an explicit tenant scope.
4. Require explicit congregation scope for new tenant-sensitive V6 repositories.
5. Migrate assignments, notifications, presence, groups/teams, media and ministry/admin incrementally.
6. Remove implicit congregation fallback inside migrated repository implementations only after parity tests are green.
7. Keep server RLS/authorization evidence as a separate mandatory gate.

## Required evidence

- V5 active-congregation selection regressions remain green;
- account switch/sign-out cannot retain prior tenant authority;
- non-member congregation selection fails closed;
- tenant generation invalidates stale request scopes;
- superseded same-key requests cannot commit stale results;
- cross-congregation RLS/database tests remain mandatory;
- browser tests prove tenant switching clears or refreshes affected feature state before final migration acceptance.

## Rollback

The new kernel is additive until migrated features explicitly consume it. If a migration tranche fails parity, the feature can return to its existing V5 congregation owner without removing this ADR or weakening server authorization.
