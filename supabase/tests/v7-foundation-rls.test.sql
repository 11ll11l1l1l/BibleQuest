begin;
create extension if not exists pgtap with schema extensions;
select plan(30);

select ok((select relrowsecurity from pg_class where oid='public.v7_library_items'::regclass),'V7 Library items enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.v7_lesson_responses'::regclass),'V7 private responses enable RLS');
select ok((select relrowsecurity from pg_class where oid='public.v7_mentor_pairs'::regclass),'V7 mentor pairs enable RLS');
select ok(not has_table_privilege('anon','public.v7_library_items','SELECT'),'anonymous role cannot read V7 Library rows');
select ok(not has_table_privilege('anon','public.v7_lesson_responses','SELECT'),'anonymous role cannot read lesson responses');
select ok(not has_table_privilege('anon','public.v7_mentor_pairs','SELECT'),'anonymous role cannot read pair records');
select ok(not has_function_privilege('anon','private.v7_pair_has_user(uuid,uuid,boolean)','EXECUTE'),'anonymous role cannot run pair-scope helper');

insert into public.v7_library_items(id,content_type,congregation_id,publication_state,current_revision_id,created_by)
values
 ('70000000-0000-4000-8000-000000000001','book',null,'published','71000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111'),
 ('70000000-0000-4000-8000-000000000002','devotional','10000000-0000-4000-8000-000000000001','published','71000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111'),
 ('70000000-0000-4000-8000-000000000003','past_teaching','20000000-0000-4000-8000-000000000002','published','71000000-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222221'),
 ('70000000-0000-4000-8000-000000000004','book','10000000-0000-4000-8000-000000000001','draft',null,'11111111-1111-4111-8111-111111111111');
insert into public.v7_library_revisions(id,item_id,revision_number,source_locale,title,source_kind,source_title,source_catalog_id,rights_status,rights_holder,rights_basis,attribution,allowed_uses,publication_state,review_status,reviewer_id,reviewed_at,created_by)
values
 ('71000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001',1,'en','Shared book','licensed','Source title','catalog:shared','verified','Rights Holder','written permission','','["display"]','published','approved','11111111-1111-4111-8111-111111111111',now(),'11111111-1111-4111-8111-111111111111'),
 ('71000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000002',1,'en','Congregation A devotional','first_party','BibleQuest','catalog:a','verified','BibleQuest','original work','','["display"]','published','approved','11111111-1111-4111-8111-111111111111',now(),'11111111-1111-4111-8111-111111111111'),
 ('71000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000003',1,'en','Congregation B teaching','licensed','Source title','catalog:b','verified','Rights Holder','written permission','','["display"]','published','approved','22222222-2222-4222-8222-222222222221',now(),'22222222-2222-4222-8222-222222222221');
insert into public.v7_mentor_pairs(id,congregation_id,mentor_id,mentee_id,initiated_by,state,mentor_accepted_at,mentee_accepted_at)
values ('80000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112','11111111-1111-4111-8111-111111111111','active',now(),now());
insert into public.v7_tracks(id,congregation_id,title,locale,publication_state,created_by)
values ('90000000-0000-4000-8000-000000000001',null,'Starter','en','published','11111111-1111-4111-8111-111111111111');
insert into public.v7_modules(id,track_id,title,display_order,publication_state)
values ('91000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000001','Module one',0,'published');
insert into public.v7_lessons(id,module_id,title,display_order,publication_state)
values ('92000000-0000-4000-8000-000000000001','91000000-0000-4000-8000-000000000001','Lesson one',0,'published');
insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,published_at,created_by)
values ('93000000-0000-4000-8000-000000000001','92000000-0000-4000-8000-000000000001',1,'en',null,'11111111-1111-4111-8111-111111111111');
insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type,content)
values
 ('94000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001',0,'scripture','{"prompt":"Read"}'),
 ('94000000-0000-4000-8000-000000000002','93000000-0000-4000-8000-000000000001',1,'understand','{}'),
 ('94000000-0000-4000-8000-000000000003','93000000-0000-4000-8000-000000000001',2,'discuss','{}'),
 ('94000000-0000-4000-8000-000000000004','93000000-0000-4000-8000-000000000001',3,'reflect','{}'),
 ('94000000-0000-4000-8000-000000000005','93000000-0000-4000-8000-000000000001',4,'apply','{}'),
 ('94000000-0000-4000-8000-000000000006','93000000-0000-4000-8000-000000000001',5,'pray','{}'),
 ('94000000-0000-4000-8000-000000000007','93000000-0000-4000-8000-000000000001',6,'action','{}');
