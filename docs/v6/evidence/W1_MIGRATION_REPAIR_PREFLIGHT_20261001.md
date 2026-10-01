# W1 production migration-repair preflight evidence — 2026-10-01

This record is read-only evidence for the BibleQuest V6 assignment assigned/due push deployment lane. It does not authorize or perform a production migration, migration-history repair, Edge Function deployment, Cron change, Vault change, notification dispatch, or user-data mutation.

## Live project observation

The active BibleQuest Supabase project was inspected read-only on 2026-10-01.

Assignment-push runtime state:

- `bq-assignment` is ACTIVE.
- `bq-push-delivery` is ACTIVE.
- `bq-assignment-reminders` is not deployed.

The production migration history after the released-V5 cutoff currently includes:

- `20260923232136_secure_push_broadcast_system`
- `20260923232514_move_pg_net_to_extensions_schema`
- `20260924212308_v6_privacy_safe_telemetry`
- `20260924212926_v6_telemetry_hardening`

The canonical V6 repository records the two telemetry migrations under later versions:

- `20260925061900_v6_privacy_safe_telemetry.sql`
- `20260925063000_v6_telemetry_hardening.sql`

Therefore the two logical telemetry migrations are a real version-history divergence, not a name-discovery error.

## Historical SQL observation

The `statements` stored in `supabase_migrations.schema_migrations` for the two production telemetry rows were inspected read-only. They contain the expected telemetry tables/functions/index hardening families.

This evidence intentionally does **not** declare the production statements semantically identical to the later canonical repository files. A metadata-only repair is permitted only after an independent schema-equivalence review records that conclusion explicitly.

## Guard improvement

`scripts/v6-migration-history-guard.mjs` now supports a reviewed equivalence file. The guard:

- requires exact remote version/name and local version/name pairs;
- requires `reviewed: true` and a non-empty evidence citation;
- requires one-to-one mappings;
- rejects stale mappings that no longer match the current local or remote inventories;
- emits the exact metadata-only `supabase migration repair` commands;
- never executes a repair or migration;
- keeps `safeForOrderedPush=false` while a repair is still pending;
- exposes `safeAfterReviewedRepairs=true` only when no unexplained divergence remains.

The `--validate-repair-plan` mode is for CI/review of the proposed metadata plan. After any authorized repair, the normal remote comparison must be rerun and must report `safeForOrderedPush=true` before a remote `db push --dry-run`.

## Assignment-push implication

This removes a tooling gap in the due-reminder release path but does not close the acceptance row. The assigned/due push item remains open until migration history is safely reconciled, pending migrations are staged and tested, `bq-assignment-reminders` is deployed/configured, the scheduler is configured, and a synthetic due assignment proves end-to-end delivery. Physical-device push remains a separate gate.
