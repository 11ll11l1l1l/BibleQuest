begin;

create extension if not exists pgtap with schema extensions;
select plan(28);

insert into public.bible_notification_delivery_preferences (
  user_id, master_enabled, enabled_categories, quiet_hours_enabled, quiet_start_minute, quiet_end_minute,
  server_enforcement_enabled, utc_offset_minutes
) values
  (
    '11111111-1111-4111-8111-111111111112',
    true,
    array['assignments','announcements']::text[],
    false,
    1320,
    420,
    true,
    540
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    true,
    array['assignments']::text[],
    false,
    1320,
    420,
    true,
    0
  );

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, enabled_categories, v6_enabled_categories
) values
  (
    'c1000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    'https://push.example.com/v6-pref-a',
    '0123456789abcdef',
    '01234567',
    array['assignment']::text[],
    array['assignments','announcements']::text[]
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'https://push.example.com/v6-pref-b',
    'fedcba9876543210',
    '76543210',
    array['assignment']::text[],
    array['assignments']::text[]
  ),
  (
    'c3000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111111',
    'https://push.example.com/v6-pref-no-account-row',
    '0011223344556677',
    '00112233',
    '{}'::text[],
    array['assignments']::text[]
  );

insert into public.bible_notifications (
  id, user_id, congregation_id, notification_type, delivery_category, title, body
) values
  ('c4000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111112','10000000-0000-4000-8000-000000000001','assignment','assignments','Assignment 1','Synthetic disposable fixture'),
  ('c5000000-0000-4000-8000-000000000005','22222222-2222-4222-8222-222222222222','20000000-0000-4000-8000-000000000002','assignment','assignments','Assignment B','Synthetic disposable fixture'),
  ('c6000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111112','10000000-0000-4000-8000-000000000001','info',null,'Legacy uncategorized','Synthetic disposable fixture'),
  ('c7000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111112','10000000-0000-4000-8000-000000000001','announcement','announcements','Announcement 1','Synthetic disposable fixture'),
  ('c8000000-0000-4000-8000-000000000008','11111111-1111-4111-8111-111111111112','10000000-0000-4000-8000-000000000001','announcement','announcements','Announcement 2','Synthetic disposable fixture'),
  ('c9000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111112','10000000-0000-4000-8000-000000000001','announcement','announcements','Announcement 3','Synthetic disposable fixture'),
  ('ca000000-0000-4000-8000-000000000010','11111111-1111-4111-8111-111111111112','10000000-0000-4000-8000-000000000001','announcement','announcements','Announcement 4','Synthetic disposable fixture'),
  ('cb000000-0000-4000-8000-000000000011','11111111-1111-4111-8111-111111111111','10000000-0000-4000-8000-000000000001','assignment','assignments','Leader assignment','Synthetic disposable fixture');

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_notification_delivery_preferences'::regclass),
  'notification delivery preferences keep RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_notification_delivery_preferences','SELECT'),
  'anonymous role cannot read notification delivery preferences'
);
select ok(
  has_table_privilege('authenticated','public.bible_notification_delivery_preferences','SELECT'),
  'authenticated role has bounded preference read grant'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select count(*)::bigint from public.bible_notification_delivery_preferences$$,
  array[1::bigint],
  'Member A sees only its own server notification preferences'
);
select results_eq(
  $$select count(*)::bigint from public.bible_notification_delivery_preferences where user_id='22222222-2222-4222-8222-222222222222'::uuid$$,
  array[0::bigint],
  'Member A cannot filter into Member B notification preferences'
);
select lives_ok(
  $$update public.bible_notification_delivery_preferences set quiet_hours_enabled=true where user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  'Member A may update its own server notification preferences'
);
select results_eq(
  $$select quiet_hours_enabled from public.bible_notification_delivery_preferences where user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  array[true],
  'Member A own preference update persists'
);
select throws_ok(
  $$insert into public.bible_notification_delivery_preferences(user_id) values('11111111-1111-4111-8111-111111111111')$$,
  '42501',
  null,
  'Member A cannot create a preference row for Leader A'
);

reset role;

select throws_ok(
  $$insert into public.bible_notifications(id,user_id,notification_type,delivery_category,title) values('cc000000-0000-4000-8000-000000000012','11111111-1111-4111-8111-111111111112','info','not-a-v6-category','Invalid category')$$,
  '23514',
  null,
  'unknown V6 notification delivery category fails closed'
);
select throws_ok(
  $$insert into public.bible_push_subscriptions(id,user_id,endpoint,p256dh,auth,v6_enabled_categories) values('cd000000-0000-4000-8000-000000000013','11111111-1111-4111-8111-111111111112','https://push.example.com/v6-invalid-device-category','0123456789abcdef','01234567',array['not-a-v6-category']::text[])$$,
  '23514',
  null,
  'unknown V6 device category fails closed'
);
select throws_ok(
  $$insert into public.bible_notification_delivery_preferences(user_id,enabled_categories) values('11111111-1111-4111-8111-111111111111',array['not-a-v6-category']::text[])$$,
  '23514',
  null,
  'unknown V6 account preference category fails closed'
);

