begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

insert into public.bible_group_encouragements (
  group_id,sender_id,recipient_id,kind
) values
  (
    '61000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    null,
    'pray'
  ),
  (
    '62000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    null,
    'pray'
  )
on conflict do nothing;

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_group_encouragements'::regclass),
  'Journey Group encouragements keep RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_group_encouragements','SELECT')
  and not has_table_privilege('anon','public.bible_group_encouragements','INSERT'),
  'anonymous callers cannot read or create Journey Group encouragements'
);

select ok(
  has_table_privilege('authenticated','public.bible_group_encouragements','SELECT')
  and has_table_privilege('authenticated','public.bible_group_encouragements','INSERT'),
  'authenticated encouragement access remains bounded by RLS'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select group_id
    from public.bible_group_encouragements
    where kind='pray'
    order by group_id$$,
  array['61000000-0000-4000-8000-000000000001'::uuid],
  'Member A reads encouragements only from its active congregation A Journey Group'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_group_encouragements
    where group_id='62000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot force-read congregation B Journey Group encouragements'
);

select lives_ok(
  $$insert into public.bible_group_encouragements(
      group_id,sender_id,recipient_id,kind
    ) values (
      '61000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      null,
      'cheer'
    )$$,
  'Member A can send an encouragement inside its active Journey Group'
);

select throws_ok(
  $$insert into public.bible_group_encouragements(
      group_id,sender_id,recipient_id,kind
    ) values (
      '62000000-0000-4000-8000-000000000002',
      '11111111-1111-4111-8111-111111111112',
      null,
      'cheer'
    )$$,
  '42501',
  null,
  'Member A cannot send an encouragement into congregation B'
);

select throws_ok(
  $$insert into public.bible_group_encouragements(
      group_id,sender_id,recipient_id,kind
    ) values (
      '61000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111111',
      null,
      'word'
    )$$,
  '42501',
  null,
  'Member A cannot spoof Leader A as the encouragement sender'
);

select lives_ok(
  $$insert into public.bible_group_encouragements(
      group_id,sender_id,recipient_id,kind
    ) values (
      '61000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      '11111111-1111-4111-8111-111111111111',
      'heart'
    )$$,
  'Member A can target an active congregation A peer in the same Journey Group'
);

select throws_ok(
  $$insert into public.bible_group_encouragements(
      group_id,sender_id,recipient_id,kind
    ) values (
      '61000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111112',
      '22222222-2222-4222-8222-222222222222',
      'flame'
    )$$,
  '42501',
  null,
  'Member A cannot target a congregation B member through a congregation A encouragement'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint
    from public.bible_group_encouragements
    where group_id='61000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'inactive former Member A cannot retain encouragement visibility through stale group membership'
);

select throws_ok(
  $$insert into public.bible_group_encouragements(
      group_id,sender_id,recipient_id,kind
    ) values (
      '61000000-0000-4000-8000-000000000001',
      '11111111-1111-4111-8111-111111111114',
      null,
      'word'
    )$$,
  '42501',
  null,
  'inactive former Member A cannot send through stale group membership'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select group_id
    from public.bible_group_encouragements
    where kind='pray'
    order by group_id$$,
  array['62000000-0000-4000-8000-000000000002'::uuid],
  'Member B reads encouragements only from its congregation B Journey Group'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_group_encouragements
    where group_id='61000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Member B cannot force-read congregation A Journey Group encouragements'
);

reset role;
select * from finish();
rollback;
