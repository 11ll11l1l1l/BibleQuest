-- Read-only BibleQuest V6 assignment push production-readiness snapshot.
-- Returns booleans/counts only. It never returns Vault secret values, user IDs,
-- notification IDs, assignment IDs, endpoints, or other account data.

select jsonb_build_object(
  'schemaVersion', 1,
  'observedAt', clock_timestamp(),
  'extensions', jsonb_build_object(
    'pgCron', exists(select 1 from pg_extension where extname = 'pg_cron'),
    'pgNet', exists(select 1 from pg_extension where extname = 'pg_net')
  ),
  'dueFunction', jsonb_build_object(
    'exists', to_regprocedure('public.bible_enqueue_assignment_due_notifications_v6()') is not null,
    'securityDefiner', coalesce((
      select prosecdef
      from pg_proc
      where oid = to_regprocedure('public.bible_enqueue_assignment_due_notifications_v6()')
    ), false),
    'serviceRoleExecute', coalesce(
      has_function_privilege('service_role', 'public.bible_enqueue_assignment_due_notifications_v6()', 'EXECUTE'),
      false
    ),
    'authenticatedExecute', coalesce(
      has_function_privilege('authenticated', 'public.bible_enqueue_assignment_due_notifications_v6()', 'EXECUTE'),
      false
    ),
    'anonExecute', coalesce(
      has_function_privilege('anon', 'public.bible_enqueue_assignment_due_notifications_v6()', 'EXECUTE'),
      false
    ),
    'hasRetryReady', coalesce((
      select pg_get_functiondef(to_regprocedure('public.bible_enqueue_assignment_due_notifications_v6()')) like '%retry_ready%'
      where to_regprocedure('public.bible_enqueue_assignment_due_notifications_v6()') is not null
    ), false)
  ),
  'indexes', jsonb_build_object(
    'dueOnce', to_regclass('public.bible_notifications_assignment_due_once_idx') is not null,
    'dueScan', to_regclass('public.bible_assignments_active_due_reminder_idx') is not null,
    'retryDue', to_regclass('public.bible_push_retry_state_due_idx') is not null
  ),
  'scheduler', coalesce((
    select jsonb_build_object(
      'exists', true,
      'schedule', schedule,
      'active', active
    )
    from cron.job
    where jobname = 'bq-assignment-due-reminders-v6'
    order by jobid desc
    limit 1
  ), jsonb_build_object('exists', false, 'schedule', null, 'active', false)),
  'vaultNames', jsonb_build_object(
    'projectUrl', exists(
      select 1
      from vault.decrypted_secrets
      where name = 'bq_assignment_reminder_project_url'
        and nullif(trim(decrypted_secret), '') is not null
    ),
    'schedulerSecret', exists(
      select 1
      from vault.decrypted_secrets
      where name = 'bq_assignment_reminder_scheduler_secret'
        and nullif(trim(decrypted_secret), '') is not null
    )
  ),
  'migrationHistory', jsonb_build_object(
    'dueReminderCanonicalOrReviewedEquivalent', exists(
      select 1
      from supabase_migrations.schema_migrations
      where version = '20260928140000'
         or name = 'assignment_due_reminders_v6_20260928140000'
    ),
    'dueReminderCanonicalVersion', exists(
      select 1
      from supabase_migrations.schema_migrations
      where version = '20260928140000'
    ),
    'retryRedispatchCanonicalVersion', exists(
      select 1
      from supabase_migrations.schema_migrations
      where version = '20261001113000'
    )
  ),
  'last24Hours', jsonb_build_object(
    'cronSucceeded', coalesce((
      select count(*)
      from cron.job_run_details
      where jobid = (
        select jobid
        from cron.job
        where jobname = 'bq-assignment-due-reminders-v6'
        order by jobid desc
        limit 1
      )
        and status = 'succeeded'
        and start_time >= clock_timestamp() - interval '24 hours'
    ), 0),
    'cronFailed', coalesce((
      select count(*)
      from cron.job_run_details
      where jobid = (
        select jobid
        from cron.job
        where jobname = 'bq-assignment-due-reminders-v6'
        order by jobid desc
        limit 1
      )
        and status <> 'succeeded'
        and start_time >= clock_timestamp() - interval '24 hours'
    ), 0),
    'assignmentNotifications', (
      select count(*)
      from public.bible_notifications
      where notification_type in ('assignment', 'assignment_due')
        and created_at >= clock_timestamp() - interval '24 hours'
    ),
    'dueNotifications', (
      select count(*)
      from public.bible_notifications
      where notification_type = 'assignment_due'
        and created_at >= clock_timestamp() - interval '24 hours'
    ),
    'duePushDelivered', (
      select count(*)
      from public.bible_push_delivery_ledger ledger
      join public.bible_notifications notification
        on notification.id = ledger.notification_id
      where notification.notification_type = 'assignment_due'
        and ledger.delivered_at is not null
        and ledger.delivered_at >= clock_timestamp() - interval '24 hours'
    )
  ),
  'qaGap', jsonb_build_object(
    'dueAssignmentsNow', (
      select count(*)
      from public.bible_assignments assignment
      where assignment.active is true
        and assignment.due_at is not null
        and (assignment.schedule_at is null or assignment.schedule_at <= clock_timestamp())
        and greatest(
          coalesce(assignment.reminder_at, assignment.due_at - interval '24 hours'),
          coalesce(assignment.schedule_at, assignment.created_at)
        ) <= clock_timestamp()
        and greatest(
          coalesce(assignment.reminder_at, assignment.due_at - interval '24 hours'),
          coalesce(assignment.schedule_at, assignment.created_at)
        ) > clock_timestamp() - interval '24 hours'
    )
  )
) as assignment_push_readiness;
