begin;

create extension if not exists pgtap with schema extensions;
select plan(11);

insert into public.bible_assignment_progress (
  assignment_id, user_id, status, completed_at, submission
)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    'completed', now(), 'private reflection A'
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'completed', now(), 'private reflection B'
  )
on conflict (assignment_id, user_id) do update
set status=excluded.status,
    completed_at=excluded.completed_at,
    submission=excluded.submission;

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_assignment_response_presence'::regclass),
  'peer-visible completion presence keeps RLS enabled'
);
select ok(
  not has_table_privilege('anon','public.bible_assignment_response_presence','SELECT'),
  'anonymous role cannot read assignment response presence'
);
select ok(
  not has_table_privilege('authenticated','public.bible_assignment_response_presence','INSERT')
  and not has_table_privilege('authenticated','public.bible_assignment_response_presence','UPDATE')
  and not has_table_privilege('authenticated','public.bible_assignment_response_presence','DELETE'),
  'authenticated clients cannot write the derived presence projection'
);
select ok(
  not exists (
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name='bible_assignment_response_presence'
      and column_name in ('submission','reflection','response_text')
  ),
  'peer-visible projection contains no private response-text column'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq(
  $$select display_name from public.bible_assignment_response_presence order by congregation_id$$,
  array['Member A'::text],
  'Member A sees only completion presence in congregation A'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignment_response_presence where congregation_id='20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Member A cannot read congregation B completion presence'
);
select results_eq(
  $$select submission from public.bible_assignment_progress order by submission$$,
  array['private reflection A'::text],
  'Member A reads own private response without seeing Member B text'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';
select results_eq(
  $$select display_name from public.bible_assignment_response_presence order by congregation_id$$,
  array['Member B'::text],
  'Member B sees only completion presence in congregation B'
);
select results_eq(
  $$select count(*)::bigint from public.bible_assignment_response_presence where congregation_id='10000000-0000-4000-8000-000000000001'::uuid$$,
  array[0::bigint],
  'Member B cannot read congregation A completion presence'
);
select results_eq(
  $$select submission from public.bible_assignment_progress order by submission$$,
  array['private reflection B'::text],
  'Member B reads own private response without seeing Member A text'
);
select throws_ok(
  $$insert into public.bible_assignment_response_presence(assignment_id,congregation_id,user_id,display_name,completed_at)
    values('a1000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','Forged',now())$$,
  '42501', null,
  'Member B cannot forge a congregation A presence row'
);

reset role;
select * from finish();
rollback;
