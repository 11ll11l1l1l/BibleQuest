-- BibleQuest innovation stage. Applied to the shared Karimen/BibleQuest project.
-- All browser-facing objects use the bible_* namespace and RLS.

create or replace function private.bible_role_in_congregation(target_congregation uuid)
returns text language sql stable security definer set search_path=''
as $$
  select m.role from public.bible_congregation_members m
  where m.congregation_id=target_congregation
    and m.user_id=(select auth.uid()) and m.active limit 1;
$$;
revoke all on function private.bible_role_in_congregation(uuid) from public;
grant execute on function private.bible_role_in_congregation(uuid) to authenticated;

alter table public.bible_shared_sessions
  add column if not exists room_code text,
  add column if not exists status text not null default 'active',
  add column if not exists state jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();
create unique index if not exists bible_shared_sessions_room_code_key on public.bible_shared_sessions(room_code) where room_code is not null;
create index if not exists bible_shared_sessions_congregation_status_idx on public.bible_shared_sessions(congregation_id,status,updated_at desc);

drop policy if exists "sessions member create" on public.bible_shared_sessions;
create policy "sessions controlled create" on public.bible_shared_sessions for insert to authenticated
with check (created_by=(select auth.uid()) and private.is_bible_congregation_member(congregation_id)
 and (session_type<>'live-room' or private.bible_role_in_congregation(congregation_id) in ('facilitator','leader','admin')));
drop policy if exists "sessions creator update" on public.bible_shared_sessions;
create policy "sessions creator update" on public.bible_shared_sessions for update to authenticated
using ((select auth.uid())=created_by and private.is_bible_congregation_member(congregation_id))
with check ((select auth.uid())=created_by and private.is_bible_congregation_member(congregation_id));

create table if not exists public.bible_room_responses(
  id uuid primary key default gen_random_uuid(),session_id uuid not null references public.bible_shared_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,round_no integer not null default 0,
  response jsonb not null default '{}'::jsonb,points integer not null default 0,created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),unique(session_id,user_id,round_no));
alter table public.bible_room_responses enable row level security;
create index if not exists bible_room_responses_session_round_idx on public.bible_room_responses(session_id,round_no,updated_at desc);
create policy "room responses facilitators read" on public.bible_room_responses for select to authenticated
using (exists(select 1 from public.bible_shared_sessions s where s.id=session_id and private.is_bible_congregation_member(s.congregation_id)
 and ((select auth.uid())=s.created_by or private.bible_role_in_congregation(s.congregation_id) in ('facilitator','leader','admin'))));
create policy "room responses self insert" on public.bible_room_responses for insert to authenticated
with check ((select auth.uid())=user_id and exists(select 1 from public.bible_shared_sessions s where s.id=session_id and private.is_bible_congregation_member(s.congregation_id)));
create policy "room responses self update" on public.bible_room_responses for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update on public.bible_room_responses to authenticated;

create or replace function public.bible_room_poll_totals(p_session uuid,p_round integer)
returns table(choice text,total bigint) language plpgsql stable security definer set search_path=''
as $$
declare v_congregation uuid;
begin
  select s.congregation_id into v_congregation from public.bible_shared_sessions s where s.id=p_session;
  if v_congregation is null or not private.is_bible_congregation_member(v_congregation) then raise exception 'Active congregation membership required'; end if;
  return query select coalesce(r.response->>'choice',''),count(*)::bigint from public.bible_room_responses r
    where r.session_id=p_session and r.round_no=p_round group by coalesce(r.response->>'choice','');
end;$$;
revoke all on function public.bible_room_poll_totals(uuid,integer) from public,anon;
grant execute on function public.bible_room_poll_totals(uuid,integer) to authenticated;

drop policy if exists "participants self update" on public.bible_session_participants;
create policy "participants self update" on public.bible_session_participants for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create table if not exists public.bible_challenges(
 id uuid primary key default gen_random_uuid(),congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
 created_by uuid not null references auth.users(id) on delete cascade,title text not null,challenge_type text not null default 'reading',template_key text,
 starts_on date not null default current_date,ends_on date,metadata jsonb not null default '{}'::jsonb,active boolean not null default true,created_at timestamptz not null default now());
alter table public.bible_challenges enable row level security;
create index if not exists bible_challenges_congregation_idx on public.bible_challenges(congregation_id,active,starts_on desc);
create policy "challenges congregation read" on public.bible_challenges for select to authenticated using (private.is_bible_congregation_member(congregation_id));
create policy "challenges leaders create" on public.bible_challenges for insert to authenticated with check ((select auth.uid())=created_by and private.bible_role_in_congregation(congregation_id) in ('facilitator','leader','admin'));
create policy "challenges creator update" on public.bible_challenges for update to authenticated using ((select auth.uid())=created_by and private.bible_role_in_congregation(congregation_id) in ('facilitator','leader','admin')) with check ((select auth.uid())=created_by and private.bible_role_in_congregation(congregation_id) in ('facilitator','leader','admin'));
grant select,insert,update on public.bible_challenges to authenticated;

