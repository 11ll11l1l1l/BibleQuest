begin;
create extension if not exists pgtap with schema extensions;
select plan(26);

create function pg_temp.v7_curriculum_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

select ok((select relrowsecurity from pg_class where oid='public.v7_tracks'::regclass),'V7 tracks keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_modules'::regclass),'V7 modules keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_lessons'::regclass),'V7 lessons keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_lesson_revisions'::regclass),'V7 lesson revisions keep RLS enabled');
select ok((select relrowsecurity from pg_class where oid='public.v7_lesson_steps'::regclass),'V7 lesson steps keep RLS enabled');

-- Deterministic identities: both users begin only in congregation A, and
-- Leader A is deliberately not a site-wide owner/admin.
insert into public.bible_app_access(user_id,role,active)
values('11111111-1111-4111-8111-111111111111','member',true)
on conflict(user_id) do update set role='member',active=true;
update public.bible_congregation_members set active=false
where user_id in ('11111111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111112');
update public.bible_congregation_members set role='leader',active=true
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111111';
update public.bible_congregation_members set role='member',active=true
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111112';

insert into public.v7_tracks(id,congregation_id,title,locale,publication_state,display_order,created_by) values
 ('c7000000-0000-4000-8000-000000000001',null,'Global A3 track','en','published',0,'11111111-1111-4111-8111-111111111111'),
 ('c7000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','Congregation A A3 track','en','published',0,'11111111-1111-4111-8111-111111111111'),
 ('c7000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000002','Congregation B A3 track','en','published',0,'22222222-2222-4222-8222-222222222221'),
 ('c7000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','Congregation A draft track','en','draft',1,'11111111-1111-4111-8111-111111111111'),
 ('c7000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','Congregation B draft track','en','draft',1,'22222222-2222-4222-8222-222222222221');

insert into public.v7_modules(id,track_id,title,display_order,publication_state) values
 ('c7100000-0000-4000-8000-000000000001','c7000000-0000-4000-8000-000000000001','Global A3 module',0,'published'),
 ('c7100000-0000-4000-8000-000000000002','c7000000-0000-4000-8000-000000000002','Congregation A A3 module',0,'published'),
 ('c7100000-0000-4000-8000-000000000003','c7000000-0000-4000-8000-000000000003','Congregation B A3 module',0,'published');

insert into public.v7_lessons(id,module_id,title,display_order,publication_state) values
 ('c7200000-0000-4000-8000-000000000001','c7100000-0000-4000-8000-000000000001','Global A3 lesson',0,'published'),
 ('c7200000-0000-4000-8000-000000000002','c7100000-0000-4000-8000-000000000002','Congregation A A3 lesson',0,'published'),
 ('c7200000-0000-4000-8000-000000000003','c7100000-0000-4000-8000-000000000003','Congregation B A3 lesson',0,'published');

insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,summary,created_by) values
 ('c7300000-0000-4000-8000-000000000001','c7200000-0000-4000-8000-000000000001',1,'en','Global revision','11111111-1111-4111-8111-111111111111'),
 ('c7300000-0000-4000-8000-000000000002','c7200000-0000-4000-8000-000000000002',1,'en','A revision','11111111-1111-4111-8111-111111111111'),
 ('c7300000-0000-4000-8000-000000000003','c7200000-0000-4000-8000-000000000003',1,'en','B revision','22222222-2222-4222-8222-222222222221');

insert into public.v7_lesson_steps(id,lesson_revision_id,position,step_type,content) values
 ('c7400000-0000-4000-8000-000000000001','c7300000-0000-4000-8000-000000000001',0,'scripture','{}'),
 ('c7400000-0000-4000-8000-000000000002','c7300000-0000-4000-8000-000000000001',1,'understand','{}'),
 ('c7400000-0000-4000-8000-000000000003','c7300000-0000-4000-8000-000000000001',2,'discuss','{}'),
 ('c7400000-0000-4000-8000-000000000004','c7300000-0000-4000-8000-000000000001',3,'reflect','{}'),
 ('c7400000-0000-4000-8000-000000000005','c7300000-0000-4000-8000-000000000001',4,'apply','{}'),
 ('c7400000-0000-4000-8000-000000000006','c7300000-0000-4000-8000-000000000001',5,'pray','{}'),
 ('c7400000-0000-4000-8000-000000000007','c7300000-0000-4000-8000-000000000001',6,'action','{}'),
 ('c7400000-0000-4000-8000-000000000008','c7300000-0000-4000-8000-000000000002',0,'scripture','{}'),
 ('c7400000-0000-4000-8000-000000000009','c7300000-0000-4000-8000-000000000002',1,'understand','{}'),
 ('c7400000-0000-4000-8000-000000000010','c7300000-0000-4000-8000-000000000002',2,'discuss','{}'),
 ('c7400000-0000-4000-8000-000000000011','c7300000-0000-4000-8000-000000000002',3,'reflect','{}'),
 ('c7400000-0000-4000-8000-000000000012','c7300000-0000-4000-8000-000000000002',4,'apply','{}'),
 ('c7400000-0000-4000-8000-000000000013','c7300000-0000-4000-8000-000000000002',5,'pray','{}'),
 ('c7400000-0000-4000-8000-000000000014','c7300000-0000-4000-8000-000000000002',6,'action','{}'),
 ('c7400000-0000-4000-8000-000000000015','c7300000-0000-4000-8000-000000000003',0,'scripture','{}'),
 ('c7400000-0000-4000-8000-000000000016','c7300000-0000-4000-8000-000000000003',1,'understand','{}'),
 ('c7400000-0000-4000-8000-000000000017','c7300000-0000-4000-8000-000000000003',2,'discuss','{}'),
 ('c7400000-0000-4000-8000-000000000018','c7300000-0000-4000-8000-000000000003',3,'reflect','{}'),
 ('c7400000-0000-4000-8000-000000000019','c7300000-0000-4000-8000-000000000003',4,'apply','{}'),
 ('c7400000-0000-4000-8000-000000000020','c7300000-0000-4000-8000-000000000003',5,'pray','{}'),
 ('c7400000-0000-4000-8000-000000000021','c7300000-0000-4000-8000-000000000003',6,'action','{}');
