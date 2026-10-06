begin;
create extension if not exists pgtap with schema extensions;
select plan(25);

create function pg_temp.v7_rpc_sqlstate(statement text)
returns text language plpgsql security invoker as $bq$
begin
  execute statement;
  return '00000';
exception when others then
  return sqlstate;
end;
$bq$;

create function pg_temp.v7_create_curriculum_path(
  p_congregation_id uuid,
  p_track_id uuid,
  p_track_revision_id uuid,
  p_module_id uuid,
  p_module_revision_id uuid,
  p_lesson_id uuid,
  p_lesson_revision_identity uuid,
  p_revision_id uuid,
  p_created_by uuid,
  p_title text
)
returns void language plpgsql security invoker as $bq$
begin
  insert into public.v7_tracks(
    id,congregation_id,title,locale,revision_id,publication_state,display_order,created_by
  ) values (
    p_track_id,p_congregation_id,p_title || ' track','en',p_track_revision_id,'draft',0,p_created_by
  );
  insert into public.v7_modules(id,track_id,title,revision_id,display_order,publication_state)
  values (p_module_id,p_track_id,p_title || ' module',p_module_revision_id,0,'draft');
  insert into public.v7_lessons(id,module_id,title,revision_id,display_order,publication_state)
  values (p_lesson_id,p_module_id,p_title || ' lesson',p_lesson_revision_identity,0,'draft');
  insert into public.v7_lesson_revisions(id,lesson_id,revision_number,locale,summary,created_by)
  values (p_revision_id,p_lesson_id,1,'en',p_title || ' revision',p_created_by);
  insert into public.v7_lesson_steps(lesson_revision_id,position,step_type,content)
  select p_revision_id,
         position::smallint,
         case position
           when 0 then 'scripture'
           when 1 then 'understand'
           when 2 then 'discuss'
           when 3 then 'reflect'
           when 4 then 'apply'
           when 5 then 'pray'
           when 6 then 'action'
         end,
         '{}'::jsonb
  from generate_series(0,6) as positions(position);
end;
$bq$;

-- Make the actor deterministic: no site-wide owner/admin escape hatch, and only
-- an active leader membership in congregation A at the start of the test.
insert into public.bible_app_access(user_id,role,active)
values('11111111-1111-4111-8111-111111111111','member',true)
on conflict(user_id) do update set role='member',active=true;

update public.bible_congregation_members
set active=false
where user_id='11111111-1111-4111-8111-111111111111';

insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values(
  '10000000-0000-4000-8000-000000000001',
  '11111111-1111-4111-8111-111111111111',
  'leader','A3 RPC Leader',true
)
on conflict(congregation_id,user_id) do update
set role='leader',display_name='A3 RPC Leader',active=true;

select pg_temp.v7_create_curriculum_path(
  '10000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000001','e1010000-0000-4000-8000-000000000001',
  'e1100000-0000-4000-8000-000000000001','e1110000-0000-4000-8000-000000000001',
  'e1200000-0000-4000-8000-000000000001','e1210000-0000-4000-8000-000000000001',
  'e1300000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111',
  'A3 publish-then-withdraw'
);
select pg_temp.v7_create_curriculum_path(
  '10000000-0000-4000-8000-000000000001',
  'e1000000-0000-4000-8000-000000000002','e1010000-0000-4000-8000-000000000002',
  'e1100000-0000-4000-8000-000000000002','e1110000-0000-4000-8000-000000000002',
  'e1200000-0000-4000-8000-000000000002','e1210000-0000-4000-8000-000000000002',
  'e1300000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111',
  'A3 stale A publish'
);
select pg_temp.v7_create_curriculum_path(
  '20000000-0000-4000-8000-000000000002',
  'e1000000-0000-4000-8000-000000000003','e1010000-0000-4000-8000-000000000003',
  'e1100000-0000-4000-8000-000000000003','e1110000-0000-4000-8000-000000000003',
  'e1200000-0000-4000-8000-000000000003','e1210000-0000-4000-8000-000000000003',
  'e1300000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111',
  'A3 B role transition'
);