select ok(
  (select prosecdef from pg_proc where oid='public.bible_claim_push_delivery_v6(uuid,uuid,integer)'::regprocedure),
  'V6 push claim remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bible_claim_push_delivery_v6(uuid,uuid,integer)'::regprocedure),
    false
  ),
  'V6 push claim pins its search_path'
);
select ok(
  not has_function_privilege('anon','public.bible_claim_push_delivery_v6(uuid,uuid,integer)','EXECUTE'),
  'anonymous role cannot execute V6 push claim'
);
select ok(
  not has_function_privilege('authenticated','public.bible_claim_push_delivery_v6(uuid,uuid,integer)','EXECUTE'),
  'authenticated browser role cannot execute V6 push claim'
);
select ok(
  has_function_privilege('service_role','public.bible_claim_push_delivery_v6(uuid,uuid,integer)','EXECUTE'),
  'service role can execute V6 push claim'
);

-- Undo the authenticated-role RLS smoke update so delivery tests start outside quiet hours.
update public.bible_notification_delivery_preferences
set quiet_hours_enabled=false
where user_id='11111111-1111-4111-8111-111111111112'::uuid;

set local role service_role;

select is(
  public.bible_claim_push_delivery_v6(
    'c4000000-0000-4000-8000-000000000004'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  true,
  'matching explicit V6 category, account preference and device opt-in can claim delivery'
);
select is(
  public.bible_claim_push_delivery_v6(
    'c4000000-0000-4000-8000-000000000004'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  false,
  'V6 delivery claim remains idempotent'
);
select is(
  public.bible_claim_push_delivery_v6(
    'c4000000-0000-4000-8000-000000000004'::uuid,
    'c2000000-0000-4000-8000-000000000002'::uuid,
    720
  ),
  false,
  'V6 delivery cannot pair a Member A notification with Member B subscription'
);
select is(
  public.bible_claim_push_delivery_v6(
    'c6000000-0000-4000-8000-000000000006'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  false,
  'legacy notification without explicit V6 category fails closed'
);
select is(
  public.bible_claim_push_delivery_v6(
    'cb000000-0000-4000-8000-000000000011'::uuid,
    'c3000000-0000-4000-8000-000000000003'::uuid,
    720
  ),
  false,
  'V6 delivery fails closed when the recipient has no server preference row'
);

update public.bible_notification_delivery_preferences
set master_enabled=false
where user_id='11111111-1111-4111-8111-111111111112'::uuid;
select is(
  public.bible_claim_push_delivery_v6(
    'c7000000-0000-4000-8000-000000000007'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  false,
  'master notification preference disables V6 delivery'
);

update public.bible_notification_delivery_preferences
set master_enabled=true,
    enabled_categories=array['assignments']::text[]
where user_id='11111111-1111-4111-8111-111111111112'::uuid;
select is(
  public.bible_claim_push_delivery_v6(
    'c8000000-0000-4000-8000-000000000008'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  false,
  'disabled account category blocks V6 delivery'
);

update public.bible_notification_delivery_preferences
set enabled_categories=array['assignments','announcements']::text[],
    quiet_hours_enabled=true,
    quiet_start_minute=1320,
    quiet_end_minute=420
where user_id='11111111-1111-4111-8111-111111111112'::uuid;
select is(
  public.bible_claim_push_delivery_v6(
    'c9000000-0000-4000-8000-000000000009'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    1380
  ),
  false,
  'overnight quiet hours suppress delivery before midnight'
);
select is(
  public.bible_claim_push_delivery_v6(
    'c9000000-0000-4000-8000-000000000009'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    360
  ),
  false,
  'overnight quiet hours suppress delivery after midnight'
);
select is(
  public.bible_claim_push_delivery_v6(
    'c9000000-0000-4000-8000-000000000009'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  true,
  'delivery outside quiet hours succeeds when all V6 opt-ins match'
);

update public.bible_push_subscriptions
set v6_enabled_categories=array['assignments']::text[]
where id='c1000000-0000-4000-8000-000000000001'::uuid;
select is(
  public.bible_claim_push_delivery_v6(
    'ca000000-0000-4000-8000-000000000010'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  false,
  'per-device V6 category opt-out blocks delivery'
);
select is(
  public.bible_claim_push_delivery_v6(
    'ca000000-0000-4000-8000-000000000010'::uuid,
    'c1000000-0000-4000-8000-000000000001'::uuid,
    1440
  ),
  false,
  'invalid recipient-local minute fails closed'
);

reset role;
select * from finish();
rollback;
