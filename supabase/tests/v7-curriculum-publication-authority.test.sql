begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

create function pg_temp.v7_publication_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

select ok(not has_function_privilege('anon','public.bible_v7_publish_curriculum_path(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid[])','EXECUTE'),'Anonymous callers cannot publish V7 curriculum');
select ok(has_function_privilege('authenticated','public.bible_v7_publish_curriculum_path(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid[])','EXECUTE'),'Authenticated callers can invoke bounded V7 curriculum publication');
select ok(not has_function_privilege('anon','public.bible_v7_withdraw_curriculum_lesson(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'Anonymous callers cannot withdraw V7 curriculum lessons');
select ok(has_function_privilege('authenticated','public.bible_v7_withdraw_curriculum_lesson(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)','EXECUTE'),'Authenticated callers can invoke bounded V7 curriculum withdrawal');

-- One publishable congregation-A Library revision.
insert into public.v7_library_items(id,content_type,congregation_id,publication_state,current_revision_id,created_by)
values ('b7000000-0000-4000-8000-000000000001','devotional','10000000-0000-4000-8000-000000000001','published','b7100000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111');
insert into public.v7_library_revisions(id,item_id,revision_number,source_locale,title,source_kind,source_title,source_catalog_id,rights_status,rights_holder,rights_basis,attribution,allowed_uses,publication_state,review_status,reviewer_id,reviewed_at,created_by)
values ('b7100000-0000-4000-8000-000000000001','b7000000-0000-4000-8000-000000000001',1,'en','Publication reference','first_party','BibleQuest','catalog:publication-reference','verified','BibleQuest','original work','','["display"]','published','approved','11111111-1111-4111-8111-111111111111',now(),'11111111-1111-4111-8111-111111111111');

-- Draft Library content is deliberately not publishable through curriculum.
insert into public.v7_library_items(id,content_type,congregation_id,publication_state,current_revision_id,created_by)
values ('c7000000-0000-4000-8000-000000000001','devotional','10000000-0000-4000-8000-000000000001','draft',null,'11111111-1111-4111-8111-111111111111');
insert into public.v7_library_revisions(id,item_id,revision_number,source_locale,title,source_kind,source_title,source_catalog_id,rights_status,attribution,allowed_uses,publication_state,review_status,created_by)
values ('c7100000-0000-4000-8000-000000000001','c7000000-0000-4000-8000-000000000001',1,'en','Draft reference','first_party','BibleQuest','catalog:draft-reference','unknown','','["display"]','draft','draft','11111111-1111-4111-8111-111111111111');

-- Valid draft publication path.
insert into public.v7_tracks(id,congregation_id,title,locale,revision_id,publication_state,created_by)
values ('b9000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','P3 publish track','en','b9010000-0000-4000-8000-000000000001','draft','11111111-1111-4111-8111-111111111111');
insert into public.v7_modules(id,track_id,title,revision_id,display_order,publication_state)
values ('b9100000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','P3 publish module','b9110000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lessons(id,module_id,title,revision_id,display_order,publication_state)
values ('b9200000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','P3 publish lesson','b9210000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,created_by)
values ('b9300000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001',1,'en','11111111-1111-4111-8111-111111111111');
insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type,library_revision_id) values
 ('ba000000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001',0,'scripture','b7100000-0000-4000-8000-000000000001'),
 ('ba000000-0000-4000-8000-000000000002','b9300000-0000-4000-8000-000000000001',1,'understand',null),
 ('ba000000-0000-4000-8000-000000000003','b9300000-0000-4000-8000-000000000001',2,'discuss',null),
 ('ba000000-0000-4000-8000-000000000004','b9300000-0000-4000-8000-000000000001',3,'reflect',null),
 ('ba000000-0000-4000-8000-000000000005','b9300000-0000-4000-8000-000000000001',4,'apply',null),
 ('ba000000-0000-4000-8000-000000000006','b9300000-0000-4000-8000-000000000001',5,'pray',null),
 ('ba000000-0000-4000-8000-000000000007','b9300000-0000-4000-8000-000000000001',6,'action',null);

-- Incomplete path proves the server does not trust client readiness.
insert into public.v7_tracks(id,congregation_id,title,locale,revision_id,publication_state,created_by)
values ('c9000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','P3 incomplete track','en','c9010000-0000-4000-8000-000000000001','draft','11111111-1111-4111-8111-111111111111');
insert into public.v7_modules(id,track_id,title,revision_id,display_order,publication_state)
values ('c9100000-0000-4000-8000-000000000001','c9000000-0000-4000-8000-000000000001','P3 incomplete module','c9110000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lessons(id,module_id,title,revision_id,display_order,publication_state)
values ('c9200000-0000-4000-8000-000000000001','c9100000-0000-4000-8000-000000000001','P3 incomplete lesson','c9210000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,created_by)
values ('c9300000-0000-4000-8000-000000000001','c9200000-0000-4000-8000-000000000001',1,'en','11111111-1111-4111-8111-111111111111');
insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type) values
 ('cb000000-0000-4000-8000-000000000001','c9300000-0000-4000-8000-000000000001',0,'scripture'),
 ('cb000000-0000-4000-8000-000000000002','c9300000-0000-4000-8000-000000000001',1,'understand'),
 ('cb000000-0000-4000-8000-000000000003','c9300000-0000-4000-8000-000000000001',2,'discuss'),
 ('cb000000-0000-4000-8000-000000000004','c9300000-0000-4000-8000-000000000001',3,'reflect'),
 ('cb000000-0000-4000-8000-000000000005','c9300000-0000-4000-8000-000000000001',4,'apply'),
 ('cb000000-0000-4000-8000-000000000006','c9300000-0000-4000-8000-000000000001',5,'pray');

-- Complete shape with an unpublished Library dependency.
insert into public.v7_tracks(id,congregation_id,title,locale,revision_id,publication_state,created_by)
values ('d9000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','P3 invalid-library track','en','d9010000-0000-4000-8000-000000000001','draft','11111111-1111-4111-8111-111111111111');
insert into public.v7_modules(id,track_id,title,revision_id,display_order,publication_state)
values ('d9100000-0000-4000-8000-000000000001','d9000000-0000-4000-8000-000000000001','P3 invalid-library module','d9110000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lessons(id,module_id,title,revision_id,display_order,publication_state)
values ('d9200000-0000-4000-8000-000000000001','d9100000-0000-4000-8000-000000000001','P3 invalid-library lesson','d9210000-0000-4000-8000-000000000001',0,'draft');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,created_by)
values ('d9300000-0000-4000-8000-000000000001','d9200000-0000-4000-8000-000000000001',1,'en','11111111-1111-4111-8111-111111111111');
insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type,library_revision_id) values
 ('da000000-0000-4000-8000-000000000001','d9300000-0000-4000-8000-000000000001',0,'scripture','c7100000-0000-4000-8000-000000000001'),
 ('da000000-0000-4000-8000-000000000002','d9300000-0000-4000-8000-000000000001',1,'understand',null),
 ('da000000-0000-4000-8000-000000000003','d9300000-0000-4000-8000-000000000001',2,'discuss',null),
 ('da000000-0000-4000-8000-000000000004','d9300000-0000-4000-8000-000000000001',3,'reflect',null),
 ('da000000-0000-4000-8000-000000000005','d9300000-0000-4000-8000-000000000001',4,'apply',null),
 ('da000000-0000-4000-8000-000000000006','d9300000-0000-4000-8000-000000000001',5,'pray',null),
 ('da000000-0000-4000-8000-000000000007','d9300000-0000-4000-8000-000000000001',6,'action',null);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

do $attempt$
begin
  begin
    update public.v7_tracks set publication_state='published'
    where id='b9000000-0000-4000-8000-000000000001';
  exception when others then
    null;
  end;
end;
$attempt$;
select is((select publication_state from public.v7_tracks where id='b9000000-0000-4000-8000-000000000001'),'draft','Direct authenticated hierarchy publication cannot change state');

do $attempt$
begin
  begin
    update public.v7_lesson_revisions set published_at=now()
    where id='b9300000-0000-4000-8000-000000000001';
  exception when others then
    null;
  end;
end;
$attempt$;
select ok((select published_at is null from public.v7_lesson_revisions where id='b9300000-0000-4000-8000-000000000001'),'Direct authenticated lesson-revision publication cannot stamp publication');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('10000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','b9010000-0000-4000-8000-000000000001','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001',array['b7100000-0000-4000-8000-000000000001']::uuid[])$sql$),'42501','Ordinary member cannot publish curriculum');

set local "request.jwt.claim.sub"='99999999-9999-4999-8999-999999999999';
select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('20000000-0000-4000-8000-000000000002','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','b9010000-0000-4000-8000-000000000001','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001',array['b7100000-0000-4000-8000-000000000001']::uuid[])$sql$),'42501','Even platform authority cannot bind a congregation-A track to congregation B');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('10000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','ffffffff-ffff-4fff-8fff-ffffffffffff','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001',array['b7100000-0000-4000-8000-000000000001']::uuid[])$sql$),'40001','Stale optimistic hierarchy identity is rejected');
select is((select t.publication_state||'/'||m.publication_state||'/'||l.publication_state from public.v7_tracks t join public.v7_modules m on m.track_id=t.id join public.v7_lessons l on l.module_id=m.id where t.id='b9000000-0000-4000-8000-000000000001'),'draft/draft/draft','Stale rejection leaves the complete hierarchy unchanged');

