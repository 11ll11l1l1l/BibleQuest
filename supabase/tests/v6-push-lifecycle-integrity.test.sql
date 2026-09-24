begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, enabled_categories
) values (
  'f1000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'https://push.example.com/v6-ci-lifecycle-a',
  '0123456789abcdef',
  '01234567',
  array['assignment','calendar']::text[]
);

select throws_ok(
  $$insert into public.bible_push_subscriptions (id,user_id,endpoint,p256dh,auth,enabled_categories)
    values ('f2000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111112','https://push.example.com/v6-ci-invalid-category','0123456789abcdef','01234567',array['not-a-category']::text[])$$,
  '23514',
  null,
  'unknown push categories fail closed at the database boundary'
);

select throws_ok(
  $$insert into public.bible_push_subscriptions (id,user_id,endpoint,p256dh,auth)
    values ('f3000000-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222222','https://push.example.com/v6-ci-lifecycle-a','fedcba9876543210','76543210')$$,
  '23505',
  null,
  'one browser endpoint cannot be attached to two accounts'
);

insert into public.bible_notifications (
  id, user_id, congregation_id, notification_type, title, body
) values (
  'f4000000-0000-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111112',
  '10000000-0000-4000-8000-000000000001',
  'assignment',
  'V6 CI lifecycle',
  'Synthetic disposable fixture'
);

set local role service_role;
select is(
  public.bible_claim_push_delivery(
    'f4000000-0000-4000-8000-000000000004'::uuid,
    'f1000000-0000-4000-8000-000000000001'::uuid
  ),
  true,
  'service delivery claim creates one lifecycle ledger row'
);
reset role;

select is(
  (select count(*)::integer from public.bible_push_delivery_ledger where subscription_id='f1000000-0000-4000-8000-000000000001'::uuid),
  1,
  'delivery ledger contains the subscription claim before cleanup'
);

delete from public.bible_push_subscriptions where id='f1000000-0000-4000-8000-000000000001'::uuid;
select is(
  (select count(*)::integer from public.bible_push_delivery_ledger where subscription_id='f1000000-0000-4000-8000-000000000001'::uuid),
  0,
  'subscription cleanup cascades its delivery ledger claims'
);

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth
) values (
  'f5000000-0000-4000-8000-000000000005',
  '11111111-1111-4111-8111-111111111112',
  'https://push.example.com/v6-ci-default-off',
  '0123456789abcdef',
  '01234567'
);
select results_eq(
  $$select enabled_categories from public.bible_push_subscriptions where id='f5000000-0000-4000-8000-000000000005'::uuid$$,
  $$values ('{}'::text[])$$,
  'new subscriptions default to no enabled push categories'
);

select ok(
  (select confdeltype='c' from pg_constraint where conname='bible_push_subscriptions_user_id_fkey'),
  'account deletion cascades push subscription cleanup'
);

select * from finish();
rollback;