update public.v7_lesson_revisions set published_at=now()
where id in ('c7300000-0000-4000-8000-000000000001','c7300000-0000-4000-8000-000000000002','c7300000-0000-4000-8000-000000000003');

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq($$select count(*)::bigint from public.v7_tracks where publication_state='published'$$,array[2::bigint],'Member A sees global and congregation A published curriculum before switch');
select results_eq($$select count(*)::bigint from public.v7_tracks where congregation_id='20000000-0000-4000-8000-000000000002'$$,array[0::bigint],'Member A cannot force a congregation B track through a client filter');
select results_eq($$select count(*)::bigint from public.v7_modules$$,array[2::bigint],'Member A sees only global and congregation A modules before switch');
select results_eq($$select count(*)::bigint from public.v7_lessons$$,array[2::bigint],'Member A sees only global and congregation A lessons before switch');
select results_eq($$select count(*)::bigint from public.v7_lesson_revisions$$,array[2::bigint],'Member A sees only global and congregation A lesson revisions before switch');
select results_eq($$select count(*)::bigint from public.v7_lesson_steps$$,array[14::bigint],'Member A sees only global and congregation A lesson steps before switch');

reset role;
update public.bible_congregation_members set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111112';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values('20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111112','member','Switched Curriculum Member',true)
on conflict(congregation_id,user_id) do update set role='member',display_name='Switched Curriculum Member',active=true;

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';
select results_eq($$select count(*)::bigint from public.v7_tracks where publication_state='published'$$,array[2::bigint],'Switched member sees global plus congregation B published curriculum');
select results_eq($$select count(*)::bigint from public.v7_tracks where congregation_id='10000000-0000-4000-8000-000000000001'$$,array[0::bigint],'Switched member cannot force stale congregation A track through a client filter');
select results_eq($$select count(*)::bigint from public.v7_tracks where congregation_id='20000000-0000-4000-8000-000000000002' and publication_state='published'$$,array[1::bigint],'Switched member immediately sees congregation B published track');
select results_eq($$select count(*)::bigint from public.v7_modules$$,array[2::bigint],'Switched member sees only global and congregation B modules');
select results_eq($$select count(*)::bigint from public.v7_lessons$$,array[2::bigint],'Switched member sees only global and congregation B lessons');
select results_eq($$select count(*)::bigint from public.v7_lesson_revisions$$,array[2::bigint],'Switched member sees only global and congregation B lesson revisions');
select results_eq($$select count(*)::bigint from public.v7_lesson_steps$$,array[14::bigint],'Switched member sees only global and congregation B lesson steps');

reset role;
set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq($$select count(*)::bigint from public.v7_tracks where id='c7000000-0000-4000-8000-000000000004'$$,array[1::bigint],'Leader A can review congregation A draft track before membership revocation');
select results_eq($$with changed as (update public.v7_tracks set title='Congregation A edited draft track' where id='c7000000-0000-4000-8000-000000000004' returning id) select count(*)::bigint from changed$$,array[1::bigint],'Leader A can update congregation A draft track before membership revocation');
select results_eq($$with changed as (update public.v7_tracks set title='Forbidden B edit' where id='c7000000-0000-4000-8000-000000000005' returning id) select count(*)::bigint from changed$$,array[0::bigint],'Leader A cannot update congregation B draft track');

reset role;
update public.bible_congregation_members set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111111';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values('20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','member','Switched Former Curriculum Leader',true)
on conflict(congregation_id,user_id) do update set role='member',display_name='Switched Former Curriculum Leader',active=true;

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select results_eq($$select count(*)::bigint from public.v7_tracks where id='c7000000-0000-4000-8000-000000000003'$$,array[1::bigint],'Switched former leader can read congregation B published track as a member');
select results_eq($$select count(*)::bigint from public.v7_tracks where id='c7000000-0000-4000-8000-000000000005'$$,array[0::bigint],'Switched former leader cannot review congregation B draft track after role downgrade');
select results_eq($$select count(*)::bigint from public.v7_tracks where id='c7000000-0000-4000-8000-000000000004'$$,array[0::bigint],'Switched leader cannot read stale congregation A draft track');
select results_eq($$with changed as (update public.v7_tracks set title='Forbidden stale edit' where id='c7000000-0000-4000-8000-000000000004' returning id) select count(*)::bigint from changed$$,array[0::bigint],'Switched leader cannot update stale congregation A draft track');
select isnt(pg_temp.v7_curriculum_sqlstate($sql$insert into public.v7_tracks(id,congregation_id,title,locale,publication_state,created_by) values ('c7000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000001','Forbidden stale A track','en','draft','11111111-1111-4111-8111-111111111111')$sql$),'00000','Switched leader cannot create new congregation A curriculum');

reset role;
select * from finish();
rollback;
