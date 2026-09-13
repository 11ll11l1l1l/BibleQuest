-- BibleQuest V5 Phase 4: minimum Web Push subscription persistence.
-- The in-app Notification Center remains the source of truth. This table stores
-- only browser delivery material plus explicit push-channel category choices.
-- Push is opt-in: enabled_categories defaults to an empty array.

create table if not exists public.bible_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  enabled_categories text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bible_push_subscriptions_endpoint_unique unique (endpoint),
  constraint bible_push_subscriptions_endpoint_length check (char_length(endpoint) between 20 and 4096),
  constraint bible_push_subscriptions_p256dh_length check (char_length(p256dh) between 16 and 1024),
  constraint bible_push_subscriptions_auth_length check (char_length(auth) between 8 and 512),
  constraint bible_push_subscriptions_categories_check check (
    enabled_categories <@ array['assignment','ministry','recognition','calendar','media']::text[]
  )
);

comment on table public.bible_push_subscriptions is
  'V5 browser push endpoints owned by one authenticated BibleQuest account; push categories are explicit opt-in and default off.';

alter table public.bible_push_subscriptions enable row level security;

revoke all on table public.bible_push_subscriptions from public, anon;
grant select, insert, update, delete on table public.bible_push_subscriptions to authenticated;

-- A browser endpoint may never be read or reassigned by another signed-in user.
-- The globally unique endpoint also prevents one physical subscription from
-- silently remaining attached to multiple BibleQuest accounts after account
-- switching; clients must remove the old owner before registering it elsewhere.
drop policy if exists "push subscriptions own rows" on public.bible_push_subscriptions;
create policy "push subscriptions own rows"
  on public.bible_push_subscriptions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index if not exists bible_push_subscriptions_user_idx
  on public.bible_push_subscriptions(user_id);