select is(
  (select role from public.bible_app_access where user_id='11111111-1111-4111-8111-111111111111'),
  'member',
  'A3 publication actor is not a site-wide owner or admin'
);
select is(
  (select role from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111111' and active),
  'leader',
  'A3 publication actor begins as an active congregation A leader'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_publish_curriculum_path(
    '10000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001','e1100000-0000-4000-8000-000000000001',
    'e1200000-0000-4000-8000-000000000001','e1300000-0000-4000-8000-000000000001',
    'e1010000-0000-4000-8000-000000000001','e1110000-0000-4000-8000-000000000001',
    'e1210000-0000-4000-8000-000000000001','{}'::uuid[])
$sql$),'00000','Current congregation A leader can publish congregation A curriculum through SECURITY DEFINER RPC');
select is(
  (select t.publication_state || '/' || m.publication_state || '/' || l.publication_state
   from public.v7_tracks t join public.v7_modules m on m.track_id=t.id join public.v7_lessons l on l.module_id=m.id
   where t.id='e1000000-0000-4000-8000-000000000001'),
  'published/published/published',
  'Authorized congregation A publication commits the complete hierarchy'
);
select ok(
  (select published_at is not null from public.v7_lesson_revisions where id='e1300000-0000-4000-8000-000000000001'),
  'Authorized congregation A publication stamps the immutable lesson revision'
);
select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_publish_curriculum_path(
    '20000000-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000003','e1100000-0000-4000-8000-000000000003',
    'e1200000-0000-4000-8000-000000000003','e1300000-0000-4000-8000-000000000003',
    'e1010000-0000-4000-8000-000000000003','e1110000-0000-4000-8000-000000000003',
    'e1210000-0000-4000-8000-000000000003','{}'::uuid[])
$sql$),'42501','Congregation A leader cannot publish congregation B curriculum through SECURITY DEFINER RPC');
select is(
  (select publication_state from public.v7_tracks where id='e1000000-0000-4000-8000-000000000003'),
  'draft',
  'Foreign-congregation RPC denial leaves congregation B curriculum unchanged'
);

-- Keep the JWT/user identity unchanged while moving the actor from A to B and
-- downgrading the current congregation role to ordinary member.
reset role;
update public.bible_congregation_members
set active=false
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111111';
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values(
  '20000000-0000-4000-8000-000000000002',
  '11111111-1111-4111-8111-111111111111',
  'member','A3 Switched RPC Member',true
)
on conflict(congregation_id,user_id) do update
set role='member',display_name='A3 Switched RPC Member',active=true;

select ok(
  not exists(select 1 from public.bible_congregation_members where congregation_id='10000000-0000-4000-8000-000000000001' and user_id='11111111-1111-4111-8111-111111111111' and active),
  'Former congregation A leader membership is inactive after context switch'
);
select is(
  (select role from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002' and user_id='11111111-1111-4111-8111-111111111111' and active),
  'member',
  'Same actor is only an ordinary congregation B member after context switch'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_publish_curriculum_path(
    '10000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000002','e1100000-0000-4000-8000-000000000002',
    'e1200000-0000-4000-8000-000000000002','e1300000-0000-4000-8000-000000000002',
    'e1010000-0000-4000-8000-000000000002','e1110000-0000-4000-8000-000000000002',
    'e1210000-0000-4000-8000-000000000002','{}'::uuid[])
$sql$),'42501','Switched former A leader cannot publish stale congregation A curriculum through SECURITY DEFINER RPC');
select is(
  (select t.publication_state || '/' || m.publication_state || '/' || l.publication_state
   from public.v7_tracks t join public.v7_modules m on m.track_id=t.id join public.v7_lessons l on l.module_id=m.id
   where t.id='e1000000-0000-4000-8000-000000000002'),
  'draft/draft/draft',
  'Stale congregation A publish denial leaves the hierarchy unchanged'
);
select ok(
  (select published_at is null from public.v7_lesson_revisions where id='e1300000-0000-4000-8000-000000000002'),
  'Stale congregation A publish denial does not stamp the lesson revision'
);
select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_withdraw_curriculum_lesson(
    '10000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000001','e1100000-0000-4000-8000-000000000001',
    'e1200000-0000-4000-8000-000000000001','e1300000-0000-4000-8000-000000000001',
    'e1010000-0000-4000-8000-000000000001','e1110000-0000-4000-8000-000000000001',
    'e1210000-0000-4000-8000-000000000001')
