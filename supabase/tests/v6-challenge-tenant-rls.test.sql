begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

insert into public.bible_challenges (
  id, congregation_id, created_by, title, challenge_type, active
) values
  (
    'c1000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    'V6 Challenge A', 'reading', true
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222221',
    'V6 Challenge B', 'reading', true
  );

insert into public.bible_challenge_progress (
  challenge_id, user_id, day_key, metadata
) values
  (
    'c1000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    '2026-09-28', '{"source":"fixture-a"}'::jsonb
  ),
  (
    'c2000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    '2026-09-28', '{"source":"fixture-b"}'::jsonb
  );

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_challenges'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_challenge_progress'::regclass),
  'challenge definitions and progress keep RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_challenges','SELECT')
  and not has_table_privilege('anon','public.bible_challenge_progress','SELECT'),
  'anonymous callers cannot read congregation challenges or progress'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select id from public.bible_challenges order by id$$,
  array['c1000000-0000-4000-8000-000000000001'::uuid],
  'Member A sees only congregation A challenges'
);
select results_eq(
  $$select challenge_id from public.bible_challenge_progress order by challenge_id$$,
  array['c1000000-0000-4000-8000-000000000001'::uuid],
  'Member A sees challenge progress only inside congregation A'
);
select lives_ok(
  $$insert into public.bible_challenge_progress(challenge_id,user_id,day_key)
    values('c1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','member-a-own')$$,
  'Member A may record own progress for an A challenge'
);
select throws_ok(
  $$insert into public.bible_challenge_progress(challenge_id,user_id,day_key)
    values('c2000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111112','member-a-foreign')$$,
  '42501', null,
  'Member A cannot attach progress to a congregation B challenge'
);
select throws_ok(
  $$insert into public.bible_challenge_progress(challenge_id,user_id,day_key)
    values('c1000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','foreign-owner')$$,
  '42501', null,
  'Member A cannot create progress as Member B'
);
select throws_ok(
  $$update public.bible_challenge_progress
    set challenge_id='c2000000-0000-4000-8000-000000000002'
    where challenge_id='c1000000-0000-4000-8000-000000000001'
      and user_id='11111111-1111-4111-8111-111111111112'
      and day_key='2026-09-28'$$,
  '42501', null,
  'Member A cannot reassign existing progress from challenge A to challenge B'
);
select results_eq(
  $$with changed as (
      update public.bible_challenge_progress
      set metadata='{"tampered":true}'::jsonb
      where challenge_id='c2000000-0000-4000-8000-000000000002'
        and user_id='22222222-2222-4222-8222-222222222222'
      returning challenge_id
    ) select count(*)::bigint from changed$$,
  array[0::bigint],
  'Member A cannot update Member B challenge progress'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select lives_ok(
  $$insert into public.bible_challenges(id,congregation_id,created_by,title,challenge_type)
    values('c1100000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Leader A challenge','reading')$$,
  'Leader A may create a challenge inside congregation A'
);
select throws_ok(
  $$insert into public.bible_challenges(congregation_id,created_by,title,challenge_type)
    values('20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Foreign challenge','reading')$$,
  '42501', null,
  'Leader A cannot create a challenge inside congregation B'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select results_eq(
  $$select id from public.bible_challenges where congregation_id='10000000-0000-4000-8000-000000000001'::uuid order by id$$,
  array[
    'c1000000-0000-4000-8000-000000000001'::uuid,
    'c1100000-0000-4000-8000-000000000011'::uuid
  ],
  'Pastor A reads challenges in its own congregation'
);
select results_eq(
  $$select count(*)::bigint from public.bible_challenges where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Pastor A cannot read congregation B challenges'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';
select results_eq(
  $$select id from public.bible_challenges order by id$$,
  array['c2000000-0000-4000-8000-000000000002'::uuid],
  'Admin B sees only congregation B challenges'
);
select results_eq(
  $$select challenge_id from public.bible_challenge_progress order by challenge_id$$,
  array['c2000000-0000-4000-8000-000000000002'::uuid],
  'Admin B sees challenge progress only inside congregation B'
);

reset role;
select * from finish();
rollback;
