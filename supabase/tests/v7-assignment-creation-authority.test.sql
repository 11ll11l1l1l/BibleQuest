begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

create function pg_temp.v7_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

select ok(not has_function_privilege('anon','public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'Anonymous callers cannot create V7 assignments');
select ok(has_function_privilege('authenticated','public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'Authenticated callers can use the bounded assignment RPC');
select ok(not has_table_privilege('authenticated','public.v7_pair_assignments','INSERT'),'Authenticated clients cannot bypass assignment creation with direct table inserts');
select ok(exists(
  select 1
  from pg_index i
  join pg_class c on c.oid=i.indexrelid
  join pg_class t on t.oid=i.indrelid
  join pg_namespace n on n.oid=t.relnamespace
  where n.nspname='public'
    and t.relname='v7_pair_assignments'
    and c.relname='v7_pair_assignments_one_live_revision_idx'
    and i.indisunique
    and pg_get_expr(i.indpred,i.indrelid) like '%status%cancelled%'
),'A partial unique index guards one non-cancelled assignment per pair and revision');

insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state,mentor_accepted_at,mentee_accepted_at)
values ('8e000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','active',now(),now());

insert into public.v7_tracks(id,congregation_id,title,locale,publication_state,created_by)
values
 ('9a000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','Assignment authority A','en','published','11111111-1111-4111-8111-111111111111'),
 ('9a000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Assignment authority B','en','published','22222222-2222-4222-8222-222222222221');
insert into public.v7_modules(id,track_id,title,display_order,publication_state)
values
 ('9b000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001','Module A',0,'published'),
 ('9b000000-0000-4000-8000-000000000002','9a000000-0000-4000-8000-000000000002','Module B',0,'published');
insert into public.v7_lessons(id,module_id,title,display_order,publication_state)
values
 ('9c000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001','Lesson A',0,'published'),
 ('9c000000-0000-4000-8000-000000000002','9b000000-0000-4000-8000-000000000002','Lesson B',0,'published');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,published_at,created_by)
values
 ('9d000000-0000-4000-8000-000000000001','9c000000-0000-4000-8000-000000000001',1,'en',null,'11111111-1111-4111-8111-111111111111'),
 ('9d000000-0000-4000-8000-000000000002','9c000000-0000-4000-8000-000000000002',1,'en',null,'22222222-2222-4222-8222-222222222221');

insert into public.v7_lesson_steps(lesson_revision_id,position,step_type,content)
select r.id, s.position::smallint, s.step_type, '{}'::jsonb
from public.v7_lesson_revisions r
cross join (values (0,'scripture'),(1,'understand'),(2,'discuss'),(3,'reflect'),(4,'apply'),(5,'pray'),(6,'action')) as s(position,step_type)
where r.id in ('9d000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000002');
update public.v7_lesson_revisions set published_at=now()
where id in ('9d000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000002');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select ok((
  select assignment_id is not null and assignment_status='assigned'
  from public.bible_v7_create_pair_assignment(
    '8e000000-0000-4000-8000-000000000001',
    '9a000000-0000-4000-8000-000000000001',
    '9b000000-0000-4000-8000-000000000001',
    '9c000000-0000-4000-8000-000000000001',
    '9d000000-0000-4000-8000-000000000001'
  )
),'Active mentor can create the exact published assignment');
select is((select count(*)::integer from public.v7_pair_assignments where pair_id='8e000000-0000-4000-8000-000000000001' and lesson_revision_id='9d000000-0000-4000-8000-000000000001'),1,'First create produces exactly one assignment row');
select is((select count(*)::integer from public.v7_pair_events where pair_id='8e000000-0000-4000-8000-000000000001' and event_type='assignment_created'),1,'First create appends exactly one server-owned audit event');
select is((
  select assignment_id from public.bible_v7_create_pair_assignment(
    '8e000000-0000-4000-8000-000000000001',
    '9a000000-0000-4000-8000-000000000001',
    '9b000000-0000-4000-8000-000000000001',
    '9c000000-0000-4000-8000-000000000001',
    '9d000000-0000-4000-8000-000000000001'
  )
),(select id from public.v7_pair_assignments where pair_id='8e000000-0000-4000-8000-000000000001' and lesson_revision_id='9d000000-0000-4000-8000-000000000001' and status <> 'cancelled'),'Retry returns the stable existing assignment identity');
select is((select count(*)::integer from public.v7_pair_events where pair_id='8e000000-0000-4000-8000-000000000001' and event_type='assignment_created'),1,'Idempotent retry does not duplicate assignment audit history');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select is(pg_temp.v7_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('8e000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001','9c000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001')$sql$),'42501','Mentee cannot create an assignment');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('8e000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000002','9b000000-0000-4000-8000-000000000002','9c000000-0000-4000-8000-000000000002','9d000000-0000-4000-8000-000000000002')$sql$),'P0001','Cross-congregation curriculum cannot be assigned');
select is(pg_temp.v7_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('8e000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000002','9b000000-0000-4000-8000-000000000001','9c000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001')$sql$),'P0001','Mismatched hierarchy identifiers fail closed');

