# V6 assignment due reminders

The reminder path creates a durable Notification Center row for each active, incomplete assignment recipient. It uses an explicit `reminder_at` when that time is not later than `due_at`; otherwise it defaults to 24 hours before `due_at`. A future `schedule_at` delays the reminder until the assignment opens. The enqueue function catches up reminders scheduled in the prior 24 hours and processes at most 100 recipients per run.

Database idempotency prevents duplicate due reminders for the same assignment and user. Recipients must still be active members of the assignment's congregation and match the assignment audience. Completed members, assignment authors for congregation/team/group audiences, inactive assignments, and unopened scheduled assignments are excluded. Push uses the existing delivery function and category preference, quiet-hours, subscription cleanup, and rate-control path; the durable inbox row remains available if push is unavailable.

## Deployment and schedule

The Edge Function is intentionally service-only. Its Supabase gateway JWT verification is disabled because the scheduler sends a server secret; the function independently checks that secret against the configured Supabase service key. Never put that key in the client bundle or repository.

1. Apply migrations and deploy `bq-assignment-reminders` with the same candidate SHA.
2. Enable Supabase Cron (`pg_cron`) and `pg_net` for the project.
3. Store the project API URL and service-role secret in Vault. Run this in the Supabase SQL Editor with the real values in place of the placeholders:

```sql
select vault.create_secret('https://<project-ref>.supabase.co', 'bq_supabase_url');
select vault.create_secret('<service-role-secret>', 'bq_assignment_reminder_service_key');
```

4. Create or replace the one-minute job:

```sql
select cron.unschedule(jobid)
from cron.job
where jobname = 'bq-assignment-due-reminders';

select cron.schedule(
  'bq-assignment-due-reminders',
  '* * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'bq_supabase_url')
      || '/functions/v1/bq-assignment-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'bq_assignment_reminder_service_key'
      )
    ),
    body := '{}'::jsonb
  );
  $job$
);
```

5. Confirm executions in Cron job history and confirm a synthetic due assignment creates one `assignment_due` notification and dispatches through `bq-push-delivery`. Remove the synthetic assignment and its notifications afterward.

Code and disposable-database tests do not mean this schedule is active in production. Production acceptance remains open until the migration and function are deployed, the Vault-backed job runs successfully, and delivery is verified with the project's configured push credentials.
