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

## Fail-closed migration preflight

Before any staging or production database push, export the reviewed target migration history as JSON with `version` and `name` fields and run:

```bash
npm run check:v6-assignment-push-release -- --remote-json /path/to/remote-migrations.json
```

The command is read-only. It requires the canonical `assignment_due_reminders` migration to be either:

- already recorded at the exact repository version; or
- safely pending inside an ordered migration tail with no version/name divergence, remote-only migration, or older unapplied migration behind the remote tip.

It exits non-zero on the current production divergence where logical telemetry migrations are recorded under different versions. That failure is intentional: first prove schema equivalence and reconcile migration history through the reviewed Supabase repair process, then rerun the preflight. The preflight never repairs history and never applies SQL.

## Production-safe release sequence

Do not execute these steps without explicit production authorization.

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
