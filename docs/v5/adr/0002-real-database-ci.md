# ADR-0002 — Executable Supabase/Postgres CI

Status: **PROPOSED**
Date: 2026-09-13
Supersedes: none

## Context

BibleQuest already has `supabase/schema.sql`, a migrations directory and Edge Functions, and V4 added extensive RLS/privacy/function hardening. However, the V4 Section I workflow executes static/security JavaScript checks and edge tests; it does not start a real database, apply the migration chain and assert RLS/function behavior as actual database callers.

There is also no checked-in `supabase/config.toml` local-project definition on the production baseline. V4 therefore relied on static inspection plus selected live/manual verification for database security behavior. Cross-congregation field evidence was additionally constrained by production having only one populated congregation.

V5 must remove this confidence gap.

## Proposed decision

1. Use the **Supabase CLI local stack** in development/CI, backed by ephemeral Postgres services managed by the supported Supabase tooling.
2. Check in the local Supabase project configuration needed to reproduce the schema/functions locally.
3. Treat the ordered migration chain as the primary database build path; test it from an empty database.
4. Add deterministic seed/test topology with at least two populated congregations and the role/account combinations required for authorization testing.
5. Execute RLS and function assertions against the real local database under realistic caller identities/claims.
6. Use SQL/pgTAP or a small purpose-built SQL integration harness for policy/function assertions; JavaScript may orchestrate tests but must not replace database execution with text matching.
7. Generate TypeScript database types from the tested schema and detect drift.
8. Keep fast static SQL/security tests as supplemental guards.

## Minimum deterministic topology

The fixture set must be reproducible and disposable, never copied from production. It should include:

- Congregation A and Congregation B;
- ordinary members unique to each congregation;
- at least one multi-membership user where product behavior supports it;
- facilitator/leader/pastor/admin memberships needed by ministry policy tests;
- platform Owner/Admin test identities for platform operations;
- assignments + responses across both congregations;
- presence rows/aggregate scenarios;
- Journey Group, team, couple/link, Live Room, notification and media rows needed to prove tenant isolation;
- negative fixtures explicitly designed to fail cross-tenant access.

Synthetic test users/data are expected here; they are test topology, not fabricated field evidence.

## Required policy matrix

For every migrated sensitive domain, tests should prove both expected allow and expected deny outcomes for applicable combinations of:

- anonymous/public;
- authenticated non-member;
- ordinary member;
- ministry role;
- congregation admin;
- platform admin/owner where applicable;
- same tenant versus different tenant;
- ownership/self versus other user;
- active versus revoked membership/session where relevant.

## `SECURITY DEFINER` rules

Tests must execute definer functions rather than only search SQL text. Assertions should cover:

- intended callable roles;
- revoked roles/Public where applicable;
- caller/tenant checks;
- `search_path` hardening expectations;
- no unintended row/data broadening;
- wrapper/invoker boundaries where used;
- failure after privilege/membership loss when that is part of the contract.

## Alternatives considered

### Continue static SQL tests + production field verification

Rejected as V5's primary model. Static tests are useful but cannot prove Postgres policy/function semantics, migration execution or grant behavior. Production is also the wrong environment for broad destructive/negative security matrices.

### Mock Supabase client responses only

Rejected for RLS/security proof. Mocks can remain useful for client error handling but cannot certify database authorization.

### Shared permanent staging database

Not sufficient as the only CI database. Shared state produces ordering/flakiness and makes destructive negative tests difficult. A staging environment remains useful after ephemeral CI passes.

## Consequences

- CI becomes slower/heavier but materially more trustworthy.
- Migration quality becomes release-critical.
- Tests can close the historical two-congregation topology gap reproducibly.
- Schema changes must include fixture/type/test updates.
- Edge Functions that depend on Supabase services may require local integration setup or a clearly separated contract test tier.

## Migration

1. Add local Supabase configuration and CI startup/health check.
2. Prove the current migration/schema chain can build from zero; repair ordering/schema drift without changing production meaning.
3. Add deterministic seed identities/topology.
4. Port the highest-risk V4 static RLS checks into executable SQL assertions first: assignments, presence, admin-supporting functions and media.
5. Expand to every sensitive domain.
6. Add generated DB types and drift gate.
7. Make database integration mandatory for relevant V5 PRs and RC certification.

## Required evidence before ACCEPTED implementation is complete

- clean ephemeral database starts in CI;
- full schema/migrations apply successfully;
- two populated tenants seeded deterministically;
- critical RLS/function allow/deny matrices pass;
- cross-congregation denial passes across sensitive domains;
- generated types match tested schema;
- no production credentials/data required.

## Rollback

This changes CI/development infrastructure first, not production data. If local-stack integration temporarily fails, V5 runtime work that depends on new database changes pauses; existing static gates remain but do not substitute for the required executable DB gate once this ADR is accepted.
