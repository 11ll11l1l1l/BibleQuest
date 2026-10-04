begin;
create extension if not exists pgtap with schema extensions;
select plan(37);

-- Execute a statement as the current invoker and return SQLSTATE instead of
-- aborting the pgTAP transaction. This keeps negative RLS tests concise and
-- verifies the actual database boundary rather than reproducing policy logic.
create function pg_temp.v7_sqlstate(statement text)
returns text
language plpgsql
security invoker
as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

select ok((select relrowsecurity from pg_class where oid='public.v7_pair_assignments'::regclass),'V7 pair assignments keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_learner_progress'::regclass),'V7 learner progress keeps RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_lesson_responses'::regclass),'V7 lesson responses keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_response_shares'::regclass),'V7 response shares keep RLS enabled');
select ok(not has_table_privilege('anon','public.v7_mentor_pairs','INSERT'),'Anonymous callers cannot create mentor pairs');
select ok(not has_function_privilege('anon','public.bible_v7_transition_mentor_pair(uuid,text)','EXECUTE'),'Anonymous callers cannot invoke the pair lifecycle RPC');
select is(
  (select count(*)::bigint
   from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.prosecdef and p.proname like '%v7%'
     and has_function_privilege('anon',p.oid,'EXECUTE')),
  0::bigint,
  'No public V7 SECURITY DEFINER function is executable by anonymous callers'
);
select is(
  (select count(*)::bigint
   from pg_class c
   join pg_namespace n on n.oid=c.relnamespace
   where n.nspname='public' and c.relkind='v' and c.relname like '%v7%'
     and not coalesce(c.reloptions @> array['security_invoker=true']::text[],false)),
  0::bigint,
  'No V7 public view can bypass caller RLS through definer semantics'
);

-- Two active same-congregation pairs let the test prove cross-pair isolation.
insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state,mentor_accepted_at,mentee_accepted_at)
values
 ('8c000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','active',now(),now()),
 ('8c000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','active',now(),now());

insert into public.v7_tracks(id,congregation_id,title,locale,publication_state,created_by)
values ('9c000000-0000-4000-8000-000000000001',null,'P4 security track','en','published','11111111-1111-4111-8111-111111111111');
insert into public.v7_modules(id,track_id,title,display_order,publication_state)
values ('9d000000-0000-4000-8000-000000000001','9c000000-0000-4000-8000-000000000001','P4 module',0,'published');
insert into public.v7_lessons(id,module_id,title,display_order,publication_state)
values ('9e000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001','P4 lesson',0,'published');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,created_by)
values
 ('9f000000-0000-4000-8000-000000000001','9e000000-0000-4000-8000-000000000001',1,'en','11111111-1111-4111-8111-111111111111'),
 ('9f000000-0000-4000-8000-000000000002','9e000000-0000-4000-8000-000000000001',2,'en','11111111-1111-4111-8111-111111111111');
insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type,content)
values
 ('a0000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000001',0,'scripture','{}'),
 ('a0000000-0000-4000-8000-000000000002','9f000000-0000-4000-8000-000000000001',1,'understand','{}'),
 ('a0000000-0000-4000-8000-000000000003','9f000000-0000-4000-8000-000000000001',2,'discuss','{}'),
 ('a0000000-0000-4000-8000-000000000004','9f000000-0000-4000-8000-000000000001',3,'reflect','{}'),
 ('a0000000-0000-4000-8000-000000000005','9f000000-0000-4000-8000-000000000001',4,'apply','{}'),
 ('a0000000-0000-4000-8000-000000000006','9f000000-0000-4000-8000-000000000001',5,'pray','{}'),
 ('a0000000-0000-4000-8000-000000000007','9f000000-0000-4000-8000-000000000001',6,'action','{}'),
 ('a1000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000002',0,'scripture','{}'),
 ('a1000000-0000-4000-8000-000000000002','9f000000-0000-4000-8000-000000000002',1,'understand','{}'),
 ('a1000000-0000-4000-8000-000000000003','9f000000-0000-4000-8000-000000000002',2,'discuss','{}'),
 ('a1000000-0000-4000-8000-000000000004','9f000000-0000-4000-8000-000000000002',3,'reflect','{}'),
 ('a1000000-0000-4000-8000-000000000005','9f000000-0000-4000-8000-000000000002',4,'apply','{}'),
 ('a1000000-0000-4000-8000-000000000006','9f000000-0000-4000-8000-000000000002',5,'pray','{}'),
 ('a1000000-0000-4000-8000-000000000007','9f000000-0000-4000-8000-000000000002',6,'action','{}');
