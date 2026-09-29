-- Keep assignment recipient joins attached to the assignment's own congregation.
-- Trusted writes currently validate targets, but these read/notification boundaries
-- must also fail closed if historical or privileged data contains a mismatched ID.

create or replace function private.bible_assignment_visible(
  target_congregation uuid,
  target_scope text,
  target_id uuid
) returns boolean
language plpgsql stable security definer set search_path=''
as $$
declare
  viewer uuid := (select auth.uid());
  viewer_role text;
begin
  if viewer is null then return false; end if;

  select m.role into viewer_role
  from public.bible_congregation_members m
  where m.congregation_id = target_congregation
    and m.user_id = viewer
    and m.active
  limit 1;

  if viewer_role is null then return false; end if;
  if viewer_role in ('facilitator', 'leader', 'pastor', 'admin') then return true; end if;
  if target_scope = 'all' then return true; end if;
  if target_scope = 'member' then return target_id = viewer; end if;
  if target_scope = 'team' then
    return exists (
      select 1
      from public.bible_team_members tm
      join public.bible_teams t
        on t.id = tm.team_id
       and t.congregation_id = target_congregation
       and t.active
      where tm.team_id = target_id
        and tm.user_id = viewer
    );
  end if;
  if target_scope = 'group' then
    return exists (
      select 1
      from public.bible_group_members gm
      join public.bible_groups g
        on g.id = gm.group_id
       and g.congregation_id = target_congregation
       and g.active
      where gm.group_id = target_id
        and gm.user_id = viewer
        and gm.active
    );
  end if;
  return false;
end;
$$;

revoke all on function private.bible_assignment_visible(uuid, text, uuid) from public;
grant execute on function private.bible_assignment_visible(uuid, text, uuid) to authenticated;

create or replace function public.bq_notify_assignment()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  r record;
begin
  if new.active is not true then return new; end if;

  if new.target_scope = 'member' and new.target_id is not null then
    insert into public.bible_notifications (
      user_id, congregation_id, created_by, notification_type, delivery_category,
      title, body, action_kind, action_payload
    )
    select cm.user_id, new.congregation_id, new.created_by, 'assignment', 'assignments',
      'New assignment: ' || new.title, left(new.instructions, 300), 'assignment',
      jsonb_build_object('assignment_id', new.id)
    from public.bible_congregation_members cm
    where cm.congregation_id = new.congregation_id
      and cm.user_id = new.target_id
      and cm.active;
  elsif new.target_scope = 'team' and new.target_id is not null then
    for r in
      select tm.user_id
      from public.bible_team_members tm
      join public.bible_teams t
        on t.id = tm.team_id
       and t.congregation_id = new.congregation_id
       and t.active
      join public.bible_congregation_members cm
        on cm.user_id = tm.user_id
       and cm.congregation_id = new.congregation_id
       and cm.active
      where tm.team_id = new.target_id
    loop
      if r.user_id is distinct from new.created_by then
        insert into public.bible_notifications (
          user_id, congregation_id, created_by, notification_type, delivery_category,
          title, body, action_kind, action_payload
        ) values (
          r.user_id, new.congregation_id, new.created_by, 'assignment', 'assignments',
          'New assignment: ' || new.title, left(new.instructions, 300), 'assignment',
          jsonb_build_object('assignment_id', new.id)
        );
      end if;
    end loop;
  elsif new.target_scope = 'group' and new.target_id is not null then
    for r in
      select gm.user_id
      from public.bible_group_members gm
      join public.bible_groups g
        on g.id = gm.group_id
       and g.congregation_id = new.congregation_id
       and g.active
      join public.bible_congregation_members cm
        on cm.user_id = gm.user_id
       and cm.congregation_id = new.congregation_id
       and cm.active
      where gm.group_id = new.target_id
        and gm.active
    loop
      if r.user_id is distinct from new.created_by then
        insert into public.bible_notifications (
          user_id, congregation_id, created_by, notification_type, delivery_category,
          title, body, action_kind, action_payload
        ) values (
          r.user_id, new.congregation_id, new.created_by, 'assignment', 'assignments',
          'New assignment: ' || new.title, left(new.instructions, 300), 'assignment',
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
          user_id, congregation_id, created_by, notification_type, delivery_category,
          title, body, action_kind, action_payload
        ) values (
          r.user_id, new.congregation_id, new.created_by, 'assignment', 'assignments',
          'New assignment: ' || new.title, left(new.instructions, 300), 'assignment',
          jsonb_build_object('assignment_id', new.id)
        );
      end if;
    end loop;
  end if;
  return new;
end;
$$;
