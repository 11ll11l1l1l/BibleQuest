begin;

create extension if not exists pgtap with schema extensions;
select plan(22);

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, v6_enabled_categories
) values
  (
    'ea000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    'https://push.example.com/v6-ci-retry-a',
    '0123456789abcdef',
    '01234567',
    array['assignments']::text[]
  ),
  (
    'eb000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'https://push.example.com/v6-ci-retry-b',
    'fedcba9876543210',
    '76543210',
    array['assignments']::text[]
  );

insert into public.bible_notifications (
  id, user_id, congregation_id, notification_type, delivery_category, title, body
) values
  (
    'ec000000-0000-4000-8000-000000000003',
    '11111111-1111-4111-8111-111111111112',
    '10000000-0000-4000-8000-000000000001',
    'assignment',
    'assignments',
    'Retry fixture A',
    'Synthetic disposable fixture'
  ),
  (
    'ed000000-0000-4000-8000-000000000004',
    '22222222-2222-4222-8222-222222222222',
    '20000000-0000-4000-8000-000000000002',
    'assignment',
    'assignments',
    'Retry fixture B',
    'Synthetic disposable fixture'
  );

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_push_retry_state'::regclass),
  'push retry state keeps RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_push_retry_state','SELECT'),
  'anonymous role cannot read push retry state'
);
select ok(
  not has_table_privilege('authenticated','public.bible_push_retry_state','SELECT'),
  'authenticated browser role cannot read push retry state'
);
select ok(
  not has_table_privilege('service_role','public.bible_push_retry_state','SELECT'),
  'service role uses bounded retry RPCs instead of direct retry-state reads'
);

select ok(
  (select prosecdef from pg_proc where oid='public.bible_claim_push_delivery_rate_limited(uuid,uuid)'::regprocedure),
  'rate-limited claim remains SECURITY DEFINER'
);
select ok(
  (select prosecdef from pg_proc where oid='public.bible_record_push_retry_failure(uuid,uuid)'::regprocedure),
  'retry failure recorder remains SECURITY DEFINER'
);
select ok(
  (select prosecdef from pg_proc where oid='public.bible_clear_push_retry_state(uuid,uuid)'::regprocedure),
  'retry clear function remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bible_claim_push_delivery_rate_limited(uuid,uuid)'::regprocedure),
    false
  ),
  'rate-limited claim pins its search_path'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bible_record_push_retry_failure(uuid,uuid)'::regprocedure),
    false
  ),
  'retry recorder pins its search_path'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bible_clear_push_retry_state(uuid,uuid)'::regprocedure),
    false
  ),
  'retry clear function pins its search_path'
);
select ok(
  not has_function_privilege('authenticated','public.bible_claim_push_delivery_rate_limited(uuid,uuid)','EXECUTE')
  and not has_function_privilege('authenticated','public.bible_record_push_retry_failure(uuid,uuid)','EXECUTE')
  and not has_function_privilege('authenticated','public.bible_clear_push_retry_state(uuid,uuid)','EXECUTE'),
  'authenticated browser role cannot execute retry-control RPCs'
);
select ok(
  has_function_privilege('service_role','public.bible_claim_push_delivery_rate_limited(uuid,uuid)','EXECUTE')
  and has_function_privilege('service_role','public.bible_record_push_retry_failure(uuid,uuid)','EXECUTE')
  and has_function_privilege('service_role','public.bible_clear_push_retry_state(uuid,uuid)','EXECUTE'),
  'service role can execute bounded retry-control RPCs'
);

set local role service_role;

select is(
  public.bible_claim_push_delivery_rate_limited(
    'ec000000-0000-4000-8000-000000000003'::uuid,
    'ea000000-0000-4000-8000-000000000001'::uuid
  ),
  true,
  'initial delivery claim is allowed'
);
select is(
  public.bible_record_push_retry_failure(
    'ec000000-0000-4000-8000-000000000003'::uuid,
    'ea000000-0000-4000-8000-000000000001'::uuid
  ),
  1,
  'first transient failure records retry count one'
);
delete from public.bible_push_delivery_ledger
where notification_id='ec000000-0000-4000-8000-000000000003'::uuid
  and subscription_id='ea000000-0000-4000-8000-000000000001'::uuid
  and delivered_at is null;

select is(
  public.bible_claim_push_delivery_rate_limited(
    'ec000000-0000-4000-8000-000000000003'::uuid,
    'ea000000-0000-4000-8000-000000000001'::uuid
  ),
  false,
  'immediate retry claim is rate-limited'
);
select is(
  public.bible_record_push_retry_failure(
    'ec000000-0000-4000-8000-000000000003'::uuid,
    'eb000000-0000-4000-8000-000000000002'::uuid
  ),
  0,
  'cross-account pair cannot create retry throttle state'
);

reset role;

select ok(
  (select next_retry_at >= last_failure_at + interval '30 seconds'
   from public.bible_push_retry_state
   where notification_id='ec000000-0000-4000-8000-000000000003'::uuid
     and subscription_id='ea000000-0000-4000-8000-000000000001'::uuid),
  'first retry delay is at least 30 seconds'
);

-- Advance the synthetic throttle window without waiting in CI, then prove the
-- next failure doubles the backoff.
update public.bible_push_retry_state
set last_failure_at=clock_timestamp() - interval '61 seconds',
    next_retry_at=clock_timestamp() - interval '1 second'
where notification_id='ec000000-0000-4000-8000-000000000003'::uuid
  and subscription_id='ea000000-0000-4000-8000-000000000001'::uuid;

set local role service_role;
select is(
  public.bible_claim_push_delivery_rate_limited(
    'ec000000-0000-4000-8000-000000000003'::uuid,
    'ea000000-0000-4000-8000-000000000001'::uuid
  ),
  true,
  'retry claim reopens after the backoff window'
);
select is(
  public.bible_record_push_retry_failure(
    'ec000000-0000-4000-8000-000000000003'::uuid,
    'ea000000-0000-4000-8000-000000000001'::uuid
  ),
  2,
  'second transient failure increments retry count'
);
delete from public.bible_push_delivery_ledger
where notification_id='ec000000-0000-4000-8000-000000000003'::uuid
  and subscription_id='ea000000-0000-4000-8000-000000000001'::uuid
  and delivered_at is null;
reset role;

select ok(
  (select next_retry_at >= last_failure_at + interval '60 seconds'
   from public.bible_push_retry_state
   where notification_id='ec000000-0000-4000-8000-000000000003'::uuid
     and subscription_id='ea000000-0000-4000-8000-000000000001'::uuid),
  'second retry delay is at least 60 seconds'
);

set local role service_role;
select is(
  public.bible_clear_push_retry_state(
    'ec000000-0000-4000-8000-000000000003'::uuid,
    'ea000000-0000-4000-8000-000000000001'::uuid
  ),
  true,
  'successful delivery path can clear retry throttle state'
);
reset role;

select is(
  (select count(*)::integer
   from public.bible_push_retry_state
   where notification_id='ec000000-0000-4000-8000-000000000003'::uuid
     and subscription_id='ea000000-0000-4000-8000-000000000001'::uuid),
  0,
  'cleared retry throttle leaves no stale state'
);

select * from finish();
rollback;
