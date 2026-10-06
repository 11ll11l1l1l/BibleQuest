begin;
create extension if not exists pgtap with schema extensions;
select plan(23);

create function pg_temp.v7_library_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

select ok((select relrowsecurity from pg_class where oid='public.v7_library_items'::regclass),'V7 Library items keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_library_revisions'::regclass),'V7 Library revisions keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_library_translations'::regclass),'V7 Library translations keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_library_taxonomy'::regclass),'V7 Library taxonomy keeps RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_library_revision_taxonomy'::regclass),'V7 Library revision taxonomy keeps RLS enabled');

insert into public.v7_library_items(id,content_type,congregation_id,publication_state,current_revision_id,created_by) values
 ('b7000000-0000-4000-8000-000000000001','book',null,'published','b7100000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111'),
 ('b7000000-0000-4000-8000-000000000002','devotional','10000000-0000-4000-8000-000000000001','published','b7100000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111'),
 ('b7000000-0000-4000-8000-000000000003','past_teaching','20000000-0000-4000-8000-000000000002','published','b7100000-0000-4000-8000-000000000003','22222222-2222-4222-8222-222222222221'),
 ('b7000000-0000-4000-8000-000000000004','book','10000000-0000-4000-8000-000000000001','draft',null,'11111111-1111-4111-8111-111111111111'),
 ('b7000000-0000-4000-8000-000000000005','book','20000000-0000-4000-8000-000000000002','draft',null,'22222222-2222-4222-8222-222222222221');

insert into public.v7_library_revisions(id,item_id,revision_number,source_locale,title,source_kind,source_title,source_catalog_id,rights_status,rights_holder,rights_basis,attribution,allowed_uses,publication_state,review_status,reviewer_id,reviewed_at,created_by) values
 ('b7100000-0000-4000-8000-000000000001','b7000000-0000-4000-8000-000000000001',1,'en','Global Library item','licensed','Global source','catalog:global','verified','Rights Holder','written permission','','["display"]','published','approved','11111111-1111-4111-8111-111111111111',now(),'11111111-1111-4111-8111-111111111111'),
 ('b7100000-0000-4000-8000-000000000002','b7000000-0000-4000-8000-000000000002',1,'en','Congregation A Library item','first_party','BibleQuest A','catalog:a3-a','verified','BibleQuest','original work','','["display"]','published','approved','11111111-1111-4111-8111-111111111111',now(),'11111111-1111-4111-8111-111111111111'),
 ('b7100000-0000-4000-8000-000000000003','b7000000-0000-4000-8000-000000000003',1,'en','Congregation B Library item','first_party','BibleQuest B','catalog:a3-b','verified','BibleQuest','original work','','["display"]','published','approved','22222222-2222-4222-8222-222222222221',now(),'22222222-2222-4222-8222-222222222221');

insert into public.v7_library_translations(id,revision_id,locale,title,translated_from_revision_id,translator,review_status,reviewer_id,reviewed_at) values
 ('b7200000-0000-4000-8000-000000000001','b7100000-0000-4000-8000-000000000001','ja','Global translation','b7100000-0000-4000-8000-000000000001','Fixture','reviewed','11111111-1111-4111-8111-111111111111',now()),
 ('b7200000-0000-4000-8000-000000000002','b7100000-0000-4000-8000-000000000002','ja','A translation','b7100000-0000-4000-8000-000000000002','Fixture','reviewed','11111111-1111-4111-8111-111111111111',now()),
 ('b7200000-0000-4000-8000-000000000003','b7100000-0000-4000-8000-000000000003','ja','B translation','b7100000-0000-4000-8000-000000000003','Fixture','reviewed','22222222-2222-4222-8222-222222222221',now());

insert into public.v7_library_taxonomy(id,kind,labels,congregation_id,created_by) values
 ('a3.global','topic','{"en":"Global"}',null,'11111111-1111-4111-8111-111111111111'),
 ('a3.congregation-a','topic','{"en":"A"}','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111'),
 ('a3.congregation-b','topic','{"en":"B"}','20000000-0000-4000-8000-000000000002','22222222-2222-4222-8222-222222222221');

