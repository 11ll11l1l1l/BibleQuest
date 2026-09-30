begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

-- Leader Center composes these already-authorized domains. This suite proves
-- the database view remains single-congregation for every UI role in its
-- browser matrix, including Facilitator.
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_assignments'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_calendar_events'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_congregation_members'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_assignment_progress'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_teams'::regclass),
  'Leader Center source tables keep RLS enabled'
);

insert into public.bible_assignment_progress(assignment_id,user_id,status,submission)
values
  ('a1000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','started','leader-center-a'),
  ('a2000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222222','started','leader-center-b')
on conflict(assignment_id,user_id) do update
set status=excluded.status, submission=excluded.submission;

-- Member A: browser route is denied, and the DB still remains tenant-scoped.
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq(
  $$select role from public.bible_congregation_members where user_id=auth.uid() and active$$,
  array['member'::text],
  'Member A resolves the member role only'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot read congregation B assignments'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot read congregation B calendar events'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot read congregation B directory rows'
);
select results_eq(
  $$select count(*)::bigint from public.bible_teams where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot read congregation B teams'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress p
     where p.assignment_id='a2000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot read congregation B assignment progress'
);

-- Reuse Leader A as Facilitator inside this transaction; rollback restores seed.
reset role;
update public.bible_congregation_members
set role='facilitator'
where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
  and user_id='11111111-1111-4111-8111-111111111111'::uuid;
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq(
  $$select role from public.bible_congregation_members where user_id=auth.uid() and active$$,
  array['facilitator'::text],
  'Facilitator A resolves the facilitator ministry role'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Facilitator A cannot read congregation B assignments'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Facilitator A cannot read congregation B calendar events'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Facilitator A cannot read congregation B directory rows'
);
select results_eq(
  $$select count(*)::bigint from public.bible_teams where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Facilitator A cannot read congregation B teams'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress
     where assignment_id='a2000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Facilitator A cannot review congregation B assignment progress'
);

-- Restore Leader A for the distinct Leader row.
reset role;
update public.bible_congregation_members
set role='leader'
where congregation_id='10000000-0000-4000-8000-000000000001'::uuid
  and user_id='11111111-1111-4111-8111-111111111111'::uuid;
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq(
  $$select role from public.bible_congregation_members where user_id=auth.uid() and active$$,
  array['leader'::text],
  'Leader A resolves the leader ministry role'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Leader A cannot read congregation B assignments'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Leader A cannot read congregation B calendar events'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Leader A cannot read congregation B directory rows'
);
select results_eq(
  $$select count(*)::bigint from public.bible_teams where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Leader A cannot read congregation B teams'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress
     where assignment_id='a2000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Leader A cannot review congregation B assignment progress'
);

-- Pastor A.
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select results_eq(
  $$select role from public.bible_congregation_members where user_id=auth.uid() and active$$,
  array['pastor'::text],
  'Pastor A resolves the pastor ministry role'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Pastor A cannot read congregation B assignments'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Pastor A cannot read congregation B calendar events'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Pastor A cannot read congregation B directory rows'
);
select results_eq(
  $$select count(*)::bigint from public.bible_teams where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Pastor A cannot read congregation B teams'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress
     where assignment_id='a2000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Pastor A cannot review congregation B assignment progress'
);

-- Admin B must be tenant-admin only here, not implicit platform-wide authority.
set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';
select results_eq(
  $$select role from public.bible_congregation_members where user_id=auth.uid() and active$$,
  array['admin'::text],
  'Admin B resolves the congregation admin role'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignments where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot read congregation A assignments'
);
select results_eq(
  $$select count(*)::bigint from public.bible_calendar_events where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot read congregation A calendar events'
);
select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot read congregation A directory rows'
);
select results_eq(
  $$select count(*)::bigint from public.bible_teams where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot read congregation A teams'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress
     where assignment_id='a1000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Admin B cannot review congregation A assignment progress'
);

reset role;
select * from finish();
rollback;
