begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into public.bible_notifications (
  id, user_id, congregation_id, notification_type, title, body
) values
  ('fa000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','10000000-0000-4000-8000-000000000001','assignment','Owner A notice','Synthetic disposable fixture'),
  ('fb000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222','20000000-0000-4000-8000-000000000002','assignment','Owner B notice','Synthetic disposable fixture');

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, enabled_categories
) values
  ('fa100000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','https://push.example.com/v6-ci-owner-pair-a','0123456789abcdef','01234567',array['assignment']::text[]),
  ('fb100000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222','https://push.example.com/v6-ci-owner-pair-b','fedcba9876543210','76543210',array['assignment']::text[]);

set local role service_role;

select is(
  public.bible_claim_push_delivery('fa000000-0000-4000-8000-000000000001'::uuid,'fa100000-0000-4000-8000-000000000001'::uuid),
  true,
  'service sender may claim notification against the matching account subscription'
);

select is(
  public.bible_claim_push_delivery('fb000000-0000-4000-8000-000000000002'::uuid,'fa100000-0000-4000-8000-000000000001'::uuid),
  false,
  'service sender cannot pair Member B notification with Member A subscription'
);

select is(
  public.bible_claim_push_delivery('fa000000-0000-4000-8000-000000000001'::uuid,'fb100000-0000-4000-8000-000000000002'::uuid),
  false,
  'service sender cannot pair Member A notification with Member B subscription'
);

select is(
  (select count(*)::integer from public.bible_push_delivery_ledger where notification_id in ('fa000000-0000-4000-8000-000000000001'::uuid,'fb000000-0000-4000-8000-000000000002'::uuid)),
  1,
  'cross-account claim attempts create no delivery-ledger rows'
);

reset role;
select * from finish();
rollback;
