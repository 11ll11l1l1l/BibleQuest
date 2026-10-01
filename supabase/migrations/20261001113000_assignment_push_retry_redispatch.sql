-- Re-dispatch recent assignment Web Push notifications whose transient
-- delivery backoff has elapsed.
--
-- The existing assignment reminder scheduler already runs every five minutes.
-- Reuse that trusted service-only path instead of introducing a second push
-- scheduler. The canonical bq-push-delivery sender remains authoritative for
-- subscription preferences, quiet hours, delivery claims, retries and cleanup.

create index if not exists bible_push_retry_state_due_idx
  on public.bible_push_retry_state (next_retry_at, notification_id);

create or replace function public.bible_enqueue_assignment_due_notifications_v6()
returns table(notification_id uuid)
language sql
security definer
set search_path = pg_catalog, public
set row_security = off
as $$
  with due_assignments as materialized (
    select
      a.id,
      a.congregation_id,
      a.created_by,
      a.title,
      a.instructions,
      a.target_scope,
      a.target_id,
      a.due_at
    from public.bible_assignments a
    where a.active is true
      and a.due_at is not null
      and exists (
        select 1 from public.bible_congregations c
        where c.id = a.congregation_id and c.active is true
      )
      and (a.schedule_at is null or a.schedule_at <= clock_timestamp())
      and greatest(
        coalesce(a.reminder_at, a.due_at - interval '24 hours'),
        coalesce(a.schedule_at, a.created_at)
      ) <= clock_timestamp()
      and greatest(
        coalesce(a.reminder_at, a.due_at - interval '24 hours'),
        coalesce(a.schedule_at, a.created_at)
      ) > clock_timestamp() - interval '24 hours'
      and (
        a.reminder_at is null
        or a.reminder_at <= a.due_at
      )
  ), eligible_recipients as materialized (
    select
      a.id as assignment_id,
      a.congregation_id,
      a.created_by,
      a.title,
      a.instructions,
      a.due_at,
      cm.user_id
    from due_assignments a
    join public.bible_congregation_members cm
      on cm.congregation_id = a.congregation_id
     and cm.active is true
    left join public.bible_teams team
      on a.target_scope = 'team'
     and team.id = a.target_id
     and team.congregation_id = a.congregation_id
     and team.active is true
    left join public.bible_groups target_group
      on a.target_scope = 'group'
     and target_group.id = a.target_id
     and target_group.congregation_id = a.congregation_id
     and target_group.active is true
    left join public.bible_team_members tm
      on a.target_scope = 'team'
     and tm.team_id = team.id
     and tm.user_id = cm.user_id
    left join public.bible_group_members gm
      on a.target_scope = 'group'
     and gm.group_id = target_group.id
     and gm.user_id = cm.user_id
     and gm.active is true
    left join public.bible_assignment_progress progress
      on progress.assignment_id = a.id
     and progress.user_id = cm.user_id
     and progress.status = 'completed'
    where progress.assignment_id is null
      and (
        (a.target_scope = 'all' and cm.user_id is distinct from a.created_by)
        or (a.target_scope = 'member' and cm.user_id = a.target_id)
        or (a.target_scope = 'team' and team.id is not null and tm.user_id is not null and cm.user_id is distinct from a.created_by)
        or (a.target_scope = 'group' and target_group.id is not null and gm.user_id is not null and cm.user_id is distinct from a.created_by)
      )
      and not exists (
        select 1
        from public.bible_notifications existing
        where existing.user_id = cm.user_id
          and existing.notification_type = 'assignment_due'
          and existing.action_kind = 'assignment'
          and existing.action_payload->>'assignment_id' = a.id::text
          and existing.action_payload->>'reminder_kind' = 'due'
      )
    order by a.due_at asc, a.id, cm.user_id
    limit 100
  ), inserted as (
    insert into public.bible_notifications (
      user_id,
      congregation_id,
      created_by,
      notification_type,
      delivery_category,
      title,
      body,
      action_kind,
      action_payload
    )
    select
      r.user_id,
      r.congregation_id,
      r.created_by,
      'assignment_due',
      'assignments',
      'Assignment due soon: ' || left(r.title, 88),
      'Due ' || to_char(r.due_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI') || ' UTC. ' || left(r.instructions, 180),
      'assignment',
      jsonb_build_object(
        'assignment_id', r.assignment_id,
        'reminder_kind', 'due',
        'due_at', r.due_at
      )
    from eligible_recipients r
    on conflict do nothing
    returning id
  ), retry_ready as materialized (
    select n.id as notification_id
    from public.bible_notifications n
    join public.bible_push_retry_state retry
      on retry.notification_id = n.id
    where n.delivery_category = 'assignments'
      and n.action_kind = 'assignment'
      -- Leave margin before bq-push-delivery's 15-minute freshness boundary.
      and n.created_at >= clock_timestamp() - interval '14 minutes'
      and retry.next_retry_at <= clock_timestamp()
    group by n.id
    order by min(retry.next_retry_at) asc, n.id
    limit 25
  )
  select inserted.id from inserted
  union
  select retry_ready.notification_id from retry_ready;
$$;

revoke all on function public.bible_enqueue_assignment_due_notifications_v6() from public, anon, authenticated;
grant execute on function public.bible_enqueue_assignment_due_notifications_v6() to service_role;

comment on function public.bible_enqueue_assignment_due_notifications_v6() is
  'Creates idempotent due reminders and returns a bounded set of recent assignment notifications whose transient push retry backoff has elapsed; service_role only.';
