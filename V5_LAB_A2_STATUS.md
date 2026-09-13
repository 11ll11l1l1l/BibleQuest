# BibleQuest V5 Lab A2 — Data/Security First Status

Lab identity: `BQ-V5-LAB-A2-DATA-FIRST`
Branch: `lab/v5-a2-db-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Branch HEAD at start of this run: `3bbad39a497d34100f66e9dd46e7fe9137406706`
Implementation HEAD before this status commit: `bc6fac1709dd508fd9fd4091b021cc9e14a07106`

## Hypothesis

BibleQuest V5 becomes safer and easier to evolve when executable database/security behavior is established first: reproducible local Supabase, clean migration replay, deterministic multi-congregation fixtures, real RLS/function/grant tests, generated database contracts, then a typed repository boundary in the client.

## Current viability

**VIABLE — CONTINUE.**

The DB-first path is still blocked at local Supabase startup, before migration reset and before executable RLS assertions. The latest exact-head workflow again proved that this is a startup/migration reproducibility problem rather than a fixture-test failure. This run therefore strengthened the CI diagnostic boundary instead of guessing at another schema repair without the failing SQL message.

## Completed this run

- Re-fetched exact lab HEAD `3bbad39a497d34100f66e9dd46e7fe9137406706` and exact-head workflow/check evidence.
- Confirmed `V5 Lab A2 DB Security` run 18 completed **failure** in `Start disposable local Supabase`; reset, foundational characterization, fixture load and congregation-isolation tests were skipped.
- Confirmed the failing check contains three annotations, but the available repository connector does not expose the underlying Actions log/annotation text directly enough to identify the first failing SQL statement safely.
- Changed the lab workflow startup command to `supabase start --debug` while teeing the full runner-local log.
- Added a failure-only diagnostic step for the existing draft lab PR. It extracts only likely startup/migration/error lines, redacts JWT-like tokens and key/token fields, and creates or updates one marker comment rather than accumulating duplicate comments.
- Restricted the added workflow permission to `issues: write` plus existing `contents: read`; the diagnostic is only published for pull-request runs and never sends hosted Supabase credentials because this lab has none.
- Preserved the existing fail-closed order: startup must succeed before clean reset, catalog security characterization, fixture loading or caller-context RLS checks can run.
- Did not alter any schema, migration SQL, RLS policy, grant, fixture, application runtime, hosted Supabase state, production configuration, another lab branch, `main`, or `v5/architecture-upgrade`.

## DB/security evidence

### Confirmed executable evidence

- `3bbad39a497d34100f66e9dd46e7fe9137406706`: `V5 Lab A2 DB Security` run 18 failed in `Start disposable local Supabase with diagnostics` predecessor step; all database assertions remained skipped.
- The exact-head job metadata shows startup failure followed by skipped migration reset, skipped foundational security characterization, skipped deterministic fixture load and skipped congregation-isolation characterization.
- No RLS, migration replay, fixture or generated-type success is claimed for this run.

### Diagnostic evidence added this run

- CI now executes `supabase start --debug` and retains the runner-local startup log for the duration of the job.
- On startup failure in PR context, CI filters error/migration/SQLSTATE-style lines and publishes a sanitized excerpt to the persistent draft PR using marker `v5-lab-a2-startup-diagnostic`.
- The diagnostic updater edits the existing marker comment when present, preventing hourly duplicate-comment churn.
- JWT-like strings and key/token/secret assignments are redacted before publishing.
- The diagnostic step itself does not convert startup failure into success; the job remains red when `supabase start` fails.

### Existing deterministic security harness awaiting execution

- `supabase/tests/fixtures/0001_two_congregations.sql` defines stable synthetic identities, two separate congregations, separate owners/members and an authenticated outsider.
- `supabase/tests/0002_congregation_isolation.sql` executes under PostgreSQL role `authenticated` with local JWT claim context and asserts positive same-congregation visibility plus negative cross-congregation/outsider isolation.
- `[db.seed]` remains disabled so fixture data cannot make broken migration replay appear healthy.

### Pending exact evidence

- The first concrete SQL/startup error excerpt from the new sanitized PR diagnostic.
- Exact-head `supabase start` success after the demonstrated startup defect is repaired.
- `supabase db reset --local --no-seed` success for the complete migration chain.
- `supabase/tests/0001_security_baseline.sql` execution success.
- Deterministic fixture load success against the actual local Supabase auth schema.
- `supabase/tests/0002_congregation_isolation.sql` caller-context execution success.
- Assignments/presence caller-context matrices and generated database/domain type evidence.

## Architecture decisions in this lab

1. Migration replay from an empty disposable database remains the authoritative clean-build proof.
2. Historical SQL semantics are preserved while installation/history defects are repaired explicitly.
3. No further migration/schema repair is made without an observed failing statement or equivalent concrete executable evidence.
4. Migration versions in the lab must be unique, deterministic and sortable; renamed historical versions remain lab-only history experiments and do not authorize hosted-history mutation.
5. General seed execution remains disabled until clean replay passes. Security fixtures are explicitly loaded only after reset.
6. Multi-tenant security proof must execute under the real `authenticated` database role with caller claim context; static SQL/catalog checks alone are insufficient.
7. CI diagnostics may expose only sanitized local failure evidence and must never publish privileged or production credentials.
8. A diagnostic mechanism must not weaken the failing gate: startup failure remains a job failure.
9. No RLS policy, grant or valid security test is weakened to obtain green CI.

## Known debt / risks

- Clean local Supabase startup is still red; the new diagnostic has not yet run on the implementation head, so the next concrete startup defect is still unknown.
- The workflow still installs Supabase CLI `latest`; once one compatible green toolchain is established it should be pinned for deterministic replay.
- The synthetic fixture insert into `auth.users` has not executed yet because startup remains red; auth-schema compatibility is still pending evidence.
- `supabase/schema.sql` and ordered migrations historically represented two installation paths, so further drift may surface as replay advances.
- Existing production/hosted migration history may contain former short `20260904` versions. This lab does not mutate or reconcile remote history.
- Assignments, presence, admin, media and other sensitive domains still need executable tenant/authorization matrices.
- The local execution container used by this investigator could not resolve `github.com`; therefore no local Docker/Supabase result is being substituted for CI evidence.

## Next 3 tasks

1. Inspect the exact-head draft-PR run and its sanitized startup diagnostic. Repair only the first concrete startup/migration defect it identifies without weakening authorization or bypassing migrations.
2. Once startup/reset is green, validate and minimally correct the synthetic `auth.users` fixture shape if necessary, then require both `0001_security_baseline.sql` and `0002_congregation_isolation.sql` to pass under PostgreSQL.
3. Extend caller-context matrices to assignments/presence, then generate database types from the tested local schema and begin a typed repository/data-access boundary.

## Stop condition

Mark `RECOMMEND SCRAP` if reproducible migration history would require inventing a replacement production schema or weakening accepted authorization/privacy outcomes. Current evidence does not meet that condition.
