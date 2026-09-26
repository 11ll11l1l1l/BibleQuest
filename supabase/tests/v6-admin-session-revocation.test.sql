begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select ok(
  (select prosecdef from pg_proc where oid='private.bible_revoke_auth_sessions_impl(uuid)'::regprocedure),
  'session revocation implementation remains SECURITY DEFINER'
);

select ok(
  coalesce(
    (
      select array_to_string(proconfig, ',') like '%search_path=%'
      from pg_proc
      where oid='private.bible_revoke_auth_sessions_impl(uuid)'::regprocedure
    ),
    false
  ),
  'session revocation implementation pins search_path'
);

select ok(
  not (select prosecdef from pg_proc where oid='public.bible_revoke_auth_sessions(uuid)'::regprocedure),
  'public session revocation wrapper remains SECURITY INVOKER'
);

select ok(
  not has_function_privilege('anon', 'public.bible_revoke_auth_sessions(uuid)', 'EXECUTE'),
  'anonymous callers cannot revoke Auth sessions'
);

select ok(
  not has_function_privilege('authenticated', 'public.bible_revoke_auth_sessions(uuid)', 'EXECUTE'),
  'authenticated callers cannot revoke Auth sessions'
);

select ok(
  has_function_privilege('service_role', 'public.bible_revoke_auth_sessions(uuid)', 'EXECUTE'),
  'service role may execute the controlled revocation wrapper'
);

-- Use existing synthetic CI users only. These Auth session rows live entirely
-- inside this test transaction and are rolled back at the end.
insert into auth.sessions (id, user_id, created_at, updated_at)
values
  (
    '51000000-0000-4000-8000-000000000001'::uuid,
    '11111111-1111-4111-8111-111111111112'::uuid,
    now(),
    now()
  ),
  (
    '51000000-0000-4000-8000-000000000002'::uuid,
    '11111111-1111-4111-8111-111111111112'::uuid,
    now(),
    now()
  ),
  (
    '52000000-0000-4000-8000-000000000001'::uuid,
    '22222222-2222-4222-8222-222222222222'::uuid,
    now(),
    now()
  );

set local role service_role;

select is(
  public.bible_revoke_auth_sessions(
    '11111111-1111-4111-8111-111111111112'::uuid
  ),
  2::bigint,
  'service-role revocation reports every target session deleted'
);

reset role;

select results_eq(
  $$select count(*)::bigint
    from auth.sessions
    where user_id = '11111111-1111-4111-8111-111111111112'::uuid$$,
  array[0::bigint],
  'revocation removes all sessions for the target user'
);

select results_eq(
  $$select count(*)::bigint
    from auth.sessions
    where user_id = '22222222-2222-4222-8222-222222222222'::uuid
      and id = '52000000-0000-4000-8000-000000000001'::uuid$$,
  array[1::bigint],
  'revocation does not remove another user session'
);

select * from finish();
rollback;
