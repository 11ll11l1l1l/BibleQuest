begin;

create extension if not exists pgtap with schema extensions;
select plan(26);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_assignments'::regclass),
  'assignments keep RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_calendar_events'::regclass),
  'calendar events keep RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_congregation_members'::regclass),
  'congregation memberships keep RLS enabled'
);

select ok(
  has_table_privilege('authenticated', 'public.bible_assignments', 'SELECT'),
  'authenticated role has the intended assignments read grant'
);
select ok(
  not has_table_privilege('anon', 'public.bible_assignments', 'SELECT'),
  'anonymous role has no assignments read grant'
);
select ok(
  not has_table_privilege('authenticated', 'public.bible_admin_audit_log', 'SELECT'),
  'browser roles cannot read the server-only admin audit log'
);

select ok(
  (select prosecdef from pg_proc where oid='private.is_bible_congregation_member(uuid)'::regprocedure),
  'membership helper remains SECURITY DEFINER'
);
select ok(
  not has_function_privilege('anon', 'private.is_bible_congregation_member(uuid)', 'EXECUTE'),
  'anonymous role cannot execute the membership helper'
);
select ok(
  has_function_privilege('authenticated', 'private.is_bible_congregation_member(uuid)', 'EXECUTE'),
  'authenticated role can execute the bounded membership helper'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=%'
     from pg_proc where oid='private.is_bible_congregation_member(uuid)'::regprocedure),
    false
  ),
  'membership SECURITY DEFINER has an explicit search_path'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select count(*)::bigint from public.bible_assignments$$,
  array[1::bigint],
  'Member A sees only its congregation assignment'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot force a foreign assignment through a client filter'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id is not null$$,
  array[1::bigint],
  'Member A sees only its congregation shared calendar event'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members$$,
  array[3::bigint],
  'Member A can read only memberships in its congregation, including its pastor'
);
select is(
  private.bible_assignment_visible(
    '10000000-0000-4000-8000-000000000001'::uuid,
    'member',
    '22222222-2222-4222-8222-222222222222'::uuid
  ),
  false,
  'ordinary Member A cannot see an assignment targeted to another member'
);

set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111113';

select results_eq(
  $$select count(*)::bigint from public.bible_assignments$$,
  array[1::bigint],
  'Pastor A sees only its congregation assignment'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Pastor A cannot force a foreign assignment through a client filter'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id is not null$$,
  array[1::bigint],
  'Pastor A sees only its congregation shared calendar event'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members$$,
  array[3::bigint],
  'Pastor A can read only memberships in its congregation'
);
select is(
  private.bible_assignment_visible(
    '10000000-0000-4000-8000-000000000001'::uuid,
    'member',
    '11111111-1111-4111-8111-111111111112'::uuid
  ),
  true,
  'Pastor A has leadership visibility for member-targeted assignments in congregation A'
);

set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';
select is(
  private.bible_assignment_visible(
    '10000000-0000-4000-8000-000000000001'::uuid,
    'member',
    '11111111-1111-4111-8111-111111111112'::uuid
  ),
  true,
  'Leader A has leadership visibility for member-targeted assignments in congregation A'
);

set local "request.jwt.claim.sub" = '22222222-2222-4222-8222-222222222221';
select is(
  private.bible_assignment_visible(
    '20000000-0000-4000-8000-000000000002'::uuid,
    'member',
    '22222222-2222-4222-8222-222222222222'::uuid
  ),
  true,
  'Admin B has leadership visibility for member-targeted assignments in congregation B'
);

set local "request.jwt.claim.sub" = '22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select count(*)::bigint from public.bible_assignments$$,
  array[1::bigint],
  'Member B sees only its congregation assignment'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Member B cannot force a foreign assignment through a client filter'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id is not null$$,
  array[1::bigint],
  'Member B sees only its congregation shared calendar event'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members$$,
  array[2::bigint],
  'Member B can read only memberships in its congregation'
);

reset role;
select * from finish();
rollback;
