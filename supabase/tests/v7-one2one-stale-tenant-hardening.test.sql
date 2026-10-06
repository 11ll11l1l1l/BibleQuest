begin;
create extension if not exists pgtap with schema extensions;
select plan(39);

create function pg_temp.v7_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

create function pg_temp.v7_rows_affected(statement text)
returns integer language plpgsql security invoker as $bq$
declare affected integer;
begin
  execute statement;
  get diagnostics affected = row_count;
  return affected;
end;
$bq$;

-- Isolated ONE 2 ONE fixture in Congregation A. Pastor A is the mentor so the
-- test can deactivate their membership without touching the congregation owner.
insert into public.v7_mentor_pairs(
  id, congregation_id, mentor_id, mentee_id, initiated_by, state,
  mentor_accepted_at, mentee_accepted_at
) values (
  'b3000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  '11111111-1111-4111-8111-111111111112',
  '11111111-1111-4111-8111-111111111113',
  'active', now(), now()
);

insert into public.v7_pair_events(pair_id, actor_id, event_type, metadata)
values (
  'b3000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  'accepted',
  '{"fixture":"a3-stale-tenant"}'::jsonb
);

insert into public.v7_tracks(id, congregation_id, title, locale, publication_state, created_by)
values (
  'b3100000-0000-4000-8000-000000000001', null,
  'A3 stale tenant track', 'en', 'published',
  '11111111-1111-4111-8111-111111111113'
);
insert into public.v7_modules(id, track_id, title, display_order, publication_state)
values (
  'b3200000-0000-4000-8000-000000000001',
  'b3100000-0000-4000-8000-000000000001',
  'A3 module', 0, 'published'
);
insert into public.v7_lessons(id, module_id, title, display_order, publication_state)
values (
  'b3300000-0000-4000-8000-000000000001',
  'b3200000-0000-4000-8000-000000000001',
  'A3 lesson', 0, 'published'
);
insert into public.v7_lesson_revisions(id, lesson_id, revision_number, locale, created_by)
values (
  'b3400000-0000-4000-8000-000000000001',
  'b3300000-0000-4000-8000-000000000001',
  1, 'en', '11111111-1111-4111-8111-111111111113'
);
insert into public.v7_lesson_steps(id, lesson_revision_id, position, step_type, content)
values
 ('b3500000-0000-4000-8000-000000000001','b3400000-0000-4000-8000-000000000001',0,'scripture','{}'),
 ('b3500000-0000-4000-8000-000000000002','b3400000-0000-4000-8000-000000000001',1,'understand','{}'),
 ('b3500000-0000-4000-8000-000000000003','b3400000-0000-4000-8000-000000000001',2,'discuss','{}'),
 ('b3500000-0000-4000-8000-000000000004','b3400000-0000-4000-8000-000000000001',3,'reflect','{}'),
 ('b3500000-0000-4000-8000-000000000005','b3400000-0000-4000-8000-000000000001',4,'apply','{}'),
 ('b3500000-0000-4000-8000-000000000006','b3400000-0000-4000-8000-000000000001',5,'pray','{}'),
 ('b3500000-0000-4000-8000-000000000007','b3400000-0000-4000-8000-000000000001',6,'action','{}');
update public.v7_lesson_revisions
set published_at = now()
where id = 'b3400000-0000-4000-8000-000000000001';

insert into public.v7_pair_assignments(id, pair_id, lesson_revision_id, assigned_by, status)
values (
  'b3600000-0000-4000-8000-000000000001',
  'b3000000-0000-4000-8000-000000000001',
  'b3400000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111113',
  'assigned'
);
insert into public.v7_learner_progress(
  id, assignment_id, learner_id, lesson_revision_id, current_step_id, status, started_at
) values (
  'b3700000-0000-4000-8000-000000000001',
  'b3600000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111112',
  'b3400000-0000-4000-8000-000000000001',
  'b3500000-0000-4000-8000-000000000003',
  'in_progress', now()
);
insert into public.v7_lesson_responses(
  id, assignment_id, lesson_revision_id, lesson_step_id, learner_id, response
) values
 (
  'b3800000-0000-4000-8000-000000000001',
  'b3600000-0000-4000-8000-000000000001',
  'b3400000-0000-4000-8000-000000000001',
  'b3500000-0000-4000-8000-000000000004',
  '11111111-1111-4111-8111-111111111112',
  '{"text":"A3 private reflection"}'
 ),
 (
  'b3800000-0000-4000-8000-000000000002',
  'b3600000-0000-4000-8000-000000000001',
  'b3400000-0000-4000-8000-000000000001',
  'b3500000-0000-4000-8000-000000000006',
  '11111111-1111-4111-8111-111111111112',
  '{"text":"A3 shared prayer"}'
 );
