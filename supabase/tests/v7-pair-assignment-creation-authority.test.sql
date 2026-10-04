begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

create function pg_temp.v7_assignment_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

select ok(not has_function_privilege('anon','public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'Anonymous callers cannot create V7 pair assignments');
select ok(has_function_privilege('authenticated','public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'Authenticated callers can invoke the bounded assignment authority');
select ok(not has_table_privilege('authenticated','public.v7_pair_assignments','INSERT'),'Authenticated clients cannot insert pair assignments directly');
select ok(to_regclass('public.v7_pair_assignments_one_active_revision_idx') is not null,'Database race barrier exists for one non-cancelled pair/revision assignment');

-- Congregation-A exact published curriculum path.
insert into public.v7_tracks(id,congregation_id,title,locale,revision_id,publication_state,created_by)
values ('e9000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Assignment track A','en','e9010000-0000-4000-8000-000000000001','draft','11111111-1111-4111-8111-111111111111');
insert into public.v7_modules(id,track_id,title,revision_id,display_order,publication_state)
values ('e9100000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','Assignment module A','e9110000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lessons(id,module_id,title,revision_id,display_order,publication_state)
values ('e9200000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','Assignment lesson A','e9210000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,created_by)
values ('e9300000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001',1,'en','11111111-1111-4111-8111-111111111111');
insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type) values
 ('ea000000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001',0,'scripture'),
 ('ea000000-0000-4000-8000-000000000002','e9300000-0000-4000-8000-000000000001',1,'understand'),
 ('ea000000-0000-4000-8000-000000000003','e9300000-0000-4000-8000-000000000001',2,'discuss'),
 ('ea000000-0000-4000-8000-000000000004','e9300000-0000-4000-8000-000000000001',3,'reflect'),
 ('ea000000-0000-4000-8000-000000000005','e9300000-0000-4000-8000-000000000001',4,'apply'),
 ('ea000000-0000-4000-8000-000000000006','e9300000-0000-4000-8000-000000000001',5,'pray'),
 ('ea000000-0000-4000-8000-000000000007','e9300000-0000-4000-8000-000000000001',6,'action');
update public.v7_lesson_revisions set published_at=now() where id='e9300000-0000-4000-8000-000000000001';
update public.v7_lessons set publication_state='published' where id='e9200000-0000-4000-8000-000000000001';
update public.v7_modules set publication_state='published' where id='e9100000-0000-4000-8000-000000000001';
update public.v7_tracks set publication_state='published' where id='e9000000-0000-4000-8000-000000000001';

-- Congregation-B published path proves tenant binding.
insert into public.v7_tracks(id,congregation_id,title,locale,revision_id,publication_state,created_by)
values ('f9000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002','Assignment track B','en','f9010000-0000-4000-8000-000000000001','draft','99999999-9999-4999-8999-999999999999');
insert into public.v7_modules(id,track_id,title,revision_id,display_order,publication_state)
values ('f9100000-0000-4000-8000-000000000001','f9000000-0000-4000-8000-000000000001','Assignment module B','f9110000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lessons(id,module_id,title,revision_id,display_order,publication_state)
values ('f9200000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000001','Assignment lesson B','f9210000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,created_by)
values ('f9300000-0000-4000-8000-000000000001','f9200000-0000-4000-8000-000000000001',1,'en','99999999-9999-4999-8999-999999999999');
insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type) values
 ('fa000000-0000-4000-8000-000000000001','f9300000-0000-4000-8000-000000000001',0,'scripture'),
 ('fa000000-0000-4000-8000-000000000002','f9300000-0000-4000-8000-000000000001',1,'understand'),
 ('fa000000-0000-4000-8000-000000000003','f9300000-0000-4000-8000-000000000001',2,'discuss'),
 ('fa000000-0000-4000-8000-000000000004','f9300000-0000-4000-8000-000000000001',3,'reflect'),
 ('fa000000-0000-4000-8000-000000000005','f9300000-0000-4000-8000-000000000001',4,'apply'),
 ('fa000000-0000-4000-8000-000000000006','f9300000-0000-4000-8000-000000000001',5,'pray'),
 ('fa000000-0000-4000-8000-000000000007','f9300000-0000-4000-8000-000000000001',6,'action');
update public.v7_lesson_revisions set published_at=now() where id='f9300000-0000-4000-8000-000000000001';
update public.v7_lessons set publication_state='published' where id='f9200000-0000-4000-8000-000000000001';
update public.v7_modules set publication_state='published' where id='f9100000-0000-4000-8000-000000000001';
update public.v7_tracks set publication_state='published' where id='f9000000-0000-4000-8000-000000000001';

-- Congregation-A draft path proves assignment cannot outrun publication.
insert into public.v7_tracks(id,congregation_id,title,locale,revision_id,publication_state,created_by)
values ('a9000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Assignment draft track','en','a9010000-0000-4000-8000-000000000001','draft','11111111-1111-4111-8111-111111111111');
insert into public.v7_modules(id,track_id,title,revision_id,display_order,publication_state)
values ('a9100000-0000-4000-8000-000000000001','a9000000-0000-4000-8000-000000000001','Assignment draft module','a9110000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lessons(id,module_id,title,revision_id,display_order,publication_state)
values ('a9200000-0000-4000-8000-000000000001','a9100000-0000-4000-8000-000000000001','Assignment draft lesson','a9210000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,created_by)
values ('a9300000-0000-4000-8000-000000000001','a9200000-0000-4000-8000-000000000001',1,'en','11111111-1111-4111-8111-111111111111');

insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state,mentor_accepted_at,mentee_accepted_at)
values
 ('e8000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','active',now(),now()),
 ('e8100000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111113','11111111-1111-4111-8111-111111111111','ended',now(),now());

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select is(pg_temp.v7_assignment_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001')$sql$),'42501','Mentee cannot create an assignment for the pair');
reset role;
select is((select count(*)::integer from public.v7_pair_assignments where pair_id='e8000000-0000-4000-8000-000000000001'),0,'Rejected mentee request writes nothing');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_assignment_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('e8100000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001')$sql$),'55000','Ended pair cannot receive a new assignment');
select is(pg_temp.v7_assignment_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','f9000000-0000-4000-8000-000000000001','f9100000-0000-4000-8000-000000000001','f9200000-0000-4000-8000-000000000001','f9300000-0000-4000-8000-000000000001')$sql$),'42501','Cross-congregation curriculum cannot be assigned');
select is(pg_temp.v7_assignment_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','a9000000-0000-4000-8000-000000000001','a9100000-0000-4000-8000-000000000001','a9200000-0000-4000-8000-000000000001','a9300000-0000-4000-8000-000000000001')$sql$),'55000','Unpublished curriculum cannot be assigned');
select is(pg_temp.v7_assignment_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','a9100000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001')$sql$),'22023','Stale or mismatched hierarchy identity is rejected before write');
select is(pg_temp.v7_assignment_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001')$sql$),'00000','Active mentor can create an assignment for the exact published path');
reset role;
select is((select count(*)::integer from public.v7_pair_assignments where pair_id='e8000000-0000-4000-8000-000000000001' and lesson_revision_id='e9300000-0000-4000-8000-000000000001' and status <> 'cancelled'),1,'Successful creation produces exactly one active assignment');
select is((select assigned_by from public.v7_pair_assignments where pair_id='e8000000-0000-4000-8000-000000000001' and lesson_revision_id='e9300000-0000-4000-8000-000000000001'),'11111111-1111-4111-8111-111111111111'::uuid,'Canonical assignment records the authenticated mentor');
create temporary table v7_assignment_receipt as
select id from public.v7_pair_assignments where pair_id='e8000000-0000-4000-8000-000000000001' and lesson_revision_id='e9300000-0000-4000-8000-000000000001' and status <> 'cancelled';

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_assignment_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001')$sql$),'00000','Exact assignment retry succeeds idempotently');
select is((select r.id from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001') r),(select id from v7_assignment_receipt),'Idempotent retry returns the stable canonical assignment ID');
reset role;
select is((select count(*)::integer from public.v7_pair_assignments where pair_id='e8000000-0000-4000-8000-000000000001' and lesson_revision_id='e9300000-0000-4000-8000-000000000001' and status <> 'cancelled'),1,'Repeated identical intent never duplicates the active assignment');
select is((select count(*)::integer from public.v7_pair_events where pair_id='e8000000-0000-4000-8000-000000000001' and event_type='assignment_created'),1,'Idempotent creation emits exactly one assignment-created event');

update public.v7_pair_assignments set status='started' where id=(select id from v7_assignment_receipt);
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is((select r.status from public.bible_v7_create_pair_assignment('e8000000-0000-4000-8000-000000000001','e9000000-0000-4000-8000-000000000001','e9100000-0000-4000-8000-000000000001','e9200000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001') r),'started','Retry preserves existing assignment lifecycle status instead of resetting it');
reset role;
select is((select count(*)::integer from public.v7_pair_assignments where pair_id='e8000000-0000-4000-8000-000000000001' and lesson_revision_id='e9300000-0000-4000-8000-000000000001' and status <> 'cancelled'),1,'Lifecycle-preserving retry still leaves one canonical assignment');
select is(pg_temp.v7_assignment_sqlstate($sql$insert into public.v7_pair_assignments(pair_id,lesson_revision_id,assigned_by,status) values ('e8000000-0000-4000-8000-000000000001','e9300000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','assigned')$sql$),'23505','Database unique barrier rejects a competing privileged active assignment');

select * from finish();
rollback;
