# BibleQuest V5 Lab A2 — Data/Security First Status

Lab identity: `BQ-V5-LAB-A2-DATA-FIRST`
Branch: `lab/v5-a2-db-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Branch HEAD at start of this run: `3ebcf3977737f2d2361983921124066e187e079b`
Implementation HEAD before this status commit: `1ea6947900b37bfa5a1661a9a478b3d165334e03`

## Hypothesis

BibleQuest V5 becomes safer and easier to evolve when executable database/security behavior is established first: reproducible local Supabase, clean migration replay, deterministic multi-congregation fixtures, real RLS/function/grant tests, generated database contracts, then a typed repository boundary in the client.

## Current viability

**VIABLE — CONTINUE.**

The DB-first path continues to expose bounded historical reproducibility defects without requiring weaker security or a replacement backend. Clean migration replay is still red at `supabase start`, so this run did not guess at another migration repair without the exact SQL error. Instead it advanced an independent prerequisite: deterministic multi-tenant fixtures and caller-context isolation assertions that will execute automatically as soon as replay reaches them.

## Completed this run

- Re-fetched exact lab HEAD `3ebcf3977737f2d2361983921124066e187e079b` and exact-head workflow evidence.
- Confirmed `V5 Lab A2 DB Security` run 10 completed **failure** during `Start disposable local Supabase`; replay, foundational security characterization and tenant isolation remain unclaimed.
- Added `supabase/tests/fixtures/0001_two_congregations.sql` with five deterministic synthetic auth identities, two isolated congregations, two owners and one member per congregation plus an authenticated outsider.
- Added `supabase/tests/0002_congregation_isolation.sql` that executes under the real `authenticated` Postgres role with local JWT claim context and verifies member A sees only congregation A, member B sees only congregation B, the outsider sees neither, and the protected membership helper does not leak cross-congregation membership.
- Updated the lab DB workflow so, after clean replay and foundational catalog checks, it loads the deterministic fixture and executes the caller-context isolation matrix with `psql -X -v ON_ERROR_STOP=1`.
- Kept `[db.seed]` disabled: fixtures are test-owned and cannot conceal migration failures during `supabase db reset --local --no-seed`.
- Did not touch hosted Supabase, production data/configuration, application runtime, another lab, `main`, or `v5/architecture-upgrade`.

## DB/security evidence

### Confirmed executable evidence

- `3ebcf3977737f2d2361983921124066e187e079b`: exact-head `V5 Lab A2 DB Security` run 10 failed in `Start disposable local Supabase`.
- Because startup failed, `Replay migrations from zero` and `Execute foundational security characterization` were skipped. No clean-replay or RLS success is claimed.
- The earlier workflow on `1f59628810f215d017d6d2008dae6646e1e1c25f` reached disposable Postgres and exposed the missing historical `private` schema; the baseline migration repaired that specific clean-build defect.

### New deterministic security harness awaiting execution

- Synthetic user IDs are stable and intentionally non-secret; no password/authentication flow is used by these SQL tests.
- Congregation A and B use stable UUIDs and separate owner/member identities.
- The RLS test switches to database role `authenticated`, injects local request JWT claims for each synthetic caller, and queries the real protected tables/helper.
- Assertions check positive membership visibility and negative cross-tenant/outsider visibility rather than only catalog metadata.
- Fixture loading and isolation checks are ordered after clean reset, so they cannot make a broken migration chain appear green.

### Pending exact evidence

- Exact-head `supabase start` success after migration-version normalization.
- `supabase db reset --local --no-seed` success for the full chain.
- `supabase/tests/0001_security_baseline.sql` execution success.
- Fixture-load success against the actual Supabase `auth.users` schema.
- `supabase/tests/0002_congregation_isolation.sql` caller-context execution success.
- Assignments/presence caller-context matrices and generated database/domain type evidence.

## Architecture decisions in this lab

1. Migration replay from an empty disposable database remains the authoritative clean-build proof.
2. Historical SQL semantics are preserved while installation/history defects are repaired explicitly.
3. Migration versions in the lab must be unique, deterministic and sortable; new work uses full timestamp versions.
4. Renaming historical versions is safe only for this isolated disposable experiment. Existing hosted migration histories remain untouched and require separate reconciliation if this architecture is ever adopted.
5. General seed execution remains disabled until clean replay passes. Security fixtures are explicitly loaded by the test job only after reset.
6. Multi-tenant security proof must execute under the real `authenticated` database role with caller claim context; static SQL/catalog checks alone are insufficient.
7. Positive and negative isolation evidence are both required: same-congregation access must work and cross-congregation/outsider access must fail closed.
8. No RLS policy, grant or valid security test is weakened to obtain green CI.

## Known debt / risks

- The exact SQL message behind current `supabase start` failure is not exposed by the available workflow metadata; another migration fix would be speculative until the first failing statement can be observed.
- The new fixture insert into `auth.users` is intentionally realistic but has not executed yet because migration startup is still red; Supabase auth-schema compatibility remains pending evidence.
- `supabase/schema.sql` and ordered migrations historically represented two installation paths. Further drift may surface when startup advances.
- Existing production/hosted migration history may contain the former short `20260904` version. This lab does not mutate or reconcile remote history.
- The workflow still installs Supabase CLI `latest`; pinning follows once a green compatible version is established.
- Assignments, presence, admin, media and other sensitive domains still need executable tenant/authorization matrices.

## Next 3 tasks

1. Inspect the new exact-head DB workflow. If startup is still red and the failing SQL statement becomes observable, repair only that demonstrated migration/schema defect without weakening security.
2. Once startup/reset is green, validate and if necessary minimally correct the synthetic `auth.users` fixture shape, then require `0001_security_baseline.sql` and `0002_congregation_isolation.sql` to pass under Postgres.
3. Extend the same caller-context matrix to assignments/presence, then generate database types from the tested local schema and begin a typed repository/data-access boundary.

## Stop condition

Mark `RECOMMEND SCRAP` if reproducible migration history would require inventing a replacement production schema or weakening accepted authorization/privacy outcomes. Current evidence does not meet that condition.
