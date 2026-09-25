begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_telemetry_visitors'::regclass),
  'telemetry visitors keep RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_telemetry_sessions'::regclass),
  'telemetry sessions keep RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_telemetry_events'::regclass),
  'telemetry events keep RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_telemetry_events','SELECT'),
  'anonymous clients cannot read telemetry events directly'
);
select ok(
  not has_table_privilege('authenticated','public.bible_telemetry_events','SELECT'),
  'authenticated clients cannot read telemetry events directly'
);
select ok(
  has_function_privilege('anon','public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)','EXECUTE'),
  'anonymous clients can call the bounded telemetry ingestion RPC'
);
select ok(
  has_function_privilege('authenticated','public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)','EXECUTE'),
  'authenticated clients can call the bounded telemetry ingestion RPC'
);

set local role anon;
select lives_ok(
  $$telemetry$select public.bible_record_telemetry_batch(
    '33333333-3333-4333-8333-333333333333'::uuid,
    '44444444-4444-4444-8444-444444444444'::uuid,
    '[{"event_name":"route_view","feature":"reader","route":"reader","properties":{"action":"open","note":"must-not-store","email":"private@example.invalid"}}]'::jsonb,
    '{"platform":"Web","locale":"en-PH","app_version":"v6","screen_bucket":"sm","is_pwa":false}'::jsonb
  )$$,
  'anonymous telemetry ingestion succeeds through the write-only RPC'
);
reset role;

select is(
  (select user_id from public.bible_telemetry_events
   where visitor_id='33333333-3333-4333-8333-333333333333'::uuid limit 1),
  null::uuid,
  'anonymous telemetry stays anonymous'
);
select is(
  (select properties from public.bible_telemetry_events
   where visitor_id='33333333-3333-4333-8333-333333333333'::uuid limit 1),
  '{"action":"open"}'::jsonb,
  'server strips non-allowlisted telemetry properties'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111112';
select lives_ok(
  $$select public.bible_record_telemetry_batch(
    '55555555-5555-4555-8555-555555555555'::uuid,
    '66666666-6666-4666-8666-666666666666'::uuid,
    '[{"event_name":"identity_authenticated","feature":"account","route":"home","properties":{"status":"authenticated","email":"must-not-store@example.invalid"}}]'::jsonb,
    '{"platform":"Web","locale":"en-PH","app_version":"v6","screen_bucket":"sm","is_pwa":true}'::jsonb
  )$$,
  'authenticated telemetry ingestion succeeds through the bounded RPC'
);
reset role;

select is(
  (select user_id from public.bible_telemetry_events
   where visitor_id='55555555-5555-4555-8555-555555555555'::uuid limit 1),
  '11111111-1111-4111-8111-111111111112'::uuid,
  'authenticated telemetry identity is derived from auth context'
);


set local role anon;
select lives_ok(
  $select public.bible_record_telemetry_batch(
    '77777777-7777-4777-8777-777777777777'::uuid,
    '88888888-8888-4888-8888-888888888888'::uuid,
    '[{"event_name":"feature_complete","feature":"reader","route":"reader","properties":{"action":"complete","result":"private@example.invalid","book_code":"JHN","chapter":3}}]'::jsonb,
    '{"platform":"Web","locale":"en-PH","app_version":"v6","screen_bucket":"sm","is_pwa":false}'::jsonb
  )$telemetry$,
  'telemetry ingestion tolerates rejected sensitive property values'
);
reset role;

select is(
  (select properties from public.bible_telemetry_events
   where visitor_id='77777777-7777-4777-8777-777777777777'::uuid limit 1),
  '{"action":"complete"}'::jsonb,
  'server strips email-like values and exact Scripture-location properties'
);

select * from finish();
rollback;
