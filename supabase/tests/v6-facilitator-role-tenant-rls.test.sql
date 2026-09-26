begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

-- Create assignment-progress fixtures inside this transaction so the
-- Facilitator review assertion does not depend on another pgTAP file.
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

-- Reuse the deterministic congregation-A Leader fixture as Facilitator only
-- inside this transaction. ROLLBACK below restores the shared seed unchanged.
update public.bible_congregation_members
set role = 'facilitator'
where congregation_id = '10000000-0000-4000-8000-000000000001'::uuid
  and user_id = '11111111-1111-4111-8111-111111111111'::uuid
  and active;

select is(
  (
    select role
    from public.bible_congregation_members
    where congregation_id = '10000000-0000-4000-8000-000000000001'::uuid
      and user_id = '11111111-1111-4111-8111-111111111111'::uuid
  ),
  'facilitator'::text,
  'fixture is Facilitator A inside this isolated test transaction'
);

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111111';

select results_eq(
  $$select count(*)::bigint from public.bible_assignments$$,
  array[1::bigint],
  'Facilitator A sees only its congregation assignment'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_assignments
    where congregation_id = '20000000-0000-4000-8000-000000000002'::uuid$$,
  array[0::bigint],
  'Facilitator A cannot force a foreign assignment through a client filter'
);

select results_eq(
  $$select count(*)::bigint
    from public.bible_calendar_events
    where congregation_id is not null$$,
  array[1::bigint],
  'Facilitator A sees only its congregation shared calendar event'
);

select results_eq(
  $$select count(*)::bigint from public.bible_congregation_members$$,
  array[3::bigint],
  'Facilitator A reads only congregation A membership rows'
);

select is(
  private.bible_assignment_visible(
    '10000000-0000-4000-8000-000000000001'::uuid,
    'member',
    '11111111-1111-4111-8111-111111111112'::uuid
  ),
  true,
  'Facilitator A has leadership visibility for member-targeted assignments'
);

select results_eq(
  $$select submission
    from public.bible_assignment_progress
    order by submission$$,
  array['former-member-a-progress'::text, 'member-a-progress'::text],
  'Facilitator A can review congregation A assignment progress and no foreign progress'
);

reset role;
select * from finish();
rollback;
