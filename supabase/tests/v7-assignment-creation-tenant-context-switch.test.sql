begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

create function pg_temp.v7_assignment_rpc_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

-- Keep the actor a plain platform/congregation member so tenant membership,
-- rather than a broad role, is the only assignment authority being exercised.
insert into public.bible_app_access(user_id, role, active)
values ('11111111-1111-4111-8111-111111111113', 'member', true)
on conflict (user_id) do update set role='member', active=true;

update public.bible_congregation_members
set role='member', active=true
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111113';

update public.bible_congregation_members
set active=true
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111112';

insert into public.v7_mentor_pairs(
  id, congregation_id, mentor_id, mentee_id, initiated_by, state,
  mentor_accepted_at, mentee_accepted_at
) values (
  'a3000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111113',
  'active', now(), now()
);

-- Two immutable published revisions let the proof distinguish an idempotent
-- retry from a genuinely new assignment after the same identity moves A -> B.
insert into public.v7_tracks(id, congregation_id, title, locale, publication_state, created_by)
values (
  'a3100000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'A3 assignment tenant switch', 'en', 'published',
  '11111111-1111-4111-8111-111111111111'
);
insert into public.v7_modules(id, track_id, title, display_order, publication_state)
values (
  'a3200000-0000-4000-8000-000000000001',
  'a3100000-0000-4000-8000-000000000001',
  'A3 assignment module', 0, 'published'
);
insert into public.v7_lessons(id, module_id, title, display_order, publication_state)
values (
  'a3300000-0000-4000-8000-000000000001',
  'a3200000-0000-4000-8000-000000000001',
  'A3 assignment lesson', 0, 'published'
);
insert into public.v7_lesson_revisions(id, lesson_id, revision_number, locale, published_at, created_by)
values
  ('a3400000-0000-4000-8000-000000000001','a3300000-0000-4000-8000-000000000001',1,'en',null,'11111111-1111-4111-8111-111111111111'),
  ('a3400000-0000-4000-8000-000000000002','a3300000-0000-4000-8000-000000000001',2,'en',null,'11111111-1111-4111-8111-111111111111');

insert into public.v7_lesson_steps(lesson_revision_id, position, step_type, content)
select r.id, s.position::smallint, s.step_type, '{}'::jsonb
from public.v7_lesson_revisions r
cross join (values
  (0,'scripture'),(1,'understand'),(2,'discuss'),(3,'reflect'),
  (4,'apply'),(5,'pray'),(6,'action')
) as s(position,step_type)
where r.id in (
  'a3400000-0000-4000-8000-000000000001',
  'a3400000-0000-4000-8000-000000000002'
);
update public.v7_lesson_revisions
set published_at=now()
where id in (
  'a3400000-0000-4000-8000-000000000001',
  'a3400000-0000-4000-8000-000000000002'
);

select is(
  (select role from public.bible_app_access where user_id='11111111-1111-4111-8111-111111111113'),
  'member',
  'Assignment actor is not a site-wide owner or admin'
);
select is(
  (select count(*)::integer from public.bible_congregation_members
   where congregation_id='10000000-0000-4000-8000-000000000001'
     and user_id='11111111-1111-4111-8111-111111111113' and active),
  1,
  'Mentor begins as a current congregation A member'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select ok((
  select assignment_id is not null and assignment_status='assigned'
  from public.bible_v7_create_pair_assignment(
    'a3000000-0000-4000-8000-000000000001',
    'a3100000-0000-4000-8000-000000000001',
    'a3200000-0000-4000-8000-000000000001',
    'a3300000-0000-4000-8000-000000000001',
    'a3400000-0000-4000-8000-000000000001'
  )
), 'Current congregation A mentor can create an A assignment');
select is(
  (select count(*)::integer from public.v7_pair_assignments
   where pair_id='a3000000-0000-4000-8000-000000000001'
     and lesson_revision_id='a3400000-0000-4000-8000-000000000001'),
  1,
  'Control assignment is visible to the current A mentor'
);
select is(
  (select count(*)::integer from public.v7_pair_events
   where pair_id='a3000000-0000-4000-8000-000000000001'
     and event_type='assignment_created'),
  1,
  'Control assignment creates exactly one server-owned audit event'
);

-- Move the exact same JWT identity from congregation A to congregation B.
reset role;
update public.bible_congregation_members
set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111113';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values (
  '20000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111113',
  'member','A3 Assignment Mentor switched to B',true
)
on conflict (congregation_id,user_id)
do update set role='member', display_name='A3 Assignment Mentor switched to B', active=true;

select is(
  (select count(*)::integer from public.bible_congregation_members
   where congregation_id='10000000-0000-4000-8000-000000000001'
     and user_id='11111111-1111-4111-8111-111111111113' and active),
  0,
  'Switched mentor old congregation A membership is inactive'
);
select is(
  (select count(*)::integer from public.bible_congregation_members
   where congregation_id='20000000-0000-4000-8000-000000000002'
     and user_id='11111111-1111-4111-8111-111111111113' and active),
  1,
  'Same mentor identity is now current in congregation B'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';
select is(
  pg_temp.v7_assignment_rpc_sqlstate($sql$
    select * from public.bible_v7_create_pair_assignment(
      'a3000000-0000-4000-8000-000000000001',
      'a3100000-0000-4000-8000-000000000001',
      'a3200000-0000-4000-8000-000000000001',
      'a3300000-0000-4000-8000-000000000001',
      'a3400000-0000-4000-8000-000000000002'
    )
  $sql$),
  '42501',
  'Switched mentor cannot create a new assignment in stale congregation A pair'
);
select is(
  pg_temp.v7_assignment_rpc_sqlstate($sql$
    select * from public.bible_v7_create_pair_assignment(
      'a3000000-0000-4000-8000-000000000001',
      'a3100000-0000-4000-8000-000000000001',
      'a3200000-0000-4000-8000-000000000001',
      'a3300000-0000-4000-8000-000000000001',
      'a3400000-0000-4000-8000-000000000001'
    )
  $sql$),
  '42501',
  'Idempotent retry cannot bypass stale congregation membership denial'
);
select is(
  (select count(*)::integer from public.v7_pair_assignments
   where pair_id='a3000000-0000-4000-8000-000000000001'),
  0,
  'Switched mentor cannot read stale congregation A assignments'
);
select is(
  (select count(*)::integer from public.v7_mentor_pairs
   where id='a3000000-0000-4000-8000-000000000001'),
  0,
  'Switched mentor cannot read the stale congregation A pair'
);

-- Inspect persisted invariants outside authenticated RLS.
reset role;
select ok(
  (select state='active' and ended_at is null
   from public.v7_mentor_pairs where id='a3000000-0000-4000-8000-000000000001'),
  'Denied assignment attempts do not mutate the active pair lifecycle'
);
select is(
  (select count(*)::integer from public.v7_pair_assignments
   where pair_id='a3000000-0000-4000-8000-000000000001'
     and lesson_revision_id='a3400000-0000-4000-8000-000000000001'),
  1,
  'Existing assignment remains exactly once after denied stale retry'
);
select is(
  (select count(*)::integer from public.v7_pair_assignments
   where pair_id='a3000000-0000-4000-8000-000000000001'
     and lesson_revision_id='a3400000-0000-4000-8000-000000000002'),
  0,
  'Denied stale creation leaves no new assignment row'
);
select is(
  (select count(*)::integer from public.v7_pair_events
   where pair_id='a3000000-0000-4000-8000-000000000001'
     and event_type='assignment_created'),
  1,
  'Denied stale creation and retry append no assignment audit events'
);

select * from finish();
rollback;