insert into public.v7_response_shares(id, response_id, recipient_id, share_state)
values (
  'b3900000-0000-4000-8000-000000000001',
  'b3800000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111113',
  'shared'
);

-- Baseline: both participants are active Congregation A members and the normal
-- participant collaboration surface is available.
set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111113';
select is((select count(*)::integer from public.v7_mentor_pairs where id='b3000000-0000-4000-8000-000000000001'),1,'Active mentor can read own pair');
select is((select count(*)::integer from public.v7_pair_events where pair_id='b3000000-0000-4000-8000-000000000001'),1,'Active mentor can read pair history');
select is((select count(*)::integer from public.v7_pair_assignments where id='b3600000-0000-4000-8000-000000000001'),1,'Active mentor can read assignment');
select is((select count(*)::integer from public.v7_learner_progress where id='b3700000-0000-4000-8000-000000000001'),1,'Active mentor can read operational learner progress');
select is((select count(*)::integer from public.v7_lesson_responses where id='b3800000-0000-4000-8000-000000000002'),1,'Active mentor can read explicitly shared response');
select is((select count(*)::integer from public.v7_response_shares where id='b3900000-0000-4000-8000-000000000001'),1,'Active mentor can read share metadata addressed to them');

set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111112';
select is((select count(*)::integer from public.v7_mentor_pairs where id='b3000000-0000-4000-8000-000000000001'),1,'Active learner can read own pair');
select is((select count(*)::integer from public.v7_pair_assignments where id='b3600000-0000-4000-8000-000000000001'),1,'Active learner can read assignment');
select is((select count(*)::integer from public.v7_learner_progress where id='b3700000-0000-4000-8000-000000000001'),1,'Active learner can read own operational progress');
select is((select count(*)::integer from public.v7_lesson_responses where assignment_id='b3600000-0000-4000-8000-000000000001'),2,'Active learner can read both owned responses');
select is((select count(*)::integer from public.v7_response_shares where id='b3900000-0000-4000-8000-000000000001'),1,'Active learner can read owned share metadata');