insert into public.v7_library_revision_taxonomy(revision_id,taxonomy_id,display_order) values
 ('b7100000-0000-4000-8000-000000000001','a3.global',0),
 ('b7100000-0000-4000-8000-000000000002','a3.congregation-a',0),
 ('b7100000-0000-4000-8000-000000000003','a3.congregation-b',0);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq($$select count(*)::bigint from public.v7_library_items where publication_state='published'$$,array[2::bigint],'Member A sees global and congregation A published Library items before switch');
select results_eq($$select count(*)::bigint from public.v7_library_items where congregation_id='20000000-0000-4000-8000-000000000002'$$,array[0::bigint],'Member A cannot force a congregation B Library item through a client filter');
select results_eq($$select count(*)::bigint from public.v7_library_revisions$$,array[2::bigint],'Member A sees only global and congregation A current revisions before switch');
select results_eq($$select count(*)::bigint from public.v7_library_translations$$,array[2::bigint],'Member A sees only global and congregation A reviewed translations before switch');
select results_eq($$select count(*)::bigint from public.v7_library_taxonomy$$,array[2::bigint],'Member A sees only global and congregation A taxonomy before switch');
select results_eq($$select count(*)::bigint from public.v7_library_revision_taxonomy$$,array[2::bigint],'Member A sees only global and congregation A revision taxonomy before switch');

reset role;
update public.bible_congregation_members
set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111112';

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq($$select count(*)::bigint from public.v7_library_items where publication_state='published'$$,array[1::bigint],'Switched member loses stale congregation A Library rows but keeps global published content');
select results_eq($$select count(*)::bigint from public.v7_library_items where congregation_id='10000000-0000-4000-8000-000000000001'$$,array[0::bigint],'Switched member cannot force stale congregation A Library item through a client filter');
select results_eq($$select count(*)::bigint from public.v7_library_revisions$$,array[1::bigint],'Switched member loses stale congregation A Library revision');
select results_eq($$select count(*)::bigint from public.v7_library_translations$$,array[1::bigint],'Switched member loses stale congregation A Library translation');
select results_eq($$select count(*)::bigint from public.v7_library_taxonomy$$,array[1::bigint],'Switched member loses stale congregation A taxonomy');
select results_eq($$select count(*)::bigint from public.v7_library_revision_taxonomy$$,array[1::bigint],'Switched member loses stale congregation A revision taxonomy');

reset role;
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq($$select count(*)::bigint from public.v7_library_items where id='b7000000-0000-4000-8000-000000000004'$$,array[1::bigint],'Leader A can review congregation A draft before membership revocation');
select results_eq($$with changed as (update public.v7_library_items set publication_state='pending_review' where id='b7000000-0000-4000-8000-000000000004' returning id) select count(*)::bigint from changed$$,array[1::bigint],'Leader A can update congregation A draft before membership revocation');
select results_eq($$with changed as (update public.v7_library_items set publication_state='pending_review' where id='b7000000-0000-4000-8000-000000000005' returning id) select count(*)::bigint from changed$$,array[0::bigint],'Leader A cannot update congregation B draft');

reset role;
update public.bible_congregation_members
set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111111';

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq($$select count(*)::bigint from public.v7_library_items where id='b7000000-0000-4000-8000-000000000004'$$,array[0::bigint],'Switched leader cannot read stale congregation A draft');
select results_eq($$with changed as (update public.v7_library_items set publication_state='draft' where id='b7000000-0000-4000-8000-000000000004' returning id) select count(*)::bigint from changed$$,array[0::bigint],'Switched leader cannot update stale congregation A draft');
select isnt(pg_temp.v7_library_sqlstate($sql$insert into public.v7_library_items(id,content_type,congregation_id,publication_state,created_by) values ('b7000000-0000-4000-8000-000000000006','devotional','10000000-0000-4000-8000-000000000001','draft','11111111-1111-4111-8111-111111111111')$sql$),'00000','Switched leader cannot create new congregation A Library content');

reset role;
select * from finish();
rollback;
