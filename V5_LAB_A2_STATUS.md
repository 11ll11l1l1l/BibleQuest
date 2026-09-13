# BibleQuest V5 Lab A2 — Data/Security First Status

Lab identity: `BQ-V5-LAB-A2-DATA-FIRST`
Branch: `lab/v5-a2-db-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Branch HEAD at start of this run: `1f59628810f215d017d6d2008dae6646e1e1c25f`
Implementation head immediately before this status commit: `ba5a374a0286c107b362273f6718cd48bb09aef7`

## Hypothesis

BibleQuest V5 becomes safer and easier to evolve when executable database/security behavior is established first: reproducible local Supabase, clean migration replay, deterministic multi-congregation fixtures, real RLS/function/grant tests, generated database contracts, then a typed repository boundary in the client.

## Current viability

**VIABLE — CONTINUE.**

The first real CI execution produced a useful failure rather than an architectural dead end: the historical migration directory is not self-bootstrapping because the accepted base schema lived only in `supabase/schema.sql`. The lab now promotes that accepted schema, unchanged in security semantics, into an ordered baseline migration so fresh databases can replay the same foundation before later feature migrations.

## Completed this run

- Inspected the exact failed `Lab A2 DB Security` workflow logs for branch head `1f59628810f215d017d6d2008dae6646e1e1c25f`.
- Confirmed Supabase CLI `2.117.0`, Docker `28.0.4`, PostgreSQL client `16.15` and the disposable Postgres 17.6 image initialized successfully before migration application.
- Identified the first deterministic replay failure: `20260904_assignments_presence_unlocks.sql` attempts to create `private.bible_assignment_visible(...)`, but a fresh database has no `private` schema because the base BibleQuest schema was never represented as an earlier migration.
- Added `supabase/migrations/20260903000000_biblequest_baseline.sql` as an exact migration-form copy of the accepted `supabase/schema.sql` base schema. No RLS policy, grant, function, table definition or application runtime contract was intentionally weakened or redesigned in this repair.
- Kept seed execution disabled; no fixture data is allowed to compensate for migration ordering/bootstrap defects.

## DB/security evidence

### Confirmed from executable CI

- `supabase start` reaches a real disposable Postgres instance and begins applying repository migrations.
- The previous exact-head failure was SQLSTATE `3F000` (`schema "private" does not exist`) at statement 0 of `20260904_assignments_presence_unlocks.sql`.
- The failure occurs before `supabase db reset` and before `supabase/tests/0001_security_baseline.sql`; therefore neither clean replay nor the security assertions were previously green.
- The diagnostic `migration list` failure after that point was secondary: Supabase had already stopped the database containers after migration initialization failed.

### Repository repair now under proof

- `supabase/schema.sql` begins with `create extension if not exists pgcrypto;` and `create schema if not exists private;` and defines the core congregation/member/team/session domains before their later feature migrations.
- `supabase/migrations/20260903000000_biblequest_baseline.sql` now supplies that accepted foundation before all `20260904*` migrations.
- The baseline preserves the existing `private.is_bible_congregation_member(uuid)` `SECURITY DEFINER` definition, empty `search_path`, PUBLIC revoke, authenticated execute grant and the existing RLS/grant posture.

### Pending exact evidence

- The workflow conclusion for the new branch head containing the baseline migration is still required before claiming full migration replay success.
- `supabase db reset --local --no-seed` is not yet claimed green on the repaired chain.
- `0001_security_baseline.sql` is not yet claimed green against Postgres.
- No RLS caller-context or two-congregation fixture evidence yet.
- No generated database type evidence yet.

## Architecture decisions in this lab

1. The migration chain, not `schema.sql` alone, is the authoritative clean-build path for this experiment.
2. The historical `schema.sql` foundation is treated as accepted behavior to migrate into replayable history, not as a parallel runtime installation mechanism.
3. Local config contains no hosted project reference and no credential; all destructive/reset work remains explicit local/ephemeral execution.
4. Seed data will be synthetic and deterministic. It will not be copied from production.
5. RLS/function security proof must execute inside Postgres; static repository checks remain supplemental only.
6. Fixtures remain deferred until migration replay is green, so seeds cannot accidentally compensate for missing schema/migration state.
7. CI migration replay remains the primary truth source; each failure will be repaired at the first demonstrated ordering/schema defect rather than bypassed with disabled migrations or weakened assertions.

## Known debt / risks

- `supabase/schema.sql` and ordered migrations represented two historical installation paths. The new baseline migration deliberately begins convergence, but later migrations may still expose schema.sql-versus-history drift that must be resolved explicitly.
- The new baseline migration is intentionally an exact semantic copy rather than a redesigned V5 schema. Once replay is proven, future normalization should occur through later migrations with security tests, not by silently rewriting the historical baseline.
- The workflow currently uses `supabase/setup-cli@v1` with `latest`; once a compatible green CLI version is observed, pinning the CLI should improve reproducibility.
- The first security test characterizes only foundational congregation membership/RLS seams; assignments, presence, admin functions, media and other sensitive domains still require executable matrices.
- Auth fixture insertion needs to follow local Supabase auth behavior rather than assuming hosted internal table details.

## Next 3 tasks

1. Inspect the exact GitHub Actions result for the repaired migration chain; if red, repair only the next demonstrated migration/schema ordering defect without weakening RLS/security semantics.
2. Once clean replay and the foundational security SQL are green, introduce deterministic synthetic auth + two-congregation fixtures covering member, multi-member, ministry role and platform-privileged identities.
3. Add executable caller-context RLS matrices for congregation membership plus one highest-risk domain (assignments/presence), then generate database types from the tested schema.

## Stop condition

Mark `RECOMMEND SCRAP` if the migration history cannot be made reproducible without effectively inventing a replacement production schema, or if a DB-first boundary would require weakening existing authorization/privacy guarantees. The current failure does not meet either condition: it exposed a bounded missing-baseline migration that can be repaired from the repository's accepted schema source.
