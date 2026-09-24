begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, v6_enabled_categories
) values (
  'da000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'https://push.example.com/v6-ci-retire-a',
  '0123456789abcdef',
  '01234567',
  array['assignments']::text[]
);

insert into public.bible_notifications (
  id, user_id, congregation_id, notification_type, delivery_category, title, body
) values (
  'db000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111112',
  '10000000-0000-4000-8000-000000000001',
  'assignment',
  'assignments',
  'Cleanup fixture',
  'Synthetic disposable fixture'
);

insert into public.bible_push_delivery_ledger (
  notification_id, subscription_id, claimed_at
) values (
  'db000000-0000-4000-8000-000000000002',
  'da000000-0000-4000-8000-000000000001',
  now()
);

select ok(
  (select prosecdef from pg_proc where oid='public.bible_retire_push_subscription(uuid,uuid,text,text,text)'::regprocedure),
  'push cleanup remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bible_retire_push_subscription(uuid,uuid,text,text,text)'::regprocedure),
    false
  ),
  'push cleanup pins its search_path'
);
select ok(
  not has_function_privilege('anon','public.bible_retire_push_subscription(uuid,uuid,text,text,text)','EXECUTE'),
  'anonymous role cannot retire push subscriptions'
);
select ok(
  not has_function_privilege('authenticated','public.bible_retire_push_subscription(uuid,uuid,text,text,text)','EXECUTE'),
  'authenticated browser role cannot retire push subscriptions'
);
select ok(
  has_function_privilege('service_role','public.bible_retire_push_subscription(uuid,uuid,text,text,text)','EXECUTE'),
  'service role can execute permanent push cleanup'
);

set local role service_role;

select is(
  public.bible_retire_push_subscription(
    null,
    '11111111-1111-4111-8111-111111111112'::uuid,
    'https://push.example.com/v6-ci-retire-a',
    '0123456789abcdef',
    '01234567'
  ),
  false,
  'incomplete cleanup identity fails closed'
);

-- Simulate the browser refreshing key material while an older send is still in flight.
update public.bible_push_subscriptions
set p256dh='fedcba9876543210', auth='76543210', updated_at=now()
where id='da000000-0000-4000-8000-000000000001'::uuid;

select is(
  public.bible_retire_push_subscription(
    'da000000-0000-4000-8000-000000000001'::uuid,
    '11111111-1111-4111-8111-111111111112'::uuid,
    'https://push.example.com/v6-ci-retire-a',
    '0123456789abcdef',
    '01234567'
  ),
  false,
  'stale failed-send key material cannot delete a refreshed subscription'
);
select is(
  (select count(*)::integer from public.bible_push_subscriptions where id='da000000-0000-4000-8000-000000000001'::uuid),
  1,
  'refreshed subscription survives stale cleanup'
);
select is(
  (select count(*)::integer from public.bible_push_delivery_ledger where subscription_id='da000000-0000-4000-8000-000000000001'::uuid),
  1,
  'stale cleanup does not cascade-delete the current subscription ledger'
);
select is(
  public.bible_retire_push_subscription(
    'da000000-0000-4000-8000-000000000001'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    'https://push.example.com/v6-ci-retire-a',
    'fedcba9876543210',
    '76543210'
  ),
  false,
  'wrong account cannot retire the subscription'
);
select is(
  public.bible_retire_push_subscription(
    'da000000-0000-4000-8000-000000000001'::uuid,
    '11111111-1111-4111-8111-111111111112'::uuid,
    'https://push.example.com/v6-ci-retire-other',
    'fedcba9876543210',
    '76543210'
  ),
  false,
  'wrong endpoint cannot retire the subscription'
);
select is(
  public.bible_retire_push_subscription(
    'da000000-0000-4000-8000-000000000001'::uuid,
    '11111111-1111-4111-8111-111111111112'::uuid,
    'https://push.example.com/v6-ci-retire-a',
    'fedcba9876543210',
    '76543210'
  ),
  true,
  'exact permanently invalid subscription material is retired'
);
select is(
  (select count(*)::integer from public.bible_push_subscriptions where id='da000000-0000-4000-8000-000000000001'::uuid),
  0,
  'retired invalid subscription is removed'
);
select is(
  (select count(*)::integer from public.bible_push_delivery_ledger where subscription_id='da000000-0000-4000-8000-000000000001'::uuid),
  0,
  'retiring invalid subscription cascades its delivery ledger claims'
);

reset role;
select * from finish();
rollback;
