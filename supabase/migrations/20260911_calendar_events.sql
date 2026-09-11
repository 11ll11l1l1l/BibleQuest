-- Calendar v1: personal calendar events only (device+account, own-row RLS).
-- Congregation-shared calendar entries, recurrence, and notification
-- integration are explicit follow-up scope, not built here.
create table if not exists public.bible_calendar_events(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text not null default '',
  event_date date not null,
  all_day boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bible_calendar_events_user_date_idx on public.bible_calendar_events(user_id,event_date);
alter table public.bible_calendar_events enable row level security;

drop policy if exists "calendar events self select" on public.bible_calendar_events;
create policy "calendar events self select" on public.bible_calendar_events for select to authenticated
using (user_id=(select auth.uid()));
drop policy if exists "calendar events self insert" on public.bible_calendar_events;
create policy "calendar events self insert" on public.bible_calendar_events for insert to authenticated
with check (user_id=(select auth.uid()));
drop policy if exists "calendar events self update" on public.bible_calendar_events;
create policy "calendar events self update" on public.bible_calendar_events for update to authenticated
using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));
drop policy if exists "calendar events self delete" on public.bible_calendar_events;
create policy "calendar events self delete" on public.bible_calendar_events for delete to authenticated
using (user_id=(select auth.uid()));

grant select,insert,update,delete on public.bible_calendar_events to authenticated;