update public.v7_lesson_revisions set published_at=now() where id='93000000-0000-4000-8000-000000000001';
insert into public.v7_pair_assignments(id,pair_id,lesson_revision_id,assigned_by,status)
values ('95000000-0000-4000-8000-000000000001','80000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','assigned');
insert into public.v7_learner_progress(id,assignment_id,lesson_revision_id,learner_id,current_step_id,status,started_at)
values ('96000000-0000-4000-8000-000000000001','95000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','94000000-0000-4000-8000-000000000003','in_progress',now());
insert into public.v7_lesson_responses(id,assignment_id,lesson_revision_id,lesson_step_id,learner_id,response)
values
 ('97000000-0000-4000-8000-000000000001','95000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111112','{"text":"private reflection"}'),
 ('97000000-0000-4000-8000-000000000002','95000000-0000-4000-8000-000000000001','93000000-0000-4000-8000-000000000001','94000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111112','{"text":"shared prayer"}');
insert into public.v7_response_shares(id,response_id,recipient_id,share_state)
values ('98000000-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','shared');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq('select count(*)::bigint from public.v7_library_items where publication_state=''draft''',array[1::bigint],'Scoped content editor can review a draft item');
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq($$select count(*)::bigint from public.v7_library_items$$,array[2::bigint],'Mentee sees global and own-congregation published Library items only');
select results_eq('select count(*)::bigint from public.v7_library_items where publication_state=''draft''',array[0::bigint],'Unpublished Library item stays hidden');
select results_eq($$select count(*)::bigint from public.v7_library_revisions$$,array[2::bigint],'Mentee sees only current published revisions within scope');
select results_eq($$select count(*)::bigint from public.v7_tracks$$,array[1::bigint],'Published global track is visible');
select results_eq($$select count(*)::bigint from public.v7_lesson_steps$$,array[7::bigint],'Published lesson returns the canonical seven steps');
select results_eq($$select count(*)::bigint from public.v7_mentor_pairs$$,array[1::bigint],'Mentee can read own pair');
select results_eq($$select count(*)::bigint from public.v7_pair_assignments$$,array[1::bigint],'Mentee can read pair assignment');
select results_eq($$select count(*)::bigint from public.v7_learner_progress$$,array[1::bigint],'Mentee can read operational progress');
select results_eq($$select count(*)::bigint from public.v7_lesson_responses$$,array[2::bigint],'Learner can read own private and shared responses');
select results_eq('select count(*)::bigint from public.v7_response_shares',array[1::bigint],'Learner can read share metadata for an owned response');

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq($$select count(*)::bigint from public.v7_mentor_pairs$$,array[1::bigint],'Mentor can read own pair');
select results_eq($$select count(*)::bigint from public.v7_learner_progress$$,array[1::bigint],'Active mentor can see operational progress');
select results_eq($$select count(*)::bigint from public.v7_lesson_responses$$,array[1::bigint],'Mentor sees only the response explicitly shared with them');
select is((select count(*)::integer from public.v7_lesson_responses where response->>'text'='private reflection'),0,'Mentor cannot read private reflection text');
select results_eq('select count(*)::bigint from public.v7_response_shares',array[1::bigint],'Named recipient can read the explicit share record');

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';
select results_eq($select count(*)::bigint from public.v7_library_items$,array[2::bigint],'Other-congregation member sees global and own-congregation content only');
select results_eq($select count(*)::bigint from public.v7_library_revisions$,array[2::bigint],'Other-congregation member cannot force cross-tenant revision reads');
select results_eq($$select count(*)::bigint from public.v7_mentor_pairs$$,array[0::bigint],'Outsider cannot read the pair');
select results_eq($$select count(*)::bigint from public.v7_pair_assignments$$,array[0::bigint],'Outsider cannot read pair assignments');
select results_eq($$select count(*)::bigint from public.v7_learner_progress$$,array[0::bigint],'Outsider cannot read operational progress');
select results_eq($$select count(*)::bigint from public.v7_lesson_responses$$,array[0::bigint],'Outsider cannot read private or pair-shared responses');
select results_eq('select count(*)::bigint from public.v7_response_shares',array[0::bigint],'Outsider cannot read response share records');

reset role;
select * from finish();
rollback;
