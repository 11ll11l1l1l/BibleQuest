begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

select has_column(
  'public',
  'bible_notification_delivery_preferences',
  'server_enforcement_enabled',
  'server notification preferences expose an explicit enforcement cutover'
);
select has_column(
  'public',
  'bible_notification_delivery_preferences',
  'utc_offset_minutes',
  'server notification preferences expose bounded UTC offset context'
);

insert into public.bible_notification_delivery_preferences (user_id)
values ('11111111-1111-4111-8111-111111111112');

select results_eq(
  $$select server_enforcement_enabled from public.bible_notification_delivery_preferences
    where user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  array[false],
  'server enforcement defaults off to preserve released V5 push behavior'
);
select results_eq(
  $$select utc_offset_minutes is null from public.bible_notification_delivery_preferences
    where user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  array[true],
  'UTC offset defaults unknown until an account explicitly synchronizes local-time context'
);
select throws_ok(
  $$insert into public.bible_notification_delivery_preferences(user_id,utc_offset_minutes)
    values('11111111-1111-4111-8111-111111111111',841)$$,
  '23514',
  null,
  'out-of-range UTC offset fails closed'
);

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, enabled_categories, v6_enabled_categories
) values (
  'fa000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'https://push.example.com/v6-cutover-a',
  '0123456789abcdef',
  '01234567',
  array['assignment']::text[],
  array['assignments']::text[]
);

insert into public.bible_notifications (
  id, user_id, congregation_id, notification_type, delivery_category, title, body
) values
  (
    'fb000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111112',
    '10000000-0000-4000-8000-000000000001',
    'assignment',
    'assignments',
    'Cutover fixture one',
    'Synthetic disposable fixture'
  ),
  (
    'fc000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111112',
    '10000000-0000-4000-8000-000000000001',
    'assignment',
    'assignments',
    'Cutover fixture two',
    'Synthetic disposable fixture'
  ),
  (
    'fd000000-0000-4000-8000-000000000004',
    '11111111-1111-4111-8111-111111111112',
    '10000000-0000-4000-8000-000000000001',
    'assignment',
    'assignments',
    'Cutover fixture three',
    'Synthetic disposable fixture'
  );

set local role service_role;
select is(
  public.bible_claim_push_delivery_v6(
    'fb000000-0000-4000-8000-000000000002'::uuid,
    'fa000000-0000-4000-8000-000000000001'::uuid,
    null
  ),
  false,
  'V6 claim fails closed until server enforcement is explicitly enabled'
);
reset role;

select ok(
  (select prosecdef
   from pg_proc
   where oid='public.bible_claim_push_delivery_v6_rate_limited(uuid,uuid,integer)'::regprocedure),
  'rate-limited V6 claim remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc
     where oid='public.bible_claim_push_delivery_v6_rate_limited(uuid,uuid,integer)'::regprocedure),
    false
  ),
  'rate-limited V6 claim pins its search_path'
);
select ok(
  not has_function_privilege(
    'anon',
    'public.bible_claim_push_delivery_v6_rate_limited(uuid,uuid,integer)',
    'EXECUTE'
  ),
  'anonymous role cannot execute rate-limited V6 claim'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.bible_claim_push_delivery_v6_rate_limited(uuid,uuid,integer)',
    'EXECUTE'
  ),
  'authenticated browser role cannot execute rate-limited V6 claim'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.bible_claim_push_delivery_v6_rate_limited(uuid,uuid,integer)',
    'EXECUTE'
  ),
  'service role can execute rate-limited V6 claim'
);

update public.bible_notification_delivery_preferences
set server_enforcement_enabled=true,
    master_enabled=true,
    enabled_categories=array['assignments']::text[],
    quiet_hours_enabled=false
where user_id='11111111-1111-4111-8111-111111111112'::uuid;

set local role service_role;
select is(
  public.bible_claim_push_delivery_v6_rate_limited(
    'fb000000-0000-4000-8000-000000000002'::uuid,
    'fa000000-0000-4000-8000-000000000001'::uuid,
    null
  ),
  true,
  'server-enforced V6 delivery can claim without local time when quiet hours are disabled'
);
reset role;

update public.bible_notification_delivery_preferences
set quiet_hours_enabled=true,
    quiet_start_minute=1320,
    quiet_end_minute=420
where user_id='11111111-1111-4111-8111-111111111112'::uuid;

set local role service_role;
select is(
  public.bible_claim_push_delivery_v6_rate_limited(
    'fc000000-0000-4000-8000-000000000003'::uuid,
    'fa000000-0000-4000-8000-000000000001'::uuid,
    null
  ),
  false,
  'server-enforced quiet hours fail closed when local-time context is unavailable'
);
select is(
  public.bible_claim_push_delivery_v6_rate_limited(
    'fc000000-0000-4000-8000-000000000003'::uuid,
    'fa000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  true,
  'server-enforced delivery can claim outside configured quiet hours'
);
reset role;

insert into public.bible_push_retry_state (
  notification_id, subscription_id, failure_count, last_failure_at, next_retry_at
) values (
  'fd000000-0000-4000-8000-000000000004',
  'fa000000-0000-4000-8000-000000000001',
  1,
  now(),
  now() + interval '30 seconds'
);

set local role service_role;
select is(
  public.bible_claim_push_delivery_v6_rate_limited(
    'fd000000-0000-4000-8000-000000000004'::uuid,
    'fa000000-0000-4000-8000-000000000001'::uuid,
    720
  ),
  false,
  'V6 server enforcement respects transient retry throttle state'
);
reset role;

select * from finish();
rollback;
