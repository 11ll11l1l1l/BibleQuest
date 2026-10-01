begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_congregations'::regclass),
  'congregations keep RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_congregations','SELECT')
  and not has_table_privilege('anon','public.bible_congregations','UPDATE'),
  'anonymous callers cannot read or update congregation settings'
);

select ok(
  has_table_privilege('authenticated','public.bible_congregations','SELECT')
  and has_table_privilege('authenticated','public.bible_congregations','UPDATE'),
  'authenticated congregation access remains bounded by RLS'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select id from public.bible_congregations order by id$$,
  array['10000000-0000-4000-8000-000000000001'::uuid],
  'Member A reads only congregation A settings'
);

select results_eq(
  $$with changed as (
      update public.bible_congregations
      set timezone='UTC'
      where id='10000000-0000-4000-8000-000000000001'::uuid
      returning id
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'ordinary Member A cannot directly update congregation A settings'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$with changed as (
      update public.bible_congregations
      set name='V6 Congregation A Updated', timezone='Asia/Tokyo'
      where id='10000000-0000-4000-8000-000000000001'::uuid
      returning id
    ) select id from changed$$,
  array['10000000-0000-4000-8000-000000000001'::uuid],
  'Congregation A owner may update congregation A settings'
);

select results_eq(
  $$with changed as (
      update public.bible_congregations
      set name='Cross-tenant update must not apply'
      where id='20000000-0000-4000-8000-000000000002'::uuid
      returning id
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'Congregation A owner cannot update congregation B settings'
);

select throws_ok(
  $$update public.bible_congregations
    set owner_id='11111111-1111-4111-8111-111111111112'::uuid
    where id='10000000-0000-4000-8000-000000000001'::uuid$$,
  '42501',
  null,
  'congregation owner cannot transfer ownership through the browser update policy'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';

select results_eq(
  $$with changed as (
      update public.bible_congregations
      set name='V6 Congregation B Updated', timezone='Asia/Tokyo'
      where id='20000000-0000-4000-8000-000000000002'::uuid
      returning id
    ) select id from changed$$,
  array['20000000-0000-4000-8000-000000000002'::uuid],
  'Congregation B owner may update congregation B settings'
);

select results_eq(
  $$with changed as (
      update public.bible_congregations
      set name='Foreign update must not apply'
      where id='10000000-0000-4000-8000-000000000001'::uuid
      returning id
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'Congregation B owner cannot update congregation A settings'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $$with changed as (
      update public.bible_congregations
      set timezone='UTC'
      where id='20000000-0000-4000-8000-000000000002'::uuid
      returning id
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'ordinary Member B cannot directly update congregation B settings'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint
    from public.bible_congregations
    where id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'inactive former Member A cannot retain congregation A settings visibility'
);

reset role;
select * from finish();
rollback;
