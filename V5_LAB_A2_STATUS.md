# BibleQuest V5 Lab A2 — Data/Security First Status

Lab identity: `BQ-V5-LAB-A2-DATA-FIRST`
Branch: `lab/v5-a2-db-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Branch HEAD at start of this run: `c2b09e0491a9c442f167af6e070167883590b435`
Implementation HEAD before this status commit: `a32ee77360cbff30702d3db050b5e22c5b7eec51`

## Hypothesis

BibleQuest V5 becomes safer and easier to evolve when executable database/security behavior is established first: reproducible local Supabase, clean migration replay, deterministic multi-congregation fixtures, real RLS/function/grant tests, generated database contracts, then a typed repository boundary in the client.

## Current viability

**VIABLE — CONTINUE.**

The DB-first path remains blocked at local Supabase startup, before migration reset and before executable RLS assertions. Exact-head run 22 again failed in the startup step. The attempted PR-comment diagnostic also failed and did not publish the SQL cause, so this run replaced that brittle reporting path with CI-native step-summary plus artifact evidence that does not require issue-write permission.

## Completed this run

- Re-fetched exact lab HEAD `c2b09e0491a9c442f167af6e070167883590b435` and exact-head workflow/check evidence.
- Confirmed `V5 Lab A2 DB Security` run 22 completed **failure** in `Start disposable local Supabase with diagnostics`; reset, foundational characterization, fixture load and congregation-isolation tests were skipped.
- Confirmed the previous `Publish sanitized startup failure diagnostic to lab PR` step itself failed, leaving no diagnostic comment on draft PR #188.
- Removed the workflow's `issues: write` requirement and the failed PR-comment publication mechanism.
- Added a failure-only sanitizer that writes the filtered/redacted Supabase startup diagnostic into `$GITHUB_STEP_SUMMARY`.
- Added `actions/upload-artifact@v4` publication of the same sanitized diagnostic with seven-day retention, so the evidence survives the failed job without needing PR comment permissions.
- Preserved fail-closed behavior: startup failure still fails the job and prevents migration reset/security assertions from being treated as executed.
- Did not alter schema SQL, migration SQL, RLS, grants, fixtures, application runtime, hosted Supabase state/configuration, another lab branch, `main`, or `v5/architecture-upgrade`.

## DB/security evidence

### Confirmed executable evidence

- `c2b09e0491a9c442f167af6e070167883590b435`: `V5 Lab A2 DB Security` run 22 failed specifically in `Start disposable local Supabase with diagnostics`.
- The job metadata shows `Replay migrations from zero`, `Execute foundational security characterization`, deterministic fixture load, and congregation isolation RLS characterization all skipped after startup failure.
- The diagnostic-comment step also failed, so no SQL/root-cause text from run 22 is treated as known.
- No RLS, clean-reset, fixture, or generated-type success is claimed for this run.

### Durable diagnostic evidence added this run

- `supabase start --debug` still tees its full runner-local log.
- On startup failure, CI now extracts likely SQL/migration/error lines, with a larger fallback tail when pattern extraction is empty.
- JWT-like values and key/token/secret assignments are redacted before any persisted diagnostic output.
- Sanitized evidence is written to the GitHub Actions step summary and uploaded as `v5-a2-supabase-start-diagnostic-${GITHUB_SHA}` for seven days.
- The workflow now requires only `contents: read`; diagnostic persistence no longer depends on write access to PR/issues.
- The diagnostic path cannot convert a failed Supabase startup into a passed database gate.

### Existing deterministic security harness awaiting execution

- `supabase/tests/fixtures/0001_two_congregations.sql` defines stable synthetic identities, two separate congregations, separate owners/members and an authenticated outsider.
- `supabase/tests/0002_congregation_isolation.sql` executes under PostgreSQL role `authenticated` with local JWT claim context and asserts positive same-congregation visibility plus negative cross-congregation/outsider isolation.
- `[db.seed]` remains disabled so fixture data cannot make broken migration replay appear healthy.

### Pending exact evidence

- The first concrete startup/SQL error from the new step-summary/artifact path on the new exact head.
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
7. CI diagnostics may persist only sanitized local failure evidence and must never publish privileged or production credentials.
8. Diagnostic persistence should rely on CI-native summaries/artifacts rather than mutable PR comments when write permissions are unnecessary.
9. A diagnostic mechanism must not weaken the failing gate: startup failure remains a job failure.
10. No RLS policy, grant or valid security test is weakened to obtain green CI.

## Known debt / risks

- Clean local Supabase startup is still red; the new durable diagnostic mechanism has not yet produced its first exact-head result.
- The workflow still installs Supabase CLI `latest`; once one compatible green toolchain is established it should be pinned for deterministic replay.
- The synthetic fixture insert into `auth.users` has not executed yet because startup remains red; auth-schema compatibility is still pending evidence.
- `supabase/schema.sql` and ordered migrations historically represented two installation paths, so further drift may surface as replay advances.
- Existing production/hosted migration history may contain former short `20260904` versions. This lab does not mutate or reconcile remote history.
- Assignments, presence, admin, media and other sensitive domains still need executable tenant/authorization matrices.
- A successful Cloudflare preview is not database evidence and is not used as proof of migration/RLS correctness.

## Next 3 tasks

1. Inspect the exact-head DB-security run and read the new sanitized step-summary/artifact evidence. Repair only the first concrete startup/migration defect it identifies without weakening authorization or bypassing migrations.
2. Once startup/reset is green, validate and minimally correct the synthetic `auth.users` fixture shape if necessary, then require both `0001_security_baseline.sql` and `0002_congregation_isolation.sql` to pass under PostgreSQL.
3. Extend caller-context matrices to assignments/presence, then generate database types from the tested local schema and begin a typed repository/data-access boundary.

## Stop condition

Mark `RECOMMEND SCRAP` if reproducible migration history would require inventing a replacement production schema or weakening accepted authorization/privacy outcomes. Current evidence does not meet that condition.
