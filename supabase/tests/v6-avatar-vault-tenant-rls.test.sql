begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_congregation_members'::regclass),
  'congregation memberships keep RLS enabled for avatar writes'
);

select ok(
  has_column_privilege('authenticated','public.bible_congregation_members','avatar','UPDATE'),
  'authenticated members retain the intended avatar update grant'
);

select ok(
  not has_column_privilege('authenticated','public.bible_congregation_members','role','UPDATE')
  and not has_column_privilege('authenticated','public.bible_congregation_members','active','UPDATE'),
  'avatar editing does not grant browser role or active-state mutation'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select lives_ok(
  $$update public.bible_congregation_members
    set avatar='{"key":"member-a"}'::jsonb
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
      and user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  'Member A may update its own avatar in congregation A'
);

select results_eq(
  $$select avatar->>'key'
    from public.bible_congregation_members
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
      and user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  array['member-a'::text],
  'Member A can observe its committed avatar through congregation-scoped membership visibility'
);

select results_eq(
  $$with changed as (
      update public.bible_congregation_members
      set avatar='{"key":"stolen-same-tenant"}'::jsonb
      where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
        and user_id='11111111-1111-4111-8111-111111111111'::uuid
      returning 1
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'Member A cannot update another member avatar in its own congregation'
);

select results_eq(
  $$with changed as (
      update public.bible_congregation_members
      set avatar='{"key":"stolen-foreign-tenant"}'::jsonb
      where congregation_id='20000000-0000-4000-8000-000000000002'::uuid
        and user_id='22222222-2222-4222-8222-222222222222'::uuid
      returning 1
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'Member A cannot update a congregation B avatar'
);

select throws_ok(
  $$update public.bible_congregation_members
    set role='admin'
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
      and user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  '42501', null,
  'Member A cannot use the membership update surface to self-promote'
);

select throws_ok(
  $$update public.bible_congregation_members
    set active=true
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
      and user_id='11111111-1111-4111-8111-111111111112'::uuid$$,
  '42501', null,
  'Member A cannot use the membership update surface to reactivate itself'
);

reset role;
select * from finish();
rollback;
