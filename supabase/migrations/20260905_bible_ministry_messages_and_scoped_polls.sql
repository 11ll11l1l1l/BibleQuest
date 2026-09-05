alter table public.bible_polls
  add column if not exists congregation_id uuid references public.bible_congregations(id) on delete cascade,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists closes_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.bible_polls alter column congregation_id set not null;
create index if not exists bible_polls_congregation_created_idx on public.bible_polls(congregation_id, created_at desc);
create index if not exists bible_polls_created_by_idx on public.bible_polls(created_by) where created_by is not null;

alter table public.bible_polls enable row level security;
drop policy if exists "polls public read" on public.bible_polls;
drop policy if exists "polls congregation read" on public.bible_polls;
drop policy if exists "polls ministry insert" on public.bible_polls;
drop policy if exists "polls ministry update" on public.bible_polls;
create policy "polls congregation read" on public.bible_polls for select to authenticated
using (active = true and private.is_bible_congregation_member(congregation_id));
create policy "polls ministry insert" on public.bible_polls for insert to authenticated
with check (created_by=(select auth.uid()) and private.bible_role_in_congregation(congregation_id)=any(array['facilitator','leader','pastor','admin']::text[]));
create policy "polls ministry update" on public.bible_polls for update to authenticated
using (private.bible_role_in_congregation(congregation_id)=any(array['leader','pastor','admin']::text[]) or created_by=(select auth.uid()))
with check (private.bible_role_in_congregation(congregation_id)=any(array['leader','pastor','admin']::text[]) or created_by=(select auth.uid()));

drop policy if exists "votes insert own" on public.bible_poll_votes;
drop policy if exists "votes read own" on public.bible_poll_votes;
drop policy if exists "votes update own" on public.bible_poll_votes;
create policy "votes insert congregation own" on public.bible_poll_votes for insert to authenticated
with check ((select auth.uid())=user_id and exists(select 1 from public.bible_polls p where p.id=poll_id and p.active=true and private.is_bible_congregation_member(p.congregation_id) and (p.closes_at is null or p.closes_at>now()) and jsonb_typeof(p.options)='array' and option_index<jsonb_array_length(p.options)));
create policy "votes read own or ministry" on public.bible_poll_votes for select to authenticated
using ((select auth.uid())=user_id or exists(select 1 from public.bible_polls p where p.id=poll_id and private.bible_role_in_congregation(p.congregation_id)=any(array['facilitator','leader','pastor','admin']::text[])));
create policy "votes update congregation own" on public.bible_poll_votes for update to authenticated
using ((select auth.uid())=user_id)
with check ((select auth.uid())=user_id and exists(select 1 from public.bible_polls p where p.id=poll_id and p.active=true and private.is_bible_congregation_member(p.congregation_id) and (p.closes_at is null or p.closes_at>now()) and jsonb_typeof(p.options)='array' and option_index<jsonb_array_length(p.options)));

create table if not exists public.bible_ministry_messages (
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  message_type text not null default 'announcement' check (message_type in ('devotional','announcement','activity','encouragement')),
  title text not null check (char_length(title) between 2 and 120),
  body text not null check (char_length(body) between 1 and 6000),
  scripture_refs jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bible_ministry_messages_congregation_publish_idx on public.bible_ministry_messages(congregation_id,publish_at desc);
create index if not exists bible_ministry_messages_creator_idx on public.bible_ministry_messages(created_by) where created_by is not null;
alter table public.bible_ministry_messages enable row level security;
drop policy if exists "ministry messages congregation read" on public.bible_ministry_messages;
drop policy if exists "ministry messages leader insert" on public.bible_ministry_messages;
drop policy if exists "ministry messages leader update" on public.bible_ministry_messages;
create policy "ministry messages congregation read" on public.bible_ministry_messages for select to authenticated
using (active=true and publish_at<=now() and (expires_at is null or expires_at>now()) and private.is_bible_congregation_member(congregation_id));
create policy "ministry messages leader insert" on public.bible_ministry_messages for insert to authenticated
with check (created_by=(select auth.uid()) and private.bible_role_in_congregation(congregation_id)=any(array['facilitator','leader','pastor','admin']::text[]));
create policy "ministry messages leader update" on public.bible_ministry_messages for update to authenticated
using (private.bible_role_in_congregation(congregation_id)=any(array['leader','pastor','admin']::text[]) or created_by=(select auth.uid()))
with check (private.bible_role_in_congregation(congregation_id)=any(array['leader','pastor','admin']::text[]) or created_by=(select auth.uid()));

grant select,insert,update on public.bible_ministry_messages to authenticated;
grant select,insert,update on public.bible_polls to authenticated;
grant select,insert,update on public.bible_poll_votes to authenticated;