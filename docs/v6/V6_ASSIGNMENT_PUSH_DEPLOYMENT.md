# BibleQuest V6 Assignment Push Deployment Handoff

Status checked: 2026-09-30.

## Acceptance target

The V6 checklist row `Assignment assigned/due push is supported.` must remain open until both assigned and due Web Push paths are operational on the intended deployed environment.

Physical-device push acceptance is a separate checklist row and must not be inferred from repository, database, or browser automation.

## Repository state

The repository contains:

- durable assignment notification production through `bq_notify_assignment()`;
- assignment creation dispatch through `supabase/functions/bq-assignment/index.ts`;
- the shared `bq-push-delivery` sender;
- `supabase/migrations/20260928140000_assignment_due_reminders.sql`, which adds the service-only, tenant-scoped, idempotent due-reminder enqueue function;
- `supabase/functions/bq-assignment-reminders/index.ts`, which enqueues due notifications and dispatches their notification IDs through `bq-push-delivery`;
- disposable pgTAP coverage for assignment producer categories and due reminders;
- service-worker push/click coverage for the canonical `/#/assignments` deep link;
- `supabase/ops/assignment-due-reminder-cron.sql`, an explicit operator-applied Cron setup.

## Connected-project observation

The connected BibleQuest Supabase project was inspected read-only on 2026-09-30.

Observed state:

- `pg_net` is installed;
- Supabase Vault is installed;
- `pg_cron` is available but not installed;
- the live migration history does not yet include the September 28 assignment-due-reminder migration;
- `public.bible_enqueue_assignment_due_notifications_v6()` is not present;
- `bq-assignment-reminders` is not deployed;
- `bq-assignment` and `bq-push-delivery` are deployed.

Therefore the repository due-reminder implementation is not yet a live due Web Push path.

## Production-safe release sequence

Do not execute these steps without explicit production authorization.


Before any repair or push, use the repository migration-history guard against a reviewed remote migration export. When a logical migration is already applied under a different timestamp, an operator may supply a separately reviewed equivalence file:

```bash
node scripts/v6-migration-history-guard.mjs \
  --remote-json /path/to/reviewed-remote-migrations.json \
  --equivalence-json /path/to/reviewed-equivalences.json \
  --validate-repair-plan
```

Each equivalence must identify the exact remote and local version/name pair, set `reviewed: true`, and cite independent schema-equivalence evidence. The guard validates the mapping and prints the exact metadata-only `supabase migration repair` commands, but never executes them. A valid plan is not itself push-safe: after an authorized metadata repair, rerun the guard without `--validate-repair-plan` and require `safeForOrderedPush: true` before `supabase db push --dry-run`.

After migration history is actually aligned, require the due-reminder migration itself to be exact and ordered before any push:

```bash
npm run check:v6-assignment-push-release -- \
  --remote-json /path/to/reviewed-remote-migrations.json
```

This second gate is also read-only. It exits non-zero unless the canonical `assignment_due_reminders` migration is either already recorded at its exact repository version or is safely pending in an ordered tail with no unresolved history repair, name/version conflict, remote-only migration, or older unapplied migration behind the remote tip. A reviewed repair plan by itself is intentionally insufficient; the history must first be repaired through an authorized process and re-exported.

1. Reconcile the production migration history against the authoritative V6 migration plan. Do not skip or manually fake migration-history entries.
2. Apply the reviewed V6 database migrations through the normal release path, including `20260928140000_assignment_due_reminders.sql`.
3. Deploy the exact reviewed `bq-assignment-reminders` Edge Function.
4. In Supabase Vault, configure:
   - `bq_assignment_reminder_project_url` with the project API URL;
   - `bq_assignment_reminder_secret_key` with one server-only Supabase secret accepted by the reminder Edge Function.
5. Apply `supabase/ops/assignment-due-reminder-cron.sql`.
6. Verify without exposing secret values:
   - `pg_cron` is installed;
   - one active Cron job named `bq-assignment-due-reminders-v6` exists on the expected five-minute schedule;
   - `public.bible_enqueue_assignment_due_notifications_v6()` exists and remains executable only by the trusted server role;
   - `bq-assignment-reminders` is active;
   - the scheduled invocation reaches the Edge Function successfully.
7. Create a disposable near-due assignment in a test congregation/account set and verify:
   - only eligible incomplete recipients receive one durable `assignment_due` notification;
   - a repeated scheduler run does not duplicate the reminder;
   - the notification dispatches through `bq-push-delivery`;
   - the resulting push payload resolves to `/#/assignments`.
8. Remove disposable test data and record exact migration/function/job evidence in the acceptance checklist.

## Security boundaries

- Never place a project server secret directly in repository SQL, GitHub Actions, `cron.job.command`, client code, logs, or diagnostics.
- The Cron command resolves its project URL and server secret from Supabase Vault at execution time.
- Browser roles must not be able to call the due-enqueue database function or impersonate the scheduler.
- Due notifications remain congregation-scoped and exclude completed recipients.
- Keep physical-device notification delivery as a separate field-evidence gate.
