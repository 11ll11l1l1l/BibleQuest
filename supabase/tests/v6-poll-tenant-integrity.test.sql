begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_polls'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_poll_votes'::regclass),
  'polls and poll votes keep RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_polls','SELECT')
  and not has_table_privilege('anon','public.bible_poll_votes','SELECT'),
  'anonymous role has no poll or poll-vote table read privilege'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conname='bible_poll_votes_option_index_nonnegative'
      and conrelid='public.bible_poll_votes'::regclass
      and pg_get_constraintdef(oid) like '%option_index >= 0%'
  ),
  'poll vote table enforces a nonnegative option-index invariant'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select lives_ok(
  $$insert into public.bible_polls(id,prompt,options,congregation_id,created_by)
    values('ee100000-0000-4000-8000-000000000001','V6 poll A','["Yes","No"]'::jsonb,'10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111')$$,
  'Leader A may create a poll in congregation A'
);
select throws_ok(
  $$insert into public.bible_polls(id,prompt,options,congregation_id,created_by)
    values('ee200000-0000-4000-8000-000000000002','Foreign poll','["Yes","No"]'::jsonb,'20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111')$$,
  '42501', null,
  'Leader A cannot create a poll in congregation B'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select count(*)::bigint from public.bible_polls where id='ee100000-0000-4000-8000-000000000001'::uuid$$,
  array[1::bigint],
  'Member A can read its congregation poll'
);
select throws_ok(
  $$insert into public.bible_poll_votes(poll_id,user_id,option_index)
    values('ee100000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112',-1)$$,
  '42501', null,
  'negative poll vote index is rejected by authenticated RLS'
);
select throws_ok(
  $$insert into public.bible_poll_votes(poll_id,user_id,option_index)
    values('ee100000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112',2)$$,
  '42501', null,
  'out-of-range poll vote index is rejected by RLS'
);
select lives_ok(
  $$insert into public.bible_poll_votes(poll_id,user_id,option_index)
    values('ee100000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112',0)$$,
  'Member A may cast a valid vote in its congregation'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select count(*)::bigint from public.bible_polls where id='ee100000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Member B cannot read congregation A poll'
);
select throws_ok(
  $$insert into public.bible_poll_votes(poll_id,user_id,option_index)
    values('ee100000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222',1)$$,
  '42501', null,
  'Member B cannot vote in congregation A poll'
);
select results_eq(
  $$select count(*)::bigint from public.bible_poll_votes where poll_id='ee100000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Member B cannot read Member A vote'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select count(*)::bigint from public.bible_poll_votes where poll_id='ee100000-0000-4000-8000-000000000001'::uuid$$,
  array[1::bigint],
  'Leader A may read congregation A vote for ministry aggregation'
);

reset role;
select * from finish();
rollback;
