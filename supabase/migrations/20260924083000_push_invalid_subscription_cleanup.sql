-- BibleQuest V6: safely retire permanently invalid Web Push subscriptions.
--
-- A 404/410 response may arrive after a browser has refreshed the subscription
-- row. Cleanup therefore compares the exact endpoint/key material that was used
-- for the failed send instead of deleting by id/user alone. This prevents a
-- stale remote response from deleting a newly valid subscription.

create or replace function public.bible_retire_push_subscription(
  target_subscription uuid,
  target_user uuid,
  expected_endpoint text,
  expected_p256dh text,
  expected_auth text
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  retired boolean := false;
begin
  if target_subscription is null
     or target_user is null
     or coalesce(expected_endpoint, '') = ''
     or coalesce(expected_p256dh, '') = ''
     or coalesce(expected_auth, '') = '' then
    return false;
  end if;

  delete from public.bible_push_subscriptions
  where id = target_subscription
    and user_id = target_user
    and endpoint = expected_endpoint
    and p256dh = expected_p256dh
    and auth = expected_auth
  returning true into retired;

  return coalesce(retired, false);
end;
$$;

revoke all on function public.bible_retire_push_subscription(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.bible_retire_push_subscription(uuid, uuid, text, text, text)
  to service_role;

comment on function public.bible_retire_push_subscription(uuid, uuid, text, text, text) is
  'Server-only permanent push cleanup. Deletes only the exact subscription material that received a permanent remote failure, preventing stale 404/410 responses from deleting refreshed subscriptions.';
