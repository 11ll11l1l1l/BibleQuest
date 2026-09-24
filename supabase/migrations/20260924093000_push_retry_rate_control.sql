-- BibleQuest V6: bounded retry/rate control for transient Web Push failures.
--
-- Existing delivery ledger semantics remain authoritative for idempotency:
-- once a remote push is accepted, the claim stays locked even if finalization
-- later fails. This retry state applies only to failures that occur before the
-- remote push service accepts the payload.
--
-- Backoff schedule: 30s, 60s, 120s, 240s, then capped at 300s.

create table if not exists public.bible_push_retry_state (
  notification_id uuid not null
    references public.bible_notifications(id) on delete cascade,
  subscription_id uuid not null
    references public.bible_push_subscriptions(id) on delete cascade,
  failure_count smallint not null default 1
    check (failure_count between 1 and 20),
  last_failure_at timestamptz not null default now(),
  next_retry_at timestamptz not null,
  primary key (notification_id, subscription_id),
  constraint bible_push_retry_state_time_order
    check (next_retry_at >= last_failure_at)
);

comment on table public.bible_push_retry_state is
  'Server-only transient Web Push retry throttle. It never authorizes delivery by itself; the delivery ledger remains the idempotency authority.';

alter table public.bible_push_retry_state enable row level security;
revoke all on table public.bible_push_retry_state
  from public, anon, authenticated, service_role;

create or replace function public.bible_claim_push_delivery_rate_limited(
  target_notification uuid,
  target_subscription uuid
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

  return public.bible_claim_push_delivery(target_notification, target_subscription);
end;
$$;

revoke all on function public.bible_claim_push_delivery_rate_limited(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.bible_claim_push_delivery_rate_limited(uuid, uuid)
  to service_role;

comment on function public.bible_claim_push_delivery_rate_limited(uuid, uuid) is
  'Server-only delivery claim that preserves existing idempotency and refuses transient retries until their backoff window opens.';

create or replace function public.bible_record_push_retry_failure(
  target_notification uuid,
  target_subscription uuid
)
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  recorded_count integer;
begin
  if target_notification is null or target_subscription is null then
    return 0;
  end if;

  -- Require the same-account notification/subscription pair used by the
  -- hardened delivery claim. This prevents arbitrary retry-state creation.
  if not exists (
    select 1
    from public.bible_notifications n
    join public.bible_push_subscriptions s
      on s.id = target_subscription
     and s.user_id = n.user_id
    where n.id = target_notification
  ) then
    return 0;
  end if;

  insert into public.bible_push_retry_state (
    notification_id,
    subscription_id,
    failure_count,
    last_failure_at,
    next_retry_at
  ) values (
    target_notification,
    target_subscription,
    1,
    clock_timestamp(),
    clock_timestamp() + interval '30 seconds'
  )
  on conflict (notification_id, subscription_id) do update
  set failure_count = least(public.bible_push_retry_state.failure_count + 1, 20),
      last_failure_at = clock_timestamp(),
      next_retry_at = clock_timestamp()
        + make_interval(
            secs => least(
              300,
              30 * power(
                2::numeric,
                least(public.bible_push_retry_state.failure_count, 4)
              )::integer
            )
          )
  returning failure_count into recorded_count;

  return coalesce(recorded_count, 0);
end;
$$;

revoke all on function public.bible_record_push_retry_failure(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.bible_record_push_retry_failure(uuid, uuid)
  to service_role;

comment on function public.bible_record_push_retry_failure(uuid, uuid) is
  'Server-only transient failure recorder using capped exponential backoff: 30, 60, 120, 240, then 300 seconds. Returns the bounded failure count.';

create or replace function public.bible_clear_push_retry_state(
  target_notification uuid,
  target_subscription uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  cleared boolean := false;
begin
  if target_notification is null or target_subscription is null then
    return false;
  end if;

  delete from public.bible_push_retry_state
  where notification_id = target_notification
    and subscription_id = target_subscription
  returning true into cleared;

  return coalesce(cleared, false);
end;
$$;

revoke all on function public.bible_clear_push_retry_state(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.bible_clear_push_retry_state(uuid, uuid)
  to service_role;

comment on function public.bible_clear_push_retry_state(uuid, uuid) is
  'Server-only cleanup for retry throttle state after confirmed delivery; permanent subscription retirement removes retry state by cascade.';
