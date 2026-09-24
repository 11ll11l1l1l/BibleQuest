-- BibleQuest V6: fail closed if a privileged sender attempts to pair a
-- notification with a push subscription owned by a different account.
-- This preserves the existing service-role-only/idempotent API while making
-- recipient ownership an invariant at the database boundary.

create or replace function public.bible_claim_push_delivery(
  target_notification uuid,
  target_subscription uuid
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  claimed boolean := false;
begin
  if target_notification is null or target_subscription is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.bible_notifications n
    join public.bible_push_subscriptions s
      on s.id = target_subscription
     and s.user_id = n.user_id
    where n.id = target_notification
  ) then
    return false;
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

revoke all on function public.bible_claim_push_delivery(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.bible_claim_push_delivery(uuid, uuid)
  to service_role;

comment on function public.bible_claim_push_delivery(uuid, uuid) is
  'Server-only idempotent push-delivery claim. Fails closed unless notification and subscription belong to the same account.';