select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('10000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','b9010000-0000-4000-8000-000000000001','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001','{}'::uuid[])$sql$),'40001','Stale Library-reference handoff is rejected');
select is((select publication_state from public.v7_tracks where id='b9000000-0000-4000-8000-000000000001'),'draft','Library-reference rejection does not partially publish the track');

select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('10000000-0000-4000-8000-000000000001','c9000000-0000-4000-8000-000000000001','c9100000-0000-4000-8000-000000000001','c9200000-0000-4000-8000-000000000001','c9300000-0000-4000-8000-000000000001','c9010000-0000-4000-8000-000000000001','c9110000-0000-4000-8000-000000000001','c9210000-0000-4000-8000-000000000001','{}'::uuid[])$sql$),'22023','Server rejects an incomplete six-step lesson even when the client calls the RPC directly');
select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('10000000-0000-4000-8000-000000000001','d9000000-0000-4000-8000-000000000001','d9100000-0000-4000-8000-000000000001','d9200000-0000-4000-8000-000000000001','d9300000-0000-4000-8000-000000000001','d9010000-0000-4000-8000-000000000001','d9110000-0000-4000-8000-000000000001','d9210000-0000-4000-8000-000000000001',array['c7100000-0000-4000-8000-000000000001']::uuid[])$sql$),'22023','Server rejects a curriculum path that references unpublished Library content');