$sql$),'42501','Switched former A leader cannot withdraw stale congregation A curriculum through SECURITY DEFININER RPC');
select is(
  (select publication_state from public.v7_lessons where id='e1200000-0000-4000-8000-000000000001'),
  'published',
  'Stale congregation A withdrawal denial preserves published lesson visibility'
);
select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_publish_curriculum_path(
    '20000000-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000003','e1100000-0000-4000-8000-000000000003',
    'e1200000-0000-4000-8000-000000000003','e1300000-0000-4000-8000-000000000003',
    'e1010000-0000-4000-8000-000000000003','e1110000-0000-4000-8000-000000000003',
    'e1210000-0000-4000-8000-000000000003','{}'::uuid[])
$sql$),'42501','Switched ordinary member cannot publish congregation B curriculum through SECURITY DEFINER RPC');
select is(
  (select publication_state from public.v7_tracks where id='e1000000-0000-4000-8000-000000000003'),
  'draft',
  'Ordinary-member congregation B RPC denial leaves the track unchanged'
);

-- Promote only the current B membership. The JWT remains the same; authority
-- must follow the current role rather than any cached identity decision.
reset role;
update public.bible_congregation_members
set role='leader',active=true
where congregation_id='20000000-0000-4000-8000-000000000002'
  and user_id='11111111-1111-4111-8111-111111111111';

select is(
  (select role from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002' and user_id='11111111-1111-4111-8111-111111111111' and active),
  'leader',
  'Same actor is promoted to current congregation B leader without changing JWT identity'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';
select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_publish_curriculum_path(
    '20000000-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000003','e1100000-0000-4000-8000-000000000003',
    'e1200000-0000-4000-8000-000000000003','e1300000-0000-4000-8000-000000000003',
    'e1010000-0000-4000-8000-000000000003','e1110000-0000-4000-8000-000000000003',
    'e1210000-0000-4000-8000-000000000003','{}'::uuid[])
$sql$),'00000','Current congregation B leader can publish congregation B curriculum with the same JWT identity');
select is(
  (select t.publication_state || '/' || m.publication_state || '/' || l.publication_state
   from public.v7_tracks t join public.v7_modules m on m.track_id=t.id join public.v7_lessons l on l.module_id=m.id
   where t.id='e1000000-0000-4000-8000-000000000003'),
  'published/published/published',
  'Current-role promotion enables only the current congregation B hierarchy'
);
select ok(
  (select published_at is not null from public.v7_lesson_revisions where id='e1300000-0000-4000-8000-000000000003'),
  'Current congregation B publication stamps its lesson revision'
);
select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_withdraw_curriculum_lesson(
    '20000000-0000-4000-8000-000000000002',
    'e1000000-0000-4000-8000-000000000003','e1100000-0000-4000-8000-000000000003',
    'e1200000-0000-4000-8000-000000000003','e1300000-0000-4000-8000-000000000003',
    'e1010000-0000-4000-8000-000000000003','e1110000-0000-4000-8000-000000000003',
    'e1210000-0000-4000-8000-000000000003')
$sql$),'00000','Current congregation B leader can withdraw congregation B curriculum through SECURITY DEFINER RPC');
select is(
  (select publication_state from public.v7_lessons where id='e1200000-0000-4000-8000-000000000003'),
  'withdrawn',
  'Current congregation B withdrawal changes only the authorized B lesson'
);
select is(pg_temp.v7_rpc_sqlstate($sql$
  select * from public.bible_v7_publish_curriculum_path(
    '10000000-0000-4000-8000-000000000001',
    'e1000000-0000-4000-8000-000000000002','e1100000-0000-4000-8000-000000000002',
    'e1200000-0000-4000-8000-000000000002','e1300000-0000-4000-8000-000000000002',
    'e1010000-0000-4000-8000-000000000002','e1110000-0000-4000-8000-000000000002',
    'e1210000-0000-4000-8000-000000000002','{}'::uuid[])
$sql$),'42501','Current congregation B leader still cannot publish stale congregation A curriculum');
select is(
  (select publication_state from public.v7_tracks where id='e1000000-0000-4000-8000-000000000002'),
  'draft',
  'Current congregation B authority never revives stale congregation A publication rights'
);
select is(
  (select role from public.bible_app_access where user_id='11111111-1111-4111-8111-111111111111'),
  'member',
  'Site-wide platform role remains ordinary member throughout the context-switch proof'
);

reset role;
select * from finish();
rollback;