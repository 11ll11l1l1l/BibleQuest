-- BibleQuest V6 assignment due-reminder scheduler.
-- OPERATOR-APPLIED ONLY: do not run against production without explicit release authorization.
--
-- Prerequisites:
--   1. Deploy the checked-in bq-assignment-reminders Edge Function.
--   2. Store the project URL in Supabase Vault as bq_assignment_reminder_project_url.
--
-- The scheduler authentication secret is generated inside Vault when absent.
-- Its value is never returned, embedded in repository source, or copied into
-- cron.job.command. The scheduled command resolves it from Vault at runtime.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $bq_assignment_due_scheduler$
declare
  project_url_present boolean;
  scheduler_secret_present boolean;
begin
  select exists(
    select 1
    from vault.decrypted_secrets
    where name = 'bq_assignment_reminder_project_url'
      and nullif(trim(decrypted_secret), '') is not null
  ) into project_url_present;

  if not project_url_present then
    raise exception
      'BibleQuest assignment reminder scheduler requires Vault secret bq_assignment_reminder_project_url';
  end if;

  select exists(
    select 1
    from vault.decrypted_secrets
    where name = 'bq_assignment_reminder_scheduler_secret'
      and nullif(trim(decrypted_secret), '') is not null
  ) into scheduler_secret_present;

  if not scheduler_secret_present then
    perform vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'bq_assignment_reminder_scheduler_secret',
      'BibleQuest V6 assignment reminder scheduler authentication secret'
    );
  end if;

  perform cron.unschedule(jobid)
  from cron.job
  where jobname = 'bq-assignment-due-reminders-v6';

  perform cron.schedule(
    'bq-assignment-due-reminders-v6',
    '*/5 * * * *',
    $cron$
      select net.http_post(
        url := rtrim(
          (select decrypted_secret from vault.decrypted_secrets
            where name = 'bq_assignment_reminder_project_url'),
          '/'
        ) || '/functions/v1/bq-assignment-reminders',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-BQ-Assignment-Reminder-Secret', (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'bq_assignment_reminder_scheduler_secret'
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      ) as request_id;
    $cron$
  );
end
$bq_assignment_due_scheduler$;

-- Verification query (safe: no secret values):
-- select jobid, jobname, schedule, active
-- from cron.job
-- where jobname = 'bq-assignment-due-reminders-v6';
