alter table public.bible_groups
  add column if not exists congregation_id uuid references public.bible_congregations(id) on delete cascade,
  add column if not exists kind text not null default 'journey',
  add column if not exists description text not null default '',
  add column if not exists schedule_text text not null default '',
  add column if not exists max_members smallint not null default 6,
  add column if not exists invite_code_hash text,
  add column if not exists active boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname='bible_groups_max_members_check') then alter table public.bible_groups add constraint bible_groups_max_members_check check (max_members between 2 and 6); end if;
  if not exists (select 1 from pg_constraint where conname='bible_groups_kind_check') then alter table public.bible_groups add constraint bible_groups_kind_check check (kind in ('journey','small_group')); end if;
end $$;
create unique index if not exists bible_groups_invite_hash_uidx on public.bible_groups(invite_code_hash) where invite_code_hash is not null;
create index if not exists bible_groups_congregation_idx on public.bible_groups(congregation_id) where active;

create table if not exists public.bible_group_members(group_id uuid not null references public.bible_groups(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,role text not null default 'member' check (role in ('leader','member')),active boolean not null default true,joined_at timestamptz not null default now(),primary key(group_id,user_id));
create index if not exists bible_group_members_user_idx on public.bible_group_members(user_id) where active;
create table if not exists public.bible_daily_journey_status(user_id uuid not null references auth.users(id) on delete cascade,journey_date date not null,status text not null default 'started' check (status in ('started','complete')),completed_steps smallint not null default 0 check (completed_steps between 0 and 10),total_steps smallint not null default 5 check (total_steps between 1 and 10),season_key text,updated_at timestamptz not null default now(),primary key(user_id,journey_date));
create index if not exists bible_daily_journey_date_idx on public.bible_daily_journey_status(journey_date desc);
create table if not exists public.bible_group_encouragements(id bigint generated always as identity primary key,group_id uuid not null references public.bible_groups(id) on delete cascade,sender_id uuid not null references auth.users(id) on delete cascade,recipient_id uuid references auth.users(id) on delete cascade,kind text not null check (kind in ('pray','cheer','heart','word','flame')),created_at timestamptz not null default now());
create index if not exists bible_group_encouragements_group_idx on public.bible_group_encouragements(group_id,created_at desc);
alter table public.bible_groups enable row level security;alter table public.bible_group_members enable row level security;alter table public.bible_daily_journey_status enable row level security;alter table public.bible_group_encouragements enable row level security;

create or replace function private.is_bible_group_member(p_group_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select exists(select 1 from public.bible_group_members gm where gm.group_id=p_group_id and gm.user_id=(select auth.uid()) and gm.active)$$;
revoke all on function private.is_bible_group_member(uuid) from public,anon;grant execute on function private.is_bible_group_member(uuid) to authenticated;
create or replace function private.shares_bible_group(p_user_id uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$select p_user_id=(select auth.uid()) or exists(select 1 from public.bible_group_members mine join public.bible_group_members theirs on theirs.group_id=mine.group_id and theirs.active where mine.user_id=(select auth.uid()) and mine.active and theirs.user_id=p_user_id)$$;
revoke all on function private.shares_bible_group(uuid) from public,anon;grant execute on function private.shares_bible_group(uuid) to authenticated;

drop policy if exists "groups read own" on public.bible_groups;drop policy if exists "groups insert own" on public.bible_groups;drop policy if exists "journey groups member read" on public.bible_groups;create policy "journey groups member read" on public.bible_groups for select to authenticated using (owner_id=(select auth.uid()) or private.is_bible_group_member(id));
drop policy if exists "journey group members read" on public.bible_group_members;create policy "journey group members read" on public.bible_group_members for select to authenticated using (private.is_bible_group_member(group_id));
drop policy if exists "daily journey own insert" on public.bible_daily_journey_status;create policy "daily journey own insert" on public.bible_daily_journey_status for insert to authenticated with check ((select auth.uid())=user_id);
drop policy if exists "daily journey own update" on public.bible_daily_journey_status;create policy "daily journey own update" on public.bible_daily_journey_status for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
drop policy if exists "daily journey group read" on public.bible_daily_journey_status;create policy "daily journey group read" on public.bible_daily_journey_status for select to authenticated using (private.shares_bible_group(user_id));
drop policy if exists "encouragement group read" on public.bible_group_encouragements;create policy "encouragement group read" on public.bible_group_encouragements for select to authenticated using (private.is_bible_group_member(group_id));
drop policy if exists "encouragement group insert" on public.bible_group_encouragements;create policy "encouragement group insert" on public.bible_group_encouragements for insert to authenticated with check (sender_id=(select auth.uid()) and private.is_bible_group_member(group_id) and (recipient_id is null or exists(select 1 from public.bible_group_members gm where gm.group_id=bible_group_encouragements.group_id and gm.user_id=recipient_id and gm.active)));
grant select on public.bible_groups to authenticated;grant select on public.bible_group_members to authenticated;grant select,insert,update on public.bible_daily_journey_status to authenticated;grant select,insert on public.bible_group_encouragements to authenticated;grant usage,select on sequence public.bible_group_encouragements_id_seq to authenticated;
do $$ begin begin alter publication supabase_realtime add table public.bible_daily_journey_status; exception when duplicate_object then null; end;begin alter publication supabase_realtime add table public.bible_group_members; exception when duplicate_object then null; end;begin alter publication supabase_realtime add table public.bible_group_encouragements; exception when duplicate_object then null; end;end $$;
