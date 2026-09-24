-- BibleQuest V6: attach explicit canonical delivery categories to notifications
-- that are already produced by the released V5 database triggers.
--
-- This migration does NOT backfill legacy notification rows and does NOT create
-- new product notification producers. In particular, group encouragement rows
-- remain realtime/community data only until a separately reviewed notification
-- producer is introduced.
--
-- Exact mappings:
--   assignment / assignment feedback -> assignments
--   ministry announcement            -> announcements
--   ministry encouragement           -> encouragement
--   other ministry messages / polls  -> ministry
--   recognition / award              -> NULL (ambiguous; fail closed)

create or replace function public.bq_notify_congregation_members()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
  category text;
begin
  if tg_table_name = 'bible_ministry_messages' then
    if new.active is not true or new.publish_at > now() then
      return new;
    end if;

    category := case new.message_type
      when 'announcement' then 'announcements'
      when 'encouragement' then 'encouragement'
      else 'ministry'
    end;

    for r in
      select user_id
      from public.bible_congregation_members
      where congregation_id = new.congregation_id
        and active
    loop
      if r.user_id is distinct from new.created_by then
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
        ) values (
          r.user_id,
          new.congregation_id,
          new.created_by,
          new.message_type,
          category,
          new.title,
          left(new.body, 300),
          'ministry',
          jsonb_build_object('message_id', new.id)
        );
      end if;
    end loop;

  elsif tg_table_name = 'bible_polls' then
    if new.active is not true
       or (new.scheduled_at is not null and new.scheduled_at > now()) then
      return new;
    end if;

    for r in
      select user_id
      from public.bible_congregation_members
      where congregation_id = new.congregation_id
        and active
    loop
      if r.user_id is distinct from new.created_by then
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
        ) values (
          r.user_id,
          new.congregation_id,
          new.created_by,
          'poll',
          'ministry',
          'New congregation poll',
          left(new.prompt, 240),
          'ministry',
          jsonb_build_object('poll_id', new.id)
        );
      end if;
    end loop;

  elsif tg_table_name = 'bible_member_recognitions' then
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
    ) values (
      new.user_id,
      new.congregation_id,
      new.awarded_by,
      'award',
      null,
      new.title,
      coalesce(new.note, ''),
      'recognition',
      jsonb_build_object('recognition_id', new.id)
    );
  end if;

  return new;
end;
$$;

create or replace function public.bq_notify_assignment()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
begin
  if new.active is not true then
    return new;
  end if;

  if new.target_scope = 'member' and new.target_id is not null then
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
    ) values (
      new.target_id,
      new.congregation_id,
      new.created_by,
      'assignment',
      'assignments',
      'New assignment: ' || new.title,
      left(new.instructions, 300),
      'assignment',
      jsonb_build_object('assignment_id', new.id)
    );

  elsif new.target_scope = 'team' and new.target_id is not null then
    for r in
      select tm.user_id
      from public.bible_team_members tm
      join public.bible_congregation_members cm
        on cm.user_id = tm.user_id
       and cm.congregation_id = new.congregation_id
       and cm.active
      where tm.team_id = new.target_id
    loop
      if r.user_id is distinct from new.created_by then
        insert into public.bible_notifications (
          user_id, congregation_id, created_by, notification_type,
          delivery_category, title, body, action_kind, action_payload
        ) values (
          r.user_id, new.congregation_id, new.created_by, 'assignment',
          'assignments', 'New assignment: ' || new.title,
          left(new.instructions, 300), 'assignment',
          jsonb_build_object('assignment_id', new.id)
        );
      end if;
    end loop;

  elsif new.target_scope = 'group' and new.target_id is not null then
    for r in
      select gm.user_id
      from public.bible_group_members gm
      join public.bible_congregation_members cm
        on cm.user_id = gm.user_id
       and cm.congregation_id = new.congregation_id
       and cm.active
      where gm.group_id = new.target_id
        and gm.active
    loop
      if r.user_id is distinct from new.created_by then
        insert into public.bible_notifications (
          user_id, congregation_id, created_by, notification_type,
          delivery_category, title, body, action_kind, action_payload
        ) values (
          r.user_id, new.congregation_id, new.created_by, 'assignment',
          'assignments', 'New assignment: ' || new.title,
          left(new.instructions, 300), 'assignment',
          jsonb_build_object('assignment_id', new.id)
        );
      end if;
    end loop;

  else
    for r in
      select user_id
      from public.bible_congregation_members
      where congregation_id = new.congregation_id
        and active
    loop
      if r.user_id is distinct from new.created_by then
        insert into public.bible_notifications (
          user_id, congregation_id, created_by, notification_type,
          delivery_category, title, body, action_kind, action_payload
        ) values (
          r.user_id, new.congregation_id, new.created_by, 'assignment',
          'assignments', 'New assignment: ' || new.title,
          left(new.instructions, 300), 'assignment',
          jsonb_build_object('assignment_id', new.id)
        );
      end if;
    end loop;
  end if;

  return new;
end;
$$;

create or replace function public.bq_notify_assignment_feedback()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  a record;
begin
  if new.leader_feedback is distinct from old.leader_feedback
     and coalesce(new.leader_feedback, '') <> '' then
    select congregation_id, title, created_by
    into a
    from public.bible_assignments
    where id = new.assignment_id;

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
    ) values (
      new.user_id,
      a.congregation_id,
      a.created_by,
      'feedback',
      'assignments',
      'Leader feedback: ' || a.title,
      left(new.leader_feedback, 300),
      'assignment',
      jsonb_build_object('assignment_id', new.assignment_id)
    );
  end if;

  return new;
end;
$$;

-- Preserve the released trigger-only execution boundary after CREATE OR REPLACE.
revoke execute on function public.bq_notify_assignment()
  from public, anon, authenticated;
revoke execute on function public.bq_notify_assignment_feedback()
  from public, anon, authenticated;
revoke execute on function public.bq_notify_congregation_members()
  from public, anon, authenticated;

comment on function public.bq_notify_congregation_members() is
  'Released notification trigger with explicit V6 canonical delivery categories only where semantics are exact; recognition remains fail-closed.';
comment on function public.bq_notify_assignment() is
  'Released assignment notification trigger with explicit V6 assignments delivery category.';
comment on function public.bq_notify_assignment_feedback() is
  'Released assignment-feedback notification trigger with explicit V6 assignments delivery category.';
