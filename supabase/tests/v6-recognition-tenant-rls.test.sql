begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into public.bible_member_recognitions (
  id, congregation_id, user_id, awarded_by, award_code, title, note, visible
)
values
  (
    'a1100000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    '11111111-1111-4111-8111-111111111111',
    'v6-fixture-a',
    'Recognition A',
    'Congregation A fixture',
    true
  ),
  (
    'a2200000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '22222222-2222-4222-8222-222222222221',
    'v6-fixture-b',
    'Recognition B',
    'Congregation B fixture',
    true
  ),
  (
    'a1100000-0000-4000-8000-000000000003',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    '11111111-1111-4111-8111-111111111111',
    'v6-fixture-hidden-a',
    'Hidden Recognition A',
    'Visibility fixture',
    false
  )
on conflict (id) do nothing;

select ok(
  (select relrowsecurity
   from pg_class
   where oid='public.bible_member_recognitions'::regclass),
  'member recognitions keep RLS enabled'
);

select ok(
  coalesce(
    (
      select with_check like '%bible_congregation_members%'
        and with_check like '%target_membership.active%'
      from pg_policies
      where schemaname='public'
        and tablename='bible_member_recognitions'
        and policyname='leaders create recognitions'
    ),
    false
  ),
  'recognition INSERT policy requires an active target membership in the same congregation'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select id
    from public.bible_member_recognitions
    where visible
    order by id$$,
  array['a1100000-0000-4000-8000-000000000001'::uuid],
  'Member A reads visible recognitions only from congregation A'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_member_recognitions
    where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot force-read congregation B recognitions'
);

select throws_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      '11111111-1111-4111-8111-111111111112',
      'v6-member-self-award',
      'Member self award must fail'
    )$$,
  '42501',
  null,
  'ordinary Member A cannot award a recognition'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select lives_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      '11111111-1111-4111-8111-111111111111',
      'v6-leader-a-valid',
      'Leader A valid award'
    )$$,
  'Leader A can recognize an active member of congregation A'
);

select throws_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '22222222-2222-4222-8222-222222222222',
      '11111111-1111-4111-8111-111111111111',
      'v6-leader-a-foreign-target',
      'Foreign target must fail'
    )$$,
  '42501',
  null,
  'Leader A cannot recognize a congregation B member inside congregation A'
);

select throws_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '22222222-2222-4222-8222-222222222222',
      '11111111-1111-4111-8111-111111111111',
      'v6-leader-a-foreign-congregation',
      'Foreign congregation must fail'
    )$$,
  '42501',
  null,
  'Leader A cannot award a recognition in congregation B'
);

select throws_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      '11111111-1111-4111-8111-111111111113',
      'v6-leader-a-spoof-actor',
      'Spoofed actor must fail'
    )$$,
  '42501',
  null,
  'Leader A cannot spoof another ministry identity as awarded_by'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';

select lives_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '10000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      '11111111-1111-4111-8111-111111111113',
      'v6-pastor-a-valid',
      'Pastor A valid award'
    )$$,
  'Pastor A can recognize an active congregation A member'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint
    from public.bible_member_recognitions
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'inactive former Member A cannot read congregation A recognitions'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';

select results_eq(
  $$select id
    from public.bible_member_recognitions
    where award_code='v6-fixture-b'$$,
  array['a2200000-0000-4000-8000-000000000002'::uuid],
  'Admin B reads its congregation B recognition'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_member_recognitions
    where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot force-read congregation A recognitions'
);

select lives_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '22222222-2222-4222-8222-222222222222',
      '22222222-2222-4222-8222-222222222221',
      'v6-admin-b-valid',
      'Admin B valid award'
    )$$,
  'Admin B can recognize an active congregation B member'
);

select throws_ok(
  $$insert into public.bible_member_recognitions(
      congregation_id,user_id,awarded_by,award_code,title
    ) values (
      '20000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111112',
      '22222222-2222-4222-8222-222222222221',
      'v6-admin-b-foreign-target',
      'Foreign target must fail'
    )$$,
  '42501',
  null,
  'Admin B cannot recognize a congregation A member inside congregation B'
);

reset role;
select * from finish();
rollback;
