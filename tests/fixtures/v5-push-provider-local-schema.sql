-- Test-only minimal local schema for the V5 genuine browser push-provider E2E.
-- This file is copied into an ephemeral Supabase CLI project; it is never applied
-- to the hosted BibleQuest project.

create extension if not exists pgcrypto;

create table if not exists public.bible_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null default 'info',
  title text not null,
  body text not null default '',
  action_kind text,
  created_at timestamptz not null default now()
);

alter table public.bible_notifications enable row level security;
revoke all on table public.bible_notifications from public, anon, authenticated;
grant select, insert, update, delete on table public.bible_notifications to service_role;

-- The production project already permits the service-role sender to read/delete
-- subscriptions. Reproduce that effective privilege in the isolated local stack
-- after the checked-in push-subscription migration runs.
