-- BibleQuest V6: server-side notification delivery preference and quiet-hours contract.
--
-- This is deliberately additive. V5 notification_type/action_kind and the legacy
-- push enabled_categories column remain unchanged. V6 delivery requires an explicit
-- canonical delivery_category plus an explicit per-device V6 category opt-in.
-- Legacy rows therefore cannot accidentally enter the V6 sender path.

alter table public.bible_notifications
  add column if not exists delivery_category text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bible_notifications_v6_delivery_category_check'
      and conrelid = 'public.bible_notifications'::regclass
  ) then
    alter table public.bible_notifications
      add constraint bible_notifications_v6_delivery_category_check
      check (
        delivery_category is null
        or delivery_category = any (
          array['reading','assignments','ministry','announcements','encouragement','streaks']::text[]
        )
      );
  end if;
end $$;

comment on column public.bible_notifications.delivery_category is
  'Explicit V6 delivery category. NULL means the notification is not eligible for the V6 push sender; no legacy notification_type mapping is inferred.';

alter table public.bible_push_subscriptions
  add column if not exists v6_enabled_categories text[] not null default '{}'::text[];

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bible_push_subscriptions_v6_categories_check'
      and conrelid = 'public.bible_push_subscriptions'::regclass
  ) then
    alter table public.bible_push_subscriptions
      add constraint bible_push_subscriptions_v6_categories_check
      check (
        v6_enabled_categories <@ array[
          'reading','assignments','ministry','announcements','encouragement','streaks'
        ]::text[]
      );
  end if;
end $$;

comment on column public.bible_push_subscriptions.v6_enabled_categories is
  'Per-device V6 push opt-in categories. Defaults empty so existing V5 subscriptions do not become V6-deliverable implicitly.';

create table if not exists public.bible_notification_delivery_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  master_enabled boolean not null default true,
  enabled_categories text[] not null default array[
    'reading','assignments','ministry','announcements','encouragement','streaks'
  ]::text[],
  quiet_hours_enabled boolean not null default false,
  quiet_start_minute smallint not null default 1320
    check (quiet_start_minute between 0 and 1439),
  quiet_end_minute smallint not null default 420
    check (quiet_end_minute between 0 and 1439),
  updated_at timestamptz not null default now(),
  constraint bible_notification_delivery_preferences_categories_check check (
    enabled_categories <@ array[
      'reading','assignments','ministry','announcements','encouragement','streaks'
    ]::text[]
  )
);

comment on table public.bible_notification_delivery_preferences is
  'Account-scoped V6 server delivery preferences. Quiet-hour times are stored as local minutes; the trusted sender supplies the recipient-local minute explicitly.';

alter table public.bible_notification_delivery_preferences enable row level security;

revoke all on table public.bible_notification_delivery_preferences from public, anon, authenticated;
grant select, insert, update, delete on table public.bible_notification_delivery_preferences to authenticated;
grant select, insert, update, delete on table public.bible_notification_delivery_preferences to service_role;

drop policy if exists "notification delivery preferences own rows"
  on public.bible_notification_delivery_preferences;
create policy "notification delivery preferences own rows"
  on public.bible_notification_delivery_preferences
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.bible_claim_push_delivery_v6(
  target_notification uuid,
  target_subscription uuid,
  target_local_minute integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  claimed boolean := false;
  category text;
  quiet_enabled boolean;
  quiet_start integer;
  quiet_end integer;
begin
  if target_notification is null
     or target_subscription is null
     or target_local_minute is null
     or target_local_minute < 0
     or target_local_minute > 1439 then
    return false;
  end if;

  select
    n.delivery_category,
    p.quiet_hours_enabled,
    p.quiet_start_minute::integer,
    p.quiet_end_minute::integer
  into category, quiet_enabled, quiet_start, quiet_end
  from public.bible_notifications n
  join public.bible_push_subscriptions s
    on s.id = target_subscription
   and s.user_id = n.user_id
  join public.bible_notification_delivery_preferences p
    on p.user_id = n.user_id
  where n.id = target_notification
    and n.delivery_category is not null
    and p.master_enabled
    and n.delivery_category = any (p.enabled_categories)
    and n.delivery_category = any (s.v6_enabled_categories);

  if not found then
    return false;
  end if;

  if quiet_enabled then
    if quiet_start = quiet_end then
      return false;
    elsif quiet_start < quiet_end then
      if target_local_minute >= quiet_start and target_local_minute < quiet_end then
        return false;
      end if;
    elsif target_local_minute >= quiet_start or target_local_minute < quiet_end then
      return false;
    end if;
  end if;

  insert into public.bible_push_delivery_ledger (
    notification_id,
    subscription_id,
    claimed_at,
    delivered_at
  ) values (
    target_notification,
    target_subscription,
    now(),
    null
  )
  on conflict (notification_id, subscription_id) do nothing
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function public.bible_claim_push_delivery_v6(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.bible_claim_push_delivery_v6(uuid, uuid, integer)
  to service_role;

comment on function public.bible_claim_push_delivery_v6(uuid, uuid, integer) is
  'Server-only V6 idempotent push claim. Requires explicit canonical category, same-account subscription, account preference opt-in, per-device opt-in, and recipient-local quiet-hours allowance.';