create table if not exists public.bible_challenge_progress(
 challenge_id uuid not null references public.bible_challenges(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,
 day_key text not null,completed_at timestamptz not null default now(),metadata jsonb not null default '{}'::jsonb,primary key(challenge_id,user_id,day_key));
alter table public.bible_challenge_progress enable row level security;
create index if not exists bible_challenge_progress_user_idx on public.bible_challenge_progress(user_id,completed_at desc);
create policy "challenge progress congregation read" on public.bible_challenge_progress for select to authenticated using (exists(select 1 from public.bible_challenges c where c.id=challenge_id and private.is_bible_congregation_member(c.congregation_id)));
create policy "challenge progress self insert" on public.bible_challenge_progress for insert to authenticated with check ((select auth.uid())=user_id and exists(select 1 from public.bible_challenges c where c.id=challenge_id and private.is_bible_congregation_member(c.congregation_id)));
create policy "challenge progress self update" on public.bible_challenge_progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
grant select,insert,update on public.bible_challenge_progress to authenticated;

create table if not exists public.bible_bookmarks(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,book_code text,book_name text,chapter integer,verse_start integer,verse_end integer,label text,created_at timestamptz not null default now());
alter table public.bible_bookmarks enable row level security;
create index if not exists bible_bookmarks_user_idx on public.bible_bookmarks(user_id,created_at desc);
create policy "bookmarks own read" on public.bible_bookmarks for select to authenticated using ((select auth.uid())=user_id);
create policy "bookmarks own insert" on public.bible_bookmarks for insert to authenticated with check ((select auth.uid())=user_id);
create policy "bookmarks own delete" on public.bible_bookmarks for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,delete on public.bible_bookmarks to authenticated;

create table if not exists public.bible_highlights(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,book_code text not null,book_name text,chapter integer not null,verse_start integer not null,verse_end integer,color text not null default 'gold',created_at timestamptz not null default now(),unique(user_id,book_code,chapter,verse_start,color));
alter table public.bible_highlights enable row level security;
create index if not exists bible_highlights_user_ref_idx on public.bible_highlights(user_id,book_code,chapter,verse_start);
create policy "highlights own read" on public.bible_highlights for select to authenticated using ((select auth.uid())=user_id);
create policy "highlights own insert" on public.bible_highlights for insert to authenticated with check ((select auth.uid())=user_id);
create policy "highlights own delete" on public.bible_highlights for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,delete on public.bible_highlights to authenticated;

create table if not exists public.bible_couple_pairs(id uuid primary key default gen_random_uuid(),user_a uuid not null references auth.users(id) on delete cascade,user_b uuid references auth.users(id) on delete cascade,status text not null default 'pending',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(user_b is null or user_a<>user_b));
alter table public.bible_couple_pairs enable row level security;
create unique index if not exists bible_couple_pairs_active_a_idx on public.bible_couple_pairs(user_a) where status='active';
create unique index if not exists bible_couple_pairs_active_b_idx on public.bible_couple_pairs(user_b) where status='active';
create policy "couple pair members read" on public.bible_couple_pairs for select to authenticated using ((select auth.uid())=user_a or (select auth.uid())=user_b);
grant select on public.bible_couple_pairs to authenticated;

create table if not exists public.bible_couple_invites(id uuid primary key default gen_random_uuid(),pair_id uuid not null references public.bible_couple_pairs(id) on delete cascade,code_hash text not null unique,created_by uuid not null references auth.users(id) on delete cascade,expires_at timestamptz not null,used_by uuid references auth.users(id) on delete set null,created_at timestamptz not null default now());
alter table public.bible_couple_invites enable row level security;
revoke all on public.bible_couple_invites from anon,authenticated;

create table if not exists public.bible_couple_shared(id uuid primary key default gen_random_uuid(),pair_id uuid not null references public.bible_couple_pairs(id) on delete cascade,author_id uuid not null references auth.users(id) on delete cascade,item_type text not null default 'commitment',body text not null,due_on date,completed_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.bible_couple_shared enable row level security;
create index if not exists bible_couple_shared_pair_idx on public.bible_couple_shared(pair_id,created_at desc);
create policy "couple shared pair read" on public.bible_couple_shared for select to authenticated using (exists(select 1 from public.bible_couple_pairs p where p.id=pair_id and p.status='active' and ((select auth.uid())=p.user_a or (select auth.uid())=p.user_b)));
create policy "couple shared own insert" on public.bible_couple_shared for insert to authenticated with check ((select auth.uid())=author_id and exists(select 1 from public.bible_couple_pairs p where p.id=pair_id and p.status='active' and ((select auth.uid())=p.user_a or (select auth.uid())=p.user_b)));
create policy "couple shared pair update" on public.bible_couple_shared for update to authenticated using (exists(select 1 from public.bible_couple_pairs p where p.id=pair_id and p.status='active' and ((select auth.uid())=p.user_a or (select auth.uid())=p.user_b)));
grant select,insert,update on public.bible_couple_shared to authenticated;

-- The production migration also adds these three tables to the supabase_realtime publication:
-- bible_shared_sessions, bible_room_responses, bible_session_participants.
