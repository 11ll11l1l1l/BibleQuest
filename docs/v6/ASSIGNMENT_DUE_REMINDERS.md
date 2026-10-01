# V6 assignment due reminders

The reminder path creates a durable Notification Center row for each active, incomplete assignment recipient. It uses an explicit 'reminder_at' when that time is not later than 'due_at'; otherwise it defaults to 24 hours before 'due_at'. A future 'schedule_at' delays the reminder until the assignment opens. The enqueue function catches up reminders scheduled in the prior 24 hours and processes at most 100 recipients per run.

Database idempotency prevents duplicate due reminders for the same assignment and user. Recipients must still be active members of the assignment's congregation and match the assignment audience. Completed members, assignment authors for congregation/team/group audiences, inactive assignments, and unopened scheduled assignments are excluded. Push uses the existing canonical delivery function and assignment-category preference, quiet-hours, subscription cleanup, retry and rate-control paths; the durable inbox row remains available if push is unavailable.

## Canonical deployment contract

The Edge Function is service-only. Supabase gateway JWT verification is disabled because the scheduler is not a user session. The function independently validates a dedicated scheduler secret by reading Vault through its server-only database connection. No public RPC is added for this check. The scheduler secret is generated inside Vault and its value is never returned, committed, or stored in cron.job.command.

The canonical scheduler definition is 'supabase/ops/assignment-due-reminder-cron.sql'. Do not create a second hand-written Cron definition from this document.

Required deployment order:

1. Reconcile/verify migration history and apply the reviewed V6 migrations, including '20260928140000_assignment_due_reminders.sql' and the later assignment-push retry migration.
2. Deploy 'bq-assignment-reminders' from the same reviewed V6 candidate.
3. Enable 'pg_cron'; 'pg_net' must also be present.
4. Store 'bq_assignment_reminder_project_url' in Vault. This is the public BibleQuest Supabase project URL, not a credential.
5. Apply 'supabase/ops/assignment-due-reminder-cron.sql'. The script creates 'bq_assignment_reminder_scheduler_secret' inside Vault if it is absent and schedules the job without exposing the secret value.
6. Verify the Cron row:
   - job name: 'bq-assignment-due-reminders-v6'
   - schedule: every five minutes ('*/5 * * * *')
   - active: true
7. Confirm a synthetic due assignment creates exactly one 'assignment_due' notification for each eligible incomplete recipient and dispatches through 'bq-push-delivery'.
8. Re-run/observe another scheduler interval and prove the idempotency boundary: no duplicate due notification is created.
9. Remove only the disposable test assignment/notification data.

## Physical-device closeout

After the scheduler path above is live in the intended release environment, run P3 in 'docs/v6/V6_PUSH_DEVICE_FIELD_RUNBOOK.md' on the same exact V6 candidate. Source/database acceptance is not physical-device evidence.

## Current acceptance boundary

Code, disposable database tests, or a checked-in Cron script do not mean the scheduler is active. The assignment assigned/due push checklist row remains open until the reviewed migration/function/Cron path is live and synthetic end-to-end delivery succeeds. Physical-device push and the combined browser/service-worker + physical-device row remain separate gates.