select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('10000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','b9010000-0000-4000-8000-000000000001','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001',array['b7100000-0000-4000-8000-000000000001']::uuid[])$sql$),'00000','Authorized exact-current path publishes atomically');
select is((select t.publication_state||'/'||m.publication_state||'/'||l.publication_state from public.v7_tracks t join public.v7_modules m on m.track_id=t.id join public.v7_lessons l on l.module_id=m.id where t.id='b9000000-0000-4000-8000-000000000001'),'published/published/published','Successful publication exposes one committed published hierarchy');
select ok((select published_at is not null from public.v7_lesson_revisions where id='b9300000-0000-4000-8000-000000000001'),'Successful publication stamps the immutable lesson revision');
select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_publish_curriculum_path('10000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','b9010000-0000-4000-8000-000000000001','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001',array['b7100000-0000-4000-8000-000000000001']::uuid[])$sql$),'00000','Exact publication retry is idempotent');

do $attempt$
begin
  begin
    update public.v7_lessons set publication_state='withdrawn'
    where id='b9200000-0000-4000-8000-000000000001';
  exception when others then
    null;
  end;
end;
$attempt$;
select is((select publication_state from public.v7_lessons where id='b9200000-0000-4000-8000-000000000001'),'published','Authenticated client cannot bypass withdrawal authority with a direct state update');

do $attempt$
begin
  begin
    update public.v7_lesson_steps
      set content='{"tampered":true}'::jsonb
      where id='ba000000-0000-4000-8000-000000000004';
  exception when others then
    null;
  end;
end;
$attempt$;
reset role;
select is((select content from public.v7_lesson_steps where id='ba000000-0000-4000-8000-000000000004'),'{}'::jsonb,'Published lesson steps remain immutable after server publication');

reset role;
create temporary table v7_publication_stamp as
select published_at from public.v7_lesson_revisions where id='b9300000-0000-4000-8000-000000000001';
insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state,mentor_accepted_at,mentee_accepted_at)
values ('b8000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','active',now(),now());
insert into public.v7_pair_assignments(id,pair_id,lesson_revision_id,assigned_by,status)
values ('b9500000-0000-4000-8000-000000000001','b8000000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','assigned');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_withdraw_curriculum_lesson('10000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','b9010000-0000-4000-8000-000000000001','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001')$sql$),'00000','Authorized withdrawal succeeds through the canonical boundary');
select is((select publication_state from public.v7_lessons where id='b9200000-0000-4000-8000-000000000001'),'withdrawn','Withdrawal changes only the selected lesson visibility state');
select is((select t.publication_state||'/'||m.publication_state from public.v7_tracks t join public.v7_modules m on m.track_id=t.id where t.id='b9000000-0000-4000-8000-000000000001'),'published/published','Lesson-level withdrawal preserves the published parent hierarchy for siblings');
select is((select published_at from public.v7_lesson_revisions where id='b9300000-0000-4000-8000-000000000001'),(select published_at from v7_publication_stamp),'Withdrawal never rewrites the immutable publication timestamp');
select is((select count(*)::integer from public.v7_pair_assignments where id='b9500000-0000-4000-8000-000000000001'),1,'Withdrawal preserves historical assignment references');
select is(pg_temp.v7_publication_sqlstate($sql$select * from public.bible_v7_withdraw_curriculum_lesson('10000000-0000-4000-8000-000000000001','b9000000-0000-4000-8000-000000000001','b9100000-0000-4000-8000-000000000001','b9200000-0000-4000-8000-000000000001','b9300000-0000-4000-8000-000000000001','b9010000-0000-4000-8000-000000000001','b9110000-0000-4000-8000-000000000001','b9210000-0000-4000-8000-000000000001')$sql$),'00000','Exact lesson-withdrawal retry is idempotent');

reset role;
select * from finish();
rollback;