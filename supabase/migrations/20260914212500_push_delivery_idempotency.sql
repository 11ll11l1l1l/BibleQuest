-- BibleQuest V5: minimum server-only Web Push delivery idempotency.
--
-- This ledger is intentionally isolated from Notification Center read/expiry/action
-- semantics. It records one delivery claim per persisted notification/subscription
-- pair so concurrent or repeated privileged sender invocations cannot normally
-- duplicate-send the same push. A stale, unfinished claim may be reclaimed after
-- a bounded server-owned lease; successfully delivered rows are never reclaimed.

create table if not exists public.bible_push_delivery_ledger (
  notification_id uuid not null references public.bible_notifications(id) on delete cascade,
  subscription_id uuid not null references public.bible_push_subscriptions(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  delivered_at timestamptz,
  primary key (notification_id, subscription_id),
  constraint bible_push_delivery_ledger_delivery_order check (delivered_at is null or delivered_at >= claimed_at)
);

alter table public.bible_push_delivery_ledger enable row level security;

-- There are deliberately no anon/authenticated policies. Only the privileged
-- sender's service-role path may see or mutate delivery claims.
revoke all on table public.bible_push_delivery_ledger from anon, authenticated;
grant select, insert, update, delete on table public.bible_push_delivery_ledger to service_role;

create or replace function public.bible_claim_push_delivery(
  target_notification uuid,
  target_subscription uuid,
  claim_ttl_seconds integer default 600
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  claimed boolean := false;
  bounded_ttl integer;
begin
  if target_notification is null or target_subscription is null then
    return false;
  end if;

  bounded_ttl := greatest(60, least(coalesce(claim_ttl_seconds, 600), 900));

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
  on conflict (notification_id, subscription_id) do update
    set claimed_at = excluded.claimed_at
    where public.bible_push_delivery_ledger.delivered_at is null
      and public.bible_push_delivery_ledger.claimed_at <= now() - (bounded_ttl * interval '1 second')
  returning true into claimed;

  return coalesce(claimed, false);
end;
$$;

revoke all on function public.bible_claim_push_delivery(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.bible_claim_push_delivery(uuid, uuid, integer) to service_role;

create index if not exists bible_push_delivery_ledger_claimed_idx
  on public.bible_push_delivery_ledger (claimed_at)
  where delivered_at is null;