reset role;
update public.v7_lessons set publication_state='withdrawn' where id='9c000000-0000-4000-8000-000000000001';
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('8e000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001','9c000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001')$sql$),'P0001','Retry does not bypass current publication validation');

reset role;
update public.v7_lessons set publication_state='published' where id='9c000000-0000-4000-8000-000000000001';
update public.v7_mentor_pairs set state='ended',ended_at=now() where id='8e000000-0000-4000-8000-000000000001';
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('8e000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001','9c000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001')$sql$),'42501','Ended pair cannot create or retry an assignment');

reset role;
update public.v7_mentor_pairs set state='active',ended_at=null where id='8e000000-0000-4000-8000-000000000001';
update public.bible_congregation_members set active=false where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_sqlstate($sql$select * from public.bible_v7_create_pair_assignment('8e000000-0000-4000-8000-000000000001','9a000000-0000-4000-8000-000000000001','9b000000-0000-4000-8000-000000000001','9c000000-0000-4000-8000-000000000001','9d000000-0000-4000-8000-000000000001')$sql$),'42501','Inactive mentor membership invalidates assignment authority');

reset role;
update public.bible_congregation_members set active=true where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111111';
update public.v7_pair_assignments set status='cancelled' where pair_id='8e000000-0000-4000-8000-000000000001' and lesson_revision_id='9d000000-0000-4000-8000-000000000001' and status <> 'cancelled';
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select ok((
  select assignment_id is not null and assignment_status='assigned'
  from public.bible_v7_create_pair_assignment(
    '8e000000-0000-4000-8000-000000000001',
    '9a000000-0000-4000-8000-000000000001',
    '9b000000-0000-4000-8000-000000000001',
    '9c000000-0000-4000-8000-000000000001',
    '9d000000-0000-4000-8000-000000000001'
  )
),'Cancelled history permits one new live assignment');
select is((select count(*)::integer from public.v7_pair_assignments where pair_id='8e000000-0000-4000-8000-000000000001' and lesson_revision_id='9d000000-0000-4000-8000-000000000001'),2,'Reassignment preserves the cancelled historical assignment');
select is((select count(*)::integer from public.v7_pair_assignments where pair_id='8e000000-0000-4000-8000-000000000001' and lesson_revision_id='9d000000-0000-4000-8000-000000000001' and status <> 'cancelled'),1,'Reassignment still leaves exactly one live assignment');
select is((select count(*)::integer from public.v7_pair_events where pair_id='8e000000-0000-4000-8000-000000000001' and event_type='assignment_created'),2,'Reassignment appends one new assignment-created audit event');

reset role;
select * from finish();
rollback;
