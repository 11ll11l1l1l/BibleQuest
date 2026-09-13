# BibleQuest V5 Lab A2 — Data/Security First Status

Lab identity: `BQ-V5-LAB-A2-DATA-FIRST`
Branch: `lab/v5-a2-db-first`
Baseline origin: `main` `1f504dec812f11453f82e30af61cdf3d6c547060`
Branch HEAD at start of this run: `307865dc56dafbdb43834fdfde742be0d2f11704`

## Hypothesis

BibleQuest V5 becomes safer and easier to evolve when executable database/security behavior is established first: reproducible local Supabase, clean migration replay, deterministic multi-congregation fixtures, real RLS/function/grant tests, generated database contracts, then a typed repository boundary in the client.

## Current viability

**VIABLE — CONTINUE.**

The DB-first path continues to expose bounded historical reproducibility defects rather than requiring weaker security or a replacement backend. After adding the missing accepted baseline migration, the exact branch workflow still failed during `supabase start`. The migration directory also contained eight legacy files sharing the short version `20260904`, while current Supabase migrations use unique timestamp-prefixed versions. This lab now normalizes only those local migration identities to unique 14-digit timestamps while preserving their existing lexical order and SQL blob contents.

## Completed this run

- Re-fetched exact lab HEAD `307865dc56dafbdb43834fdfde742be0d2f11704` and its `Lab A2 DB Security` workflow evidence.
- Confirmed the repaired-head DB workflow still fails during `supabase start`, before explicit `db reset` and before `0001_security_baseline.sql`; therefore neither replay nor security tests are claimed green yet.
- Audited `supabase/migrations/` and found eight legacy files with the same short migration version `20260904`.
- Verified current Supabase guidance uses `YYYYMMDDHHmmss_short_description.sql` / `<timestamp>_<name>.sql` migration naming and that short timestamp versions have documented CLI ordering/parsing problems.
- Renamed the eight `20260904_*` migrations to unique 14-digit versions `20260904000000` through `20260904000700`, preserving their prior alphabetical execution order.
- Reused each original Git blob for the renamed file; no SQL statement, RLS policy, grant, function, table definition or application runtime behavior was changed in this tranche.
- Did not run or mutate any hosted Supabase project and did not repair remote migration history.

## DB/security evidence

### Confirmed executable evidence

- The prior workflow on `1f59628810f215d017d6d2008dae6646e1e1c25f` reached disposable Postgres and failed because the historical migration chain lacked the base `private` schema.
- `20260903000000_biblequest_baseline.sql` repaired that missing clean-build foundation from the repository's accepted `supabase/schema.sql` semantics.
- The subsequent workflow on `307865dc56dafbdb43834fdfde742be0d2f11704` still fails in the `supabase start` step, so clean replay remains unproven.

### Migration-history normalization under proof

- The branch had eight files with migration version `20260904`: assignments/presence, group signup limits, innovation stage, journey groups, journey presence indexes, personality profiles, release hardening and room poll edge.
- They are now assigned unique 14-digit local versions in their prior lexical order.
- This is a lab clean-replay experiment only. Promotion to any existing hosted project would require explicit reconciliation against that project's migration history; this lab does not perform or recommend an automatic remote history rewrite.

### Pending exact evidence

- Exact-head `supabase start` success after migration-version normalization.
- `supabase db reset --local --no-seed` success for the full chain.
- `supabase/tests/0001_security_baseline.sql` execution success against Postgres.
- Deterministic synthetic identities, two-congregation fixture topology and real caller-context RLS matrices.
- Generated database/domain type evidence.

## Architecture decisions in this lab

1. Migration replay from an empty disposable database is the authoritative clean-build proof.
2. Historical SQL semantics are preserved while installation/history defects are repaired explicitly.
3. Migration versions in the lab must be unique, deterministic and sortable; new work uses full timestamp versions.
4. Renaming historical versions is safe only for this isolated disposable experiment. Existing hosted migration histories are a separate migration/reconciliation decision and remain untouched.
5. Seed data remains disabled until the full migration chain and foundational security assertions pass.
6. RLS/function security proof must execute in Postgres; static checks are supplemental only.
7. No security test is weakened to obtain a green replay.

## Known debt / risks

- The exact reason for the latest `supabase start` failure is not exposed by the available workflow metadata; duplicate/short migration versions are a demonstrated repository defect and a plausible contributing cause, but the normalization must be validated by the next exact-head run.
- `supabase/schema.sql` and ordered migrations historically represented two installation paths. Further drift may surface after the chain progresses.
- Existing production/hosted migration history may contain the short `20260904` version. This lab intentionally does not mutate or reconcile remote history; any future adoption requires a reviewed rollout strategy.
- The workflow currently installs Supabase CLI `latest`; pinning follows once a green compatible version is established.
- Foundational security characterization is still narrow; assignments, presence, admin, media and other sensitive domains need executable matrices.

## Next 3 tasks

1. Inspect the exact-head DB workflow after version normalization; if red, repair only the first newly demonstrated migration/schema defect without weakening security semantics.
2. Once `supabase start`, clean reset and `0001_security_baseline.sql` are green, add deterministic synthetic auth identities plus a two-congregation fixture topology.
3. Add real caller-context RLS matrices for congregation membership and assignments/presence, then generate database types from the tested schema.

## Stop condition

Mark `RECOMMEND SCRAP` if reproducible migration history would require inventing a replacement production schema or weakening accepted authorization/privacy outcomes. Current evidence does not meet that condition.
