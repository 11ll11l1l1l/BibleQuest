begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into public.bible_assignment_progress (
  assignment_id, user_id, status, submission
)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111112',
    'started',
    'member-a-progress'
  ),
  (
    'a1000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111114',
    'started',
    'former-member-a-progress'
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'started',
    'member-b-progress'
  )
on conflict (assignment_id, user_id) do update
set status=excluded.status, submission=excluded.submission;

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_assignment_progress'::regclass),
  'assignment progress keeps RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_assignment_progress','SELECT'),
  'anonymous role cannot read assignment progress'
);

select ok(
  coalesce(
    (
      select qual like '%bible_assignment_visible%'
      from pg_policies
      where schemaname='public'
        and tablename='bible_assignment_progress'
        and policyname='assignment progress visible'
    ),
    false
  ),
  'assignment progress owner visibility re-proves current assignment visibility'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select submission from public.bible_assignment_progress order by submission$$,
  array['member-a-progress'::text],
  'Member A reads only its own current-congregation assignment progress'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress$$,
  array[0::bigint],
  'former Member A cannot retain assignment-progress visibility after membership removal'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select submission from public.bible_assignment_progress order by submission$$,
  array['former-member-a-progress'::text, 'member-a-progress'::text],
  'Leader A can review congregation A assignment progress only'
);

select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress where submission='member-b-progress'$$,
  array[0::bigint],
  'Leader A cannot read congregation B assignment progress'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';

select results_eq(
  $$select submission from public.bible_assignment_progress order by submission$$,
  array['former-member-a-progress'::text, 'member-a-progress'::text],
  'Pastor A has same-congregation assignment-progress review visibility'
);

select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress where submission='member-b-progress'$$,
  array[0::bigint],
  'Pastor A cannot read congregation B assignment progress'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222221';

select results_eq(
  $$select submission from public.bible_assignment_progress order by submission$$,
  array['member-b-progress'::text],
  'Admin B can review congregation B assignment progress only'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select submission from public.bible_assignment_progress order by submission$$,
  array['member-b-progress'::text],
  'Member B reads only its own congregation B assignment progress'
);

select results_eq(
  $$select count(*)::bigint from public.bible_assignment_progress where submission like '%a-progress'$$,
  array[0::bigint],
  'Member B cannot read congregation A assignment progress'
);

select * from finish();
rollback;
