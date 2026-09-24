-- BibleQuest V6: explicit server-enforced notification preference cutover.
--
-- Existing V5 push delivery remains the compatibility path until an account
-- explicitly enables server enforcement after its account + device settings
-- have been synchronized. This avoids silently disabling released V5 push.
--
-- utc_offset_minutes uses the conventional local = UTC + offset definition.
-- Quiet hours fail closed when enforcement is enabled but local-time context
-- is unavailable.

alter table public.bible_notification_delivery_preferences
  add column if not exists server_enforcement_enabled boolean not null default false,
  add column if not exists utc_offset_minutes smallint;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'bible_notification_delivery_preferences_utc_offset_check'
      and conrelid = 'public.bible_notification_delivery_preferences'::regclass
  ) then
    alter table public.bible_notification_delivery_preferences
      add constraint bible_notification_delivery_preferences_utc_offset_check
      check (
        utc_offset_minutes is null
        or utc_offset_minutes between -840 and 840
      );
  end if;
end $$;

comment on column public.bible_notification_delivery_preferences.server_enforcement_enabled is
  'Explicit V6 server cutover flag. False preserves released V5 push behavior until account/device settings are synchronized.';
comment on column public.bible_notification_delivery_preferences.utc_offset_minutes is
  'Recipient UTC offset in minutes using local = UTC + offset. Required for server-enforced quiet hours; NULL fails closed when quiet hours are enabled.';

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
  if target_notification is null or target_subscription is null then
    return false;
  end if;

  if target_local_minute is not null
     and (target_local_minute < 0 or target_local_minute > 1439) then
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
    and p.server_enforcement_enabled
    and p.master_enabled
    and n.delivery_category = any (p.enabled_categories)
    and n.delivery_category = any (s.v6_enabled_categories);

  if not found then
    return false;
  end if;

  if quiet_enabled then
    if target_local_minute is null then
      return false;
    elsif quiet_start = quiet_end then
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

create or replace function public.bible_claim_push_delivery_v6_rate_limited(
  target_notification uuid,
  target_subscription uuid,
  target_local_minute integer
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if target_notification is null or target_subscription is null then
    return false;
  end if;

  if exists (
    select 1
    from public.bible_push_retry_state r
    where r.notification_id = target_notification
      and r.subscription_id = target_subscription
      and r.next_retry_at > clock_timestamp()
  ) then
    return false;
  end if;

  return public.bible_claim_push_delivery_v6(
    target_notification,
    target_subscription,
    target_local_minute
  );
end;
$$;

revoke all on function public.bible_claim_push_delivery_v6_rate_limited(uuid, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.bible_claim_push_delivery_v6_rate_limited(uuid, uuid, integer)
  to service_role;

comment on function public.bible_claim_push_delivery_v6_rate_limited(uuid, uuid, integer) is
  'Server-only V6 delivery claim: explicit cutover + account/device category preferences + quiet hours + transient retry throttle.';