-- Simulate mentor switching congregations: old Congregation A membership is
-- inactive while the same authenticated user is active in Congregation B.
reset role;
update public.bible_congregation_members
set active = false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111113';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values (
  '20000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111113',
  'member','Pastor A switched to B',true
)
on conflict (congregation_id,user_id) do update set active=true;
select is((select count(*)::integer from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111113' and active),0,'Mentor old-tenant membership is inactive');
select is((select count(*)::integer from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002' and user_id='11111111-1111-4111-8111-111111111113' and active),1,'Mentor is active in a different tenant');

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111113';
select is((select count(*)::integer from public.v7_mentor_pairs where id='b3000000-0000-4000-8000-000000000001'),0,'Switched mentor cannot read stale old-tenant pair');
select is((select count(*)::integer from public.v7_pair_events where pair_id='b3000000-0000-4000-8000-000000000001'),0,'Switched mentor cannot read stale old-tenant pair events');
select is((select count(*)::integer from public.v7_pair_assignments where id='b3600000-0000-4000-8000-000000000001'),0,'Switched mentor cannot read stale old-tenant assignment');
select is((select count(*)::integer from public.v7_learner_progress where id='b3700000-0000-4000-8000-000000000001'),0,'Switched mentor cannot read old-tenant operational progress');
select is((select count(*)::integer from public.v7_lesson_responses where id='b3800000-0000-4000-8000-000000000002'),0,'Switched mentor loses shared old-tenant response access');
select is((select count(*)::integer from public.v7_response_shares where id='b3900000-0000-4000-8000-000000000001'),0,'Switched mentor loses old-tenant share metadata');
select is(pg_temp.v7_rows_affected($sql$update public.v7_pair_assignments set status='cancelled' where id='b3600000-0000-4000-8000-000000000001'$sql$),0,'Switched mentor cannot mutate stale old-tenant assignment');

-- Restore the mentor to Congregation A, then switch only the learner to B. Pair
-- history remains available to the still-current mentor, while active learner
-- collaboration closes because both pair participants are no longer current.
reset role;
update public.bible_congregation_members
set active = true
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111113';
delete from public.bible_congregation_members
where congregation_id='20000000-0000-4000-8000-000000000002'
  and user_id='11111111-1111-4111-8111-111111111113';
update public.bible_congregation_members
set active = false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111112';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values (
  '20000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111112',
  'member','Member A switched to B',true
)
on conflict (congregation_id,user_id) do update set active=true;

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111113';
select is((select count(*)::integer from public.v7_mentor_pairs where id='b3000000-0000-4000-8000-000000000001'),1,'Current mentor retains tenant-scoped pair history after learner leaves');
select is((select count(*)::integer from public.v7_pair_assignments where id='b3600000-0000-4000-8000-000000000001'),1,'Current mentor retains tenant-scoped assignment history after learner leaves');
select is((select count(*)::integer from public.v7_learner_progress where id='b3700000-0000-4000-8000-000000000001'),0,'Current mentor cannot use active progress surface after learner leaves tenant');
select is((select count(*)::integer from public.v7_lesson_responses where id='b3800000-0000-4000-8000-000000000002'),0,'Current mentor loses shared response access after learner leaves tenant');
select is((select count(*)::integer from public.v7_response_shares where id='b3900000-0000-4000-8000-000000000001'),0,'Current mentor loses share metadata after learner leaves tenant');

reset role;
select is((select count(*)::integer from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111112' and active),0,'Learner old-tenant membership is inactive');
select is((select count(*)::integer from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002' and user_id='11111111-1111-4111-8111-111111111112' and active),1,'Learner is active in a different tenant');

-- The learner's narrow owner-history exception is intentional: private response
-- content and share history remain reviewable/revocable, but pair/progress and
-- response editing/re-sharing fail closed in the stale tenant.
set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-4111-8111-111111111112';
select is((select count(*)::integer from public.v7_mentor_pairs where id='b3000000-0000-4000-8000-000000000001'),0,'Switched learner cannot read stale old-tenant pair');
select is((select count(*)::integer from public.v7_pair_events where pair_id='b3000000-0000-4000-8000-000000000001'),0,'Switched learner cannot read stale old-tenant pair events');
select is((select count(*)::integer from public.v7_pair_assignments where id='b3600000-0000-4000-8000-000000000001'),0,'Switched learner cannot read stale old-tenant assignment');
select is((select count(*)::integer from public.v7_learner_progress where id='b3700000-0000-4000-8000-000000000001'),0,'Switched learner cannot read stale operational progress');
select is((select count(*)::integer from public.v7_lesson_responses where assignment_id='b3600000-0000-4000-8000-000000000001'),2,'Switched learner retains owned private response history');
select is((select count(*)::integer from public.v7_response_shares where id='b3900000-0000-4000-8000-000000000001'),1,'Switched learner retains owned share history');
select is(pg_temp.v7_rows_affected($sql$update public.v7_lesson_responses set response='{"text":"stale edit"}' where id='b3800000-0000-4000-8000-000000000001'$sql$),0,'Switched learner cannot edit old-tenant response');
select isnt(pg_temp.v7_sqlstate($sql$insert into public.v7_lesson_responses(id,assignment_id,lesson_revision_id,lesson_step_id,learner_id,response) values ('b3800000-0000-4000-8000-000000000003','b3600000-0000-4000-8000-000000000001','b3400000-0000-4000-8000-000000000001','b3500000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111112','{}')$sql$),'00000','Switched learner cannot add old-tenant response');
select isnt(pg_temp.v7_sqlstate($sql$insert into public.v7_response_shares(id,response_id,recipient_id,share_state) values ('b3900000-0000-4000-8000-000000000002','b3800000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111113','shared')$sql$),'00000','Switched learner cannot create a new old-tenant share');
select is(pg_temp.v7_rows_affected($sql$update public.v7_response_shares set share_state='revoked',revoked_at=now() where id='b3900000-0000-4000-8000-000000000001'$sql$),1,'Switched learner can revoke historical sharing of owned response');
select is((select share_state from public.v7_response_shares where id='b3900000-0000-4000-8000-000000000001'),'revoked','Historical share revocation remains visible to owner');
select is(pg_temp.v7_rows_affected($sql$delete from public.v7_lesson_responses where id='b3800000-0000-4000-8000-000000000001'$sql$),1,'Switched learner retains deletion control over owned private response history');

reset role;
select * from finish();
rollback;
