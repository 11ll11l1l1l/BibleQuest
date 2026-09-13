# ADR-0002 — Executable Supabase/Postgres CI

Status: **ACCEPTED**
Date: 2026-09-13
Supersedes: none

## Context

BibleQuest already has `supabase/schema.sql`, a migrations directory and Edge Functions, and V4 added extensive RLS/privacy/function hardening. However, the V4 Section I workflow executes static/security JavaScript checks and edge tests; it does not start a real database, apply the migration chain and assert RLS/function behavior as actual database callers.

There is also no checked-in `supabase/config.toml` local-project definition on the coordinated V5 integration baseline. V4 therefore relied on static inspection plus selected live/manual verification for database security behavior. Cross-congregation field evidence was additionally constrained by production having only one populated congregation.

V5 must remove this confidence gap.

Historical Lab A2 evidence supports the architectural direction but also proves that implementation must remain fail-closed and incremental. The disposable DB-first experiment reached real local Supabase/Postgres startup far enough to expose migration-history/bootstrap defects, later remained red during startup in subsequent exact-head runs, and never established a clean reset + executable RLS matrix as green. The useful result is not a reusable lab branch; it is evidence that real migration execution finds defects static SQL inspection cannot and that diagnostics must never be confused with successful database certification.

## Decision

1. Use the **Supabase CLI local stack** in development/CI, backed by ephemeral Postgres services managed by the supported Supabase tooling.
2. Check in the local Supabase project configuration needed to reproduce the schema/functions locally.
3. Treat the ordered migration chain as the primary database build path; test it from an empty database.
4. Add deterministic seed/test topology with at least two populated congregations and the role/account combinations required for authorization testing.
5. Execute RLS and function assertions against the real local database under realistic caller identities/claims.
6. Use SQL/pgTAP or a small purpose-built SQL integration harness for policy/function assertions; JavaScript may orchestrate tests but must not replace database execution with text matching.
7. Generate TypeScript database types from the tested schema and detect drift.
8. Keep fast static SQL/security tests as supplemental guards.
9. Pin the Supabase CLI/toolchain once a compatible green baseline is demonstrated so migration replay remains deterministic.
10. Treat local/CI database failure as a hard gate for dependent V5 database changes; diagnostics, skipped tests, Cloudflare previews, static analysis and production observations do not substitute for executable database proof.
11. Never mutate hosted migration history automatically to make local replay green. Any reconciliation of historical migration versions with an existing remote project requires a separately reviewed migration plan and manual production approval.

This ADR accepts the architecture contract. It does **not** declare Phase 2 implementation complete. Phase 2 remains incomplete until the executable evidence listed below passes on the coordinated integration route.

## Evidence supporting acceptance

The accepted direction is supported by current repository and historical experimental evidence:

- the coordinated integration tree contains `supabase/schema.sql`, ordered migrations and Edge Functions but no checked-in local Supabase project configuration;
- the current V5 plan requires clean zero-state migration replay, deterministic two-congregation fixtures, real RLS/function/grant assertions and generated DB types;
- the historical DB-first lab demonstrated that a real local database path exposes installation/migration defects that static checks do not surface;
- that lab also demonstrated the correct fail-closed behavior: when startup failed, reset, fixtures and RLS assertions remained skipped and were not reported as passing;
- deterministic synthetic two-congregation fixtures and caller-context SQL assertions are viable test concepts, but their lab implementation is historical evidence only and must be reviewed/re-implemented on fresh coordinated worker branches;
- no evidence justifies weakening RLS, grants, `SECURITY DEFINER` boundaries or existing privacy contracts to obtain green CI.

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
- Historical installation-path defects may need explicit repair before Phase 2 can become green; such repairs must preserve production meaning and must not silently rewrite hosted migration history.

## Migration

1. Add local Supabase configuration and CI startup/health check on a fresh coordinated A2 worker branch.
2. Prove the current migration/schema chain can build from zero; repair demonstrated ordering/schema drift without changing production meaning.
3. Add deterministic seed identities/topology.
4. Port the highest-risk V4 static RLS checks into executable SQL assertions first: assignments, presence, admin-supporting functions and media.
5. Expand to every sensitive domain.
6. Add generated DB types and drift gate.
7. Make database integration mandatory for relevant V5 PRs and RC certification.

Lab-only migration renames, baseline migrations, local configuration, fixtures, workflows and tests are not adopted merely by this ADR. Each reusable idea must be reviewed and re-implemented or selectively ported through the coordinated lease/PR route from the current integration HEAD.

## Required evidence before Phase 2 implementation is complete

- clean ephemeral database starts in CI;
- full schema/migrations apply successfully from zero;
- two populated tenants seed deterministically;
- critical RLS/function allow/deny matrices pass;
- cross-congregation denial passes across sensitive domains;
- grants/revokes and callable-role boundaries are executable-tested;
- generated types match the tested schema;
- no production credentials/data are required;
- exact toolchain/database versions and exact tested commit identity are visible in CI evidence.

## Rollback

This decision changes CI/development architecture first, not production data. If local-stack integration temporarily fails, V5 runtime work that depends on new database changes pauses; existing static gates remain but do not substitute for the required executable DB gate. Reverting this ADR before Phase 2 implementation is possible as a documentation rollback, but once coordinated migrations/tests rely on this contract, replacement requires a superseding ADR rather than silent weakening.