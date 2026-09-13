-- BibleQuest completion stage: leader assignments, congregation presence, and avatar cosmetics.
-- All new browser-facing objects remain isolated in the bible_* namespace.

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
  where m.congregation_id=target_congregation and m.user_id=viewer and m.active
  limit 1;
  if viewer_role is null then return false; end if;
  if viewer_role in ('facilitator','leader','admin') then return true; end if;
  if target_scope='all' then return true; end if;
  if target_scope='member' then return target_id=viewer; end if;
  if target_scope='team' then
    return exists(
      select 1 from public.bible_team_members tm
      where tm.team_id=target_id and tm.user_id=viewer
    );
  end if;
  return false;
end;$$;
revoke all on function private.bible_assignment_visible(uuid,text,uuid) from public;
grant execute on function private.bible_assignment_visible(uuid,text,uuid) to authenticated;

create table if not exists public.bible_assignments(
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 120),
  instructions text not null default '',
  assignment_type text not null default 'custom' check (assignment_type in ('reading','guided-study','mission','quiz','reflection','couples','group','custom')),
  scripture_refs text[] not null default '{}',
  target_scope text not null default 'all' check (target_scope in ('all','member','team')),
  target_id uuid,
  due_at timestamptz,
  points integer not null default 5 check (points between 0 and 25),
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((target_scope='all' and target_id is null) or (target_scope in ('member','team') and target_id is not null))
);
alter table public.bible_assignments enable row level security;
create index if not exists bible_assignments_congregation_due_idx on public.bible_assignments(congregation_id,active,due_at,created_at desc);
create index if not exists bible_assignments_creator_idx on public.bible_assignments(created_by);
create index if not exists bible_assignments_target_idx on public.bible_assignments(target_scope,target_id) where target_id is not null;
drop policy if exists "assignments visible members" on public.bible_assignments;
create policy "assignments visible members" on public.bible_assignments for select to authenticated
using (active and private.bible_assignment_visible(congregation_id,target_scope,target_id));
grant select on public.bible_assignments to authenticated;

create table if not exists public.bible_assignment_progress(
  assignment_id uuid not null references public.bible_assignments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'assigned' check (status in ('assigned','started','completed')),
  submission text,
  leader_feedback text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(assignment_id,user_id)
);
alter table public.bible_assignment_progress enable row level security;
create index if not exists bible_assignment_progress_user_status_idx on public.bible_assignment_progress(user_id,status,updated_at desc);
drop policy if exists "assignment progress visible" on public.bible_assignment_progress;
create policy "assignment progress visible" on public.bible_assignment_progress for select to authenticated
using (
  user_id=(select auth.uid()) or exists(
    select 1 from public.bible_assignments a
    where a.id=assignment_id
      and private.bible_role_in_congregation(a.congregation_id) in ('facilitator','leader','admin')
  )
);
grant select on public.bible_assignment_progress to authenticated;

create table if not exists public.bible_presence(
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  surface text not null default 'BibleQuest',
  primary key(congregation_id,user_id)
);
alter table public.bible_presence enable row level security;
create index if not exists bible_presence_recent_idx on public.bible_presence(congregation_id,last_seen_at desc);
drop policy if exists "presence congregation read" on public.bible_presence;
create policy "presence congregation read" on public.bible_presence for select to authenticated
using (private.is_bible_congregation_member(congregation_id));
drop policy if exists "presence own insert" on public.bible_presence;
create policy "presence own insert" on public.bible_presence for insert to authenticated
with check (user_id=(select auth.uid()) and private.is_bible_congregation_member(congregation_id));
drop policy if exists "presence own update" on public.bible_presence;
create policy "presence own update" on public.bible_presence for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()) and private.is_bible_congregation_member(congregation_id));
drop policy if exists "presence own delete" on public.bible_presence;
create policy "presence own delete" on public.bible_presence for delete to authenticated using (user_id=(select auth.uid()));
grant select,insert,update,delete on public.bible_presence to authenticated;

create table if not exists public.bible_avatar_cosmetics(
  user_id uuid primary key references auth.users(id) on delete cascade,
  selected_style text not null default 'starter',
  updated_at timestamptz not null default now()
);
alter table public.bible_avatar_cosmetics enable row level security;
drop policy if exists "avatar cosmetics own read" on public.bible_avatar_cosmetics;
create policy "avatar cosmetics own read" on public.bible_avatar_cosmetics for select to authenticated using (user_id=(select auth.uid()));
drop policy if exists "avatar cosmetics own insert" on public.bible_avatar_cosmetics;
create policy "avatar cosmetics own insert" on public.bible_avatar_cosmetics for insert to authenticated with check (user_id=(select auth.uid()));
drop policy if exists "avatar cosmetics own update" on public.bible_avatar_cosmetics;
create policy "avatar cosmetics own update" on public.bible_avatar_cosmetics for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
grant select,insert,update on public.bible_avatar_cosmetics to authenticated;

-- Realtime gives members an in-app "pushed" assignment experience and a lightweight online strip.
do $$ begin
  alter publication supabase_realtime add table public.bible_assignments;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.bible_assignment_progress;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.bible_presence;
exception when duplicate_object then null; end $$;
