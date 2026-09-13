# BibleQuest V5 Lab A2 — Data/Security First Status

Lab identity: `BQ-V5-LAB-A2-DATA-FIRST`
Branch: `lab/v5-a2-db-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Branch HEAD at start of this run: `b9363727f68c122a14217d7130e0f553a12dfa2c`
Implementation head immediately before this status commit: `819bc21c9e34693d3c699f457db32beb79673e48`

## Hypothesis

BibleQuest V5 becomes safer and easier to evolve when executable database/security behavior is established first: reproducible local Supabase, clean migration replay, deterministic multi-congregation fixtures, real RLS/function/grant tests, generated database contracts, then a typed repository boundary in the client.

## Current viability

**VIABLE — CONTINUE.**

The production baseline already has meaningful RLS and `SECURITY DEFINER` seams, so a data-first architecture has concrete behavior to characterize rather than requiring an invented backend. This run converts the first static lab setup into an executable CI experiment without touching hosted Supabase or application runtime behavior.

## Completed this run

- Added `.github/workflows/v5-lab-a2-db-security.yml`, scoped to this disposable lab branch / its draft PR paths.
- The workflow checks out the exact commit, installs the Supabase CLI, starts a disposable local stack, runs `supabase db reset --local --no-seed`, executes `supabase/tests/0001_security_baseline.sql` through `psql -v ON_ERROR_STOP=1`, captures migration/status diagnostics, and stops the stack without backup.
- The job intentionally uses no hosted project reference, access token, service-role secret, production database URL or production Supabase mutation.
- Existing seed execution remains disabled until migration replay is proven green.

## DB/security evidence

### Confirmed from repository baseline

- `supabase/schema.sql` defines congregation/member/team/session/score domains with RLS enabled.
- `private.is_bible_congregation_member(uuid)` is defined as `SECURITY DEFINER`, uses an explicit empty `search_path`, revokes PUBLIC execution and grants authenticated execution.
- ADR-0002 requires local Supabase, clean migration replay, deterministic two-congregation topology and executable RLS/function tests.

### Validation performed

- `supabase/config.toml` previously parsed successfully with Python 3 `tomllib`.
- A CI execution path now exists for real migration replay and Postgres security-test execution.
- The workflow is fail-closed: migration errors and SQL assertion errors terminate the main proof steps; diagnostic steps run only under `if: always()` and do not convert a failure into success.

### Pending exact evidence

- The new workflow run for exact branch head is pending/unknown until GitHub Actions reports a conclusion.
- No claim is made yet that `supabase start` succeeds in CI.
- No claim is made yet that the complete migration chain replays from zero.
- No claim is made yet that `0001_security_baseline.sql` passes against Postgres.
- No RLS caller-context or two-congregation fixture evidence yet.
- No generated database type evidence yet.

## Architecture decisions in this lab

1. The migration chain, not `schema.sql` alone, will be treated as the eventual authoritative clean-build path.
2. Local config contains no hosted project reference and no credential; all destructive/reset work must be explicit local/ephemeral execution.
3. Seed data will be synthetic and deterministic. It will not be copied from production.
4. RLS/function security proof must execute inside Postgres; static repository checks remain supplemental only.
5. Fixtures remain deferred until migration replay is green, so seeds cannot accidentally compensate for missing schema/migration state.
6. CI migration replay is now the primary truth source for deciding whether the historical migration chain is usable as the V5 data spine; failures should be repaired at root cause rather than bypassed with schema snapshots or weakened assertions.

## Known debt / risks

- `supabase/schema.sql` and ordered migrations may represent overlapping historical installation paths; the new CI gate is expected to expose whether migrations are independently replayable.
- The workflow currently pins `supabase/setup-cli@v1` but requests the latest CLI release; once a green compatible version is observed, deterministic pinning should be considered for reproducibility.
- The first security test characterizes only foundational congregation membership/RLS seams; assignments, presence, admin functions, media and other sensitive domains still require executable matrices.
- Auth fixture insertion needs to follow the local Supabase auth schema/CLI rather than assuming hosted internal table details.

## Next 3 tasks

1. Inspect the exact GitHub Actions result for this migration replay gate; if red, repair the first demonstrated migration/bootstrap defect without weakening accepted RLS/security semantics.
2. Once clean replay is green, introduce deterministic synthetic auth + two-congregation fixtures covering member, multi-member, ministry role and platform-privileged identities.
3. Add executable caller-context RLS matrices for congregation membership plus one highest-risk domain (assignments/presence), then generate database types from the tested schema.

## Stop condition

Mark `RECOMMEND SCRAP` if the migration history cannot be made reproducible without effectively rebuilding production schema by hand, or if a DB-first boundary would require weakening existing authorization/privacy guarantees. Neither condition is currently observed.
