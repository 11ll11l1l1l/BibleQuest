begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select ok(
  (select prosecdef from pg_proc where oid='public.bible_claim_push_delivery(uuid,uuid)'::regprocedure),
  'push delivery claim remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=pg_catalog, public%'
     from pg_proc where oid='public.bible_claim_push_delivery(uuid,uuid)'::regprocedure),
    false
  ),
  'push delivery SECURITY DEFINER pins its search_path'
);
select ok(
  not has_function_privilege('anon', 'public.bible_claim_push_delivery(uuid,uuid)', 'EXECUTE'),
  'anonymous role cannot claim push delivery'
);
select ok(
  not has_function_privilege('authenticated', 'public.bible_claim_push_delivery(uuid,uuid)', 'EXECUTE'),
  'authenticated browser role cannot claim push delivery'
);
select ok(
  has_function_privilege('service_role', 'public.bible_claim_push_delivery(uuid,uuid)', 'EXECUTE'),
  'service role can execute the server-only push delivery claim'
);
select ok(
  not has_table_privilege('anon', 'public.bible_push_delivery_ledger', 'SELECT'),
  'anonymous role cannot read push delivery ledger'
);
select ok(
  not has_table_privilege('authenticated', 'public.bible_push_delivery_ledger', 'SELECT'),
  'authenticated browser role cannot read push delivery ledger'
);

insert into public.bible_notifications (
  id, user_id, title, body, category, created_at
)
values (
  'd1000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'V6 CI push',
  'Synthetic disposable fixture',
  'assignment',
  now()
);

insert into public.bible_push_subscriptions (
  id, user_id, endpoint, p256dh, auth, enabled_categories
)
values (
  'd2000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111112',
  'https://push.invalid/v6-ci-member-a',
  '0123456789abcdef',
  '01234567',
  array['assignment']::text[]
);

set local role service_role;

select is(
  public.bible_claim_push_delivery(
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'd2000000-0000-4000-8000-000000000002'::uuid
  ),
  true,
  'first server delivery claim succeeds'
);
select is(
  public.bible_claim_push_delivery(
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'd2000000-0000-4000-8000-000000000002'::uuid
  ),
  false,
  'duplicate server delivery claim is rejected idempotently'
);

reset role;
select * from finish();
rollback;