update public.v7_lesson_revisions set published_at=now() where id in ('9f000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000002');

insert into public.v7_pair_assignments(id,pair_id,lesson_revision_id,assigned_by,status)
values
 ('aa000000-0000-4000-8000-000000000001','8c000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','assigned'),
 ('aa000000-0000-4000-8000-000000000002','8c000000-0000-4000-8000-000000000002','9f000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','assigned');
insert into public.v7_learner_progress(id,assignment_id,learner_id,lesson_revision_id,current_step_id,status,started_at)
values ('ab000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','9f000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000003','in_progress',now());
insert into public.v7_lesson_responses(id,assignment_id,lesson_revision_id,lesson_step_id,learner_id,response)
values
 ('ac000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111112','{"text":"private P4 reflection"}'),
 ('ac000000-0000-4000-8000-000000000002','aa000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111112','{"text":"shared P4 prayer"}');
insert into public.v7_response_shares(id,response_id,recipient_id,share_state)
values ('ad000000-0000-4000-8000-000000000001','ac000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','shared');

-- Identity-changing updates are blocked even for privileged maintenance callers.
select is(pg_temp.v7_sqlstate($sql$update public.v7_pair_assignments set pair_id='8c000000-0000-4000-8000-000000000002' where id='aa000000-0000-4000-8000-000000000001'$sql$),'P0001','Assignment cannot be moved to a different pair');
select is(pg_temp.v7_sqlstate($sql$update public.v7_learner_progress set assignment_id='aa000000-0000-4000-8000-000000000002' where id='ab000000-0000-4000-8000-000000000001'$sql$),'P0001','Progress cannot be moved to another assignment');
select is(pg_temp.v7_sqlstate($sql$update public.v7_lesson_responses set lesson_step_id='a0000000-0000-4000-8000-000000000005' where id='ac000000-0000-4000-8000-000000000001'$sql$),'P0001','Response cannot be moved to another lesson step');
select is(pg_temp.v7_sqlstate($sql$update public.v7_response_shares set recipient_id='11111111-1111-4111-8111-111111111113' where id='ad000000-0000-4000-8000-000000000001'$sql$),'P0001','Response share cannot be retargeted to another recipient');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq($$select count(*)::bigint from public.v7_pair_assignments where pair_id='8c000000-0000-4000-8000-000000000002'$$,array[0::bigint],'Mentee cannot read another same-congregation pair assignment');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_learner_progress(id,assignment_id,learner_id,lesson_revision_id,status) values ('ab000000-0000-4000-8000-000000000002','aa000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111112','9f000000-0000-4000-8000-000000000001','not_started')$sql$),'42501','Mentee cannot create progress inside another pair');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_learner_progress(id,assignment_id,learner_id,lesson_revision_id,status) values ('ab000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111113','9f000000-0000-4000-8000-000000000001','not_started')$sql$),'42501','Mentee cannot forge progress ownership for another learner');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_learner_progress(id,assignment_id,learner_id,lesson_revision_id,status) values ('ab000000-0000-4000-8000-000000000004','aa000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','9f000000-0000-4000-8000-000000000002','not_started')$sql$),'23503','Progress cannot bind an assignment to a foreign lesson revision');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_lesson_responses(id,assignment_id,lesson_revision_id,lesson_step_id,learner_id,response) values ('ac000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000002','9f000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111112','{}')$sql$),'42501','Mentee cannot write a response into another pair');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_lesson_responses(id,assignment_id,lesson_revision_id,lesson_step_id,learner_id,response) values ('ac000000-0000-4000-8000-000000000004','aa000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111112','{}')$sql$),'42501','Mentee cannot substitute a different lesson revision into a response');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_lesson_responses(id,assignment_id,lesson_revision_id,lesson_step_id,learner_id,response) values ('ac000000-0000-4000-8000-000000000005','aa000000-0000-4000-8000-000000000001','9f000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111113','{}')$sql$),'42501','Mentee cannot forge another learner as response owner');
select is(pg_temp.v7_sqlstate($sql$update public.v7_lesson_responses set response='{"text":"edited safely"}' where id='ac000000-0000-4000-8000-000000000001'$sql$),'00000','Mentee can edit response content without changing its authorization identity');
select is(pg_temp.v7_sqlstate($sql$update public.v7_lesson_responses set lesson_step_id='a0000000-0000-4000-8000-000000000005' where id='ac000000-0000-4000-8000-000000000001'$sql$),'P0001','Mentee cannot move an existing response to another prompt');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_response_shares(id,response_id,recipient_id,share_state) values ('ad000000-0000-4000-8000-000000000002','ac000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111113','shared')$sql$),'42501','Mentee cannot share a private response with a non-mentor pair outsider');
select is(pg_temp.v7_sqlstate($sql$update public.v7_response_shares set share_state='revoked',revoked_at=now() where id='ad000000-0000-4000-8000-000000000001'$sql$),'00000','Response owner can revoke an explicit mentor share');
select is(private.v7_pair_has_user('8c000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',false),false,'Authenticated helper rejects spoofing another user id');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_sqlstate($sql$update public.v7_pair_assignments set status='started' where id='aa000000-0000-4000-8000-000000000001'$sql$),'00000','Mentor can still update bounded assignment state');
select is(pg_temp.v7_sqlstate($sql$update public.v7_pair_assignments set pair_id='8c000000-0000-4000-8000-000000000002' where id='aa000000-0000-4000-8000-000000000001'$sql$),'P0001','Mentor cannot retarget an assignment to another active pair');
select is(pg_temp.v7_sqlstate($sql$update public.v7_pair_assignments set assigned_by='11111111-1111-4111-8111-111111111113' where id='aa000000-0000-4000-8000-000000000001'$sql$),'P0001','Mentor cannot forge assignment attribution');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state) values ('8c000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','invited')$sql$),'42501','Leader cannot forge a pair with a user outside the congregation');
select is(pg_temp.v7_sqlstate($sql$insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state) values ('8c000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','invited')$sql$),'23514','Leader cannot manufacture a pair between two other people');
select results_eq($$select count(*)::bigint from public.v7_lesson_responses$$,array[1::bigint],'Mentor sees only the response explicitly shared with them');
select results_eq($$select count(*)::bigint from public.v7_lesson_responses where response->>'text'='edited safely'$$,array[0::bigint],'Private edited response remains invisible to mentor');

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';
select results_eq($$select count(*)::bigint from public.v7_pair_assignments$$,array[0::bigint],'Cross-congregation member cannot read pair assignments');
select results_eq($$select count(*)::bigint from public.v7_learner_progress$$,array[0::bigint],'Cross-congregation member cannot read learner progress');
select results_eq($$select count(*)::bigint from public.v7_lesson_responses$$,array[0::bigint],'Cross-congregation member cannot read lesson responses');
select is(pg_temp.v7_sqlstate($sql$select public.bible_v7_transition_mentor_pair('8c000000-0000-4000-8000-000000000001','end')$sql$),'42501','Non-participant cannot use the lifecycle RPC to mutate another pair');
select is(private.v7_pair_has_user('8c000000-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222',false),false,'Cross-congregation caller cannot use the pair helper as an RLS bypass');

reset role;
select * from finish();
rollback;
