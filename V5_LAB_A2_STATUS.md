# BibleQuest V5 Lab A2 — Data/Security First Status

Lab identity: `BQ-V5-LAB-A2-DATA-FIRST`
Branch: `lab/v5-a2-db-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Branch HEAD at start of this run: `1f504dec812f11453f82e30af61cdf3d6c547060`
Implementation head immediately before this status commit: `8fd7bfe0abfe73c5eee359b74f14de463f3f0376`

## Hypothesis

BibleQuest V5 becomes safer and easier to evolve when executable database/security behavior is established first: reproducible local Supabase, clean migration replay, deterministic multi-congregation fixtures, real RLS/function/grant tests, generated database contracts, then a typed repository boundary in the client.

## Current viability

**VIABLE — CONTINUE.**

The production baseline already has meaningful RLS and `SECURITY DEFINER` seams, so a data-first architecture has concrete behavior to characterize rather than requiring an invented backend. The first experiment is deliberately infrastructure-only and does not alter hosted Supabase or application runtime behavior.

## Completed this run

- Added secret-free `supabase/config.toml` for an isolated local Supabase project.
- Kept deterministic seeding disabled until clean migration replay is proven; this prevents fixture work from hiding a migration-chain defect.
- Added `supabase/tests/0001_security_baseline.sql`, an executable Postgres catalog characterization for sensitive congregation-table RLS and the private congregation-membership `SECURITY DEFINER` helper.
- The SQL test checks real catalog state, function privilege state and explicit `search_path`; it is not a static SQL text-match replacement.

## DB/security evidence

### Confirmed from repository baseline

- `supabase/schema.sql` defines congregation/member/team/session/score domains with RLS enabled.
- `private.is_bible_congregation_member(uuid)` is defined as `SECURITY DEFINER`, uses an explicit empty `search_path`, revokes PUBLIC execution and grants authenticated execution.
- ADR-0002 requires local Supabase, clean migration replay, deterministic two-congregation topology and executable RLS/function tests.

### Validation performed

- `supabase/config.toml` was parsed successfully with Python 3 `tomllib`; project/API/DB/auth/storage/realtime sections are syntactically valid TOML.
- The current Supabase CLI documentation was checked before choosing config keys; `project_id` is required and `[db.seed]` supports `enabled`/`sql_paths`.

### Not yet proven

- No claim that `supabase start` succeeds.
- No claim that the complete migration chain replays from zero.
- No claim that `0001_security_baseline.sql` has executed against Postgres yet.
- No RLS caller-context or two-congregation fixture evidence yet.
- No generated database type evidence yet.

These remain intentionally open until a disposable local/CI stack executes them.

## Architecture decisions in this lab

1. The migration chain, not `schema.sql` alone, will be treated as the eventual authoritative clean-build path.
2. Local config contains no hosted project reference and no credential; all destructive/reset work must be explicit local/ephemeral execution.
3. Seed data will be synthetic and deterministic. It will not be copied from production.
4. RLS/function security proof must execute inside Postgres; static repository checks remain supplemental only.
5. Fixtures are deferred until migration replay is green, so seeds cannot accidentally compensate for missing schema/migration state.

## Known debt / risks

- `supabase/schema.sql` and ordered migrations may represent overlapping historical installation paths; clean replay must determine the correct V5 bootstrap contract.
- Local Supabase CLI/container execution is not available through the GitHub write path used in this run, so real DB evidence remains pending.
- The first security test characterizes only foundational congregation membership/RLS seams; assignments, presence, admin functions, media and other sensitive domains still require executable matrices.
- Auth fixture insertion needs to follow the local Supabase auth schema/CLI rather than assuming hosted internal table details.

## Next 3 tasks

1. Prove a clean local `supabase db reset`/migration replay from zero and repair ordering/bootstrap defects without changing accepted security semantics.
2. Introduce deterministic synthetic auth + two-congregation fixtures covering member, multi-member, ministry role and platform-privileged identities.
3. Add executable caller-context RLS matrices for congregation membership plus one highest-risk domain (assignments/presence), then generate database types from the tested schema.

## Stop condition

Mark `RECOMMEND SCRAP` if the migration history cannot be made reproducible without effectively rebuilding production schema by hand, or if a DB-first boundary would require weakening existing authorization/privacy guarantees. Neither condition is currently observed.
