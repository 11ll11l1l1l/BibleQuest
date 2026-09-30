-- BibleQuest V6 assignment due-reminder scheduler.
-- OPERATOR-APPLIED ONLY: do not run against production without explicit release authorization.
--
-- Prerequisites:
--   1. Deploy the checked-in bq-assignment-reminders Edge Function.
--   2. Store the project URL in Supabase Vault as bq_assignment_reminder_project_url.
--   3. Store one server-only Supabase secret key accepted by the Edge Function
--      in Vault as bq_assignment_reminder_secret_key.
--
-- Secret VALUES are intentionally never interpolated into cron.job.command.
-- The scheduled command resolves both secrets from Vault only at execution time.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $bq_assignment_due_scheduler$
declare
  project_url_present boolean;
  secret_key_present boolean;
begin
  select exists(
    select 1
    from vault.decrypted_secrets
    where name = 'bq_assignment_reminder_project_url'
      and nullif(trim(decrypted_secret), '') is not null
  ) into project_url_present;

  select exists(
    select 1
    from vault.decrypted_secrets
    where name = 'bq_assignment_reminder_secret_key'
      and nullif(trim(decrypted_secret), '') is not null
  ) into secret_key_present;

  if not project_url_present or not secret_key_present then
    raise exception
      'BibleQuest assignment reminder scheduler requires Vault secrets bq_assignment_reminder_project_url and bq_assignment_reminder_secret_key';
  end if;

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
          'Authorization', 'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets
            where name = 'bq_assignment_reminder_secret_key'
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
