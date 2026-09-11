-- BibleQuest v3 assignment response privacy boundary.
-- Peer-visible completion presence is physically separated from private response text.

-- Keep assignment audience authority deterministic on migration replay. This mirrors
-- the deployed helper: ministry roles can inspect congregation assignments; ordinary
-- members can see only assignments whose all/member/team/group audience contains them.
create or replace function private.bible_assignment_visible(
  target_congregation uuid,
  target_scope text,
  target_id uuid
) returns boolean
language plpgsql stable security definer set search_path=''
as $$
declare viewer uuid := (select auth.uid()); viewer_role text;
begin
  if viewer is null then return false; end if;
  select m.role into viewer_role
  from public.bible_congregation_members m
  where m.congregation_id=target_congregation
    and m.user_id=viewer
    and m.active
  limit 1;
  if viewer_role is null then return false; end if;
  if viewer_role in ('facilitator','leader','pastor','admin') then return true; end if;
  if target_scope='all' then return true; end if;
  if target_scope='member' then return target_id=viewer; end if;
  if target_scope='team' then
    return exists(
      select 1 from public.bible_team_members tm
      where tm.team_id=target_id and tm.user_id=viewer
    );
  end if;
  if target_scope='group' then
    return exists(
      select 1
      from public.bible_group_members gm
      join public.bible_groups g on g.id=gm.group_id
      where gm.group_id=target_id
        and gm.user_id=viewer
        and gm.active
        and g.active
        and g.congregation_id=target_congregation
    );
  end if;
  return false;
end;
$$;
revoke all on function private.bible_assignment_visible(uuid,text,uuid) from public;
grant execute on function private.bible_assignment_visible(uuid,text,uuid) to authenticated;

create table if not exists public.bible_assignment_response_presence (
  assignment_id uuid not null references public.bible_assignments(id) on delete cascade,
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Member',
  completed_at timestamptz not null,
  primary key (assignment_id, user_id)
);

create index if not exists bible_assignment_response_presence_congregation_idx
  on public.bible_assignment_response_presence(congregation_id, assignment_id, completed_at);

alter table public.bible_assignment_response_presence enable row level security;

revoke all on public.bible_assignment_response_presence from anon;
revoke insert, update, delete on public.bible_assignment_response_presence from authenticated;
grant select on public.bible_assignment_response_presence to authenticated;

drop policy if exists assignment_response_presence_select on public.bible_assignment_response_presence;
create policy assignment_response_presence_select
on public.bible_assignment_response_presence
for select
to authenticated
using (
  exists (
    select 1
    from public.bible_assignments a
    where a.id = bible_assignment_response_presence.assignment_id
      and a.congregation_id = bible_assignment_response_presence.congregation_id
      and a.active = true
      and private.bible_assignment_visible(a.congregation_id, a.target_scope, a.target_id)
  )
);

-- The trigger needs elevated rights because authenticated clients intentionally have no
-- write grant on the peer-visible projection. Keep the SECURITY DEFINER function in
-- the private schema, pin an empty search_path, fully qualify objects, and expose no
-- callable RPC surface to anon/authenticated roles.
create or replace function private.bible_sync_assignment_response_presence()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_congregation_id uuid;
  v_display_name text;
begin
  if tg_op = 'DELETE' then
    delete from public.bible_assignment_response_presence
    where assignment_id = old.assignment_id and user_id = old.user_id;
    return old;
  end if;

  if new.status <> 'completed' or new.completed_at is null then
    delete from public.bible_assignment_response_presence
    where assignment_id = new.assignment_id and user_id = new.user_id;
    return new;
  end if;

  select a.congregation_id into v_congregation_id
  from public.bible_assignments a
  where a.id = new.assignment_id;

  if v_congregation_id is null then
    return new;
  end if;

  select coalesce(nullif(trim(cm.display_name), ''), 'Member') into v_display_name
  from public.bible_congregation_members cm
  where cm.congregation_id = v_congregation_id
    and cm.user_id = new.user_id
    and cm.active = true
  limit 1;

  insert into public.bible_assignment_response_presence(
    assignment_id, congregation_id, user_id, display_name, completed_at
  ) values (
    new.assignment_id,
    v_congregation_id,
    new.user_id,
    coalesce(v_display_name, 'Member'),
    new.completed_at
  )
  on conflict (assignment_id, user_id) do update set
    congregation_id = excluded.congregation_id,
    display_name = excluded.display_name,
    completed_at = excluded.completed_at;

  return new;
end;
$$;

revoke all on function private.bible_sync_assignment_response_presence() from public;
revoke all on function private.bible_sync_assignment_response_presence() from anon;
revoke all on function private.bible_sync_assignment_response_presence() from authenticated;

drop trigger if exists bible_assignment_response_presence_sync on public.bible_assignment_progress;
create trigger bible_assignment_response_presence_sync
after insert or update of status, completed_at or delete
on public.bible_assignment_progress
for each row execute function private.bible_sync_assignment_response_presence();

insert into public.bible_assignment_response_presence(
  assignment_id, congregation_id, user_id, display_name, completed_at
)
select
  p.assignment_id,
  a.congregation_id,
  p.user_id,
  coalesce(nullif(trim(cm.display_name), ''), 'Member'),
  p.completed_at
from public.bible_assignment_progress p
join public.bible_assignments a on a.id = p.assignment_id
left join public.bible_congregation_members cm
  on cm.congregation_id = a.congregation_id
 and cm.user_id = p.user_id
 and cm.active = true
where p.status = 'completed'
  and p.completed_at is not null
on conflict (assignment_id, user_id) do update set
  congregation_id = excluded.congregation_id,
  display_name = excluded.display_name,
  completed_at = excluded.completed_at;
