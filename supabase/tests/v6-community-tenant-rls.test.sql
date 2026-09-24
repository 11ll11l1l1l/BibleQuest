begin;

create extension if not exists pgtap with schema extensions;
select plan(35);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_groups'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_group_members'::regclass),
  'journey groups and memberships keep RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_teams'::regclass)
  and (select relrowsecurity from pg_class where oid='public.bible_team_members'::regclass),
  'teams and team memberships keep RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid='public.bible_presence'::regclass),
  'presence keeps RLS enabled'
);

select ok(
  not has_table_privilege('anon','public.bible_groups','SELECT')
  and not has_table_privilege('anon','public.bible_group_members','SELECT'),
  'anonymous role cannot read journey groups or group membership'
);
select ok(
  not has_table_privilege('anon','public.bible_teams','SELECT')
  and not has_table_privilege('anon','public.bible_team_members','SELECT'),
  'anonymous role cannot read teams or team membership'
);
select ok(
  not has_table_privilege('anon','public.bible_presence','SELECT')
  and not has_table_privilege('anon','public.bible_presence','INSERT')
  and not has_table_privilege('anon','public.bible_presence','UPDATE')
  and not has_table_privilege('anon','public.bible_presence','DELETE'),
  'anonymous role has no presence table privileges'
);

select ok(
  (select prosecdef from pg_proc where oid='private.is_bible_group_member(uuid)'::regprocedure),
  'group membership helper remains SECURITY DEFINER'
);
select ok(
  (select prosecdef from pg_proc where oid='private.shares_bible_group(uuid)'::regprocedure),
  'shared-group helper remains SECURITY DEFINER'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=%'
     from pg_proc where oid='private.is_bible_group_member(uuid)'::regprocedure),
    false
  ),
  'group membership SECURITY DEFINER pins search_path'
);
select ok(
  coalesce(
    (select array_to_string(proconfig, ',') like '%search_path=%'
     from pg_proc where oid='private.shares_bible_group(uuid)'::regprocedure),
    false
  ),
  'shared-group SECURITY DEFINER pins search_path'
);
select ok(
  (select prosecdef from pg_proc where oid='private.bible_presence_active_count_impl(uuid,integer)'::regprocedure),
  'presence count implementation remains SECURITY DEFINER'
);
select ok(
  not (select prosecdef from pg_proc where oid='public.bible_presence_active_count(uuid,integer)'::regprocedure),
  'public presence-count RPC remains SECURITY INVOKER'
);
select ok(
  not has_function_privilege('anon','private.is_bible_group_member(uuid)','EXECUTE')
  and not has_function_privilege('anon','private.shares_bible_group(uuid)','EXECUTE')
  and not has_function_privilege('anon','public.bible_presence_active_count(uuid,integer)','EXECUTE'),
  'anonymous role cannot execute group or presence helpers'
);
select ok(
  has_function_privilege('authenticated','private.is_bible_group_member(uuid)','EXECUTE')
  and has_function_privilege('authenticated','private.shares_bible_group(uuid)','EXECUTE')
  and has_function_privilege('authenticated','public.bible_presence_active_count(uuid,integer)','EXECUTE'),
  'authenticated role can execute bounded group and presence helpers'
);

set local role authenticated;
set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111112';

select results_eq(
  $$select id from public.bible_groups order by id$$,
  array['61000000-0000-4000-8000-000000000001'::uuid],
  'Member A reads only its joined journey group'
);
select results_eq(
  $$select id from public.bible_teams order by id$$,
  array['71000000-0000-4000-8000-000000000001'::uuid],
  'Member A reads only congregation A teams'
);
select results_eq(
  $$select count(*)::bigint from public.bible_team_members$$,
  array[2::bigint],
  'Member A reads only congregation A team membership rows'
);
select results_eq(
  $$select count(*)::bigint from public.bible_group_members$$,
  array[2::bigint],
  'Member A reads only its joined group membership rows'
);
select results_eq(
  $q$select count(*)::bigint from public.bible_presence$q$,
  array[0::bigint],
  'ordinary Member A cannot read raw per-member presence rows'
);
select ok(
  private.is_bible_group_member('61000000-0000-4000-8000-000000000001'::uuid)
  and not private.is_bible_group_member('62000000-0000-4000-8000-000000000002'::uuid),
  'Member A group helper allows own group and denies foreign group'
);
select ok(
  private.shares_bible_group('11111111-1111-4111-8111-111111111111'::uuid)
  and not private.shares_bible_group('22222222-2222-4222-8222-222222222222'::uuid),
  'Member A shared-group helper allows group peer and denies foreign member'
);
select is(
  public.bible_presence_active_count('10000000-0000-4000-8000-000000000001'::uuid,30),
  1,
  'Member A can execute presence-count RPC for own congregation'
);
select is(
  public.bible_presence_active_count('20000000-0000-4000-8000-000000000002'::uuid,30),
  0,
  'Member A presence-count RPC fails closed for foreign congregation'
);
select throws_ok(
  $$insert into public.bible_presence(congregation_id,user_id,last_seen_at,surface)
    values('20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111112',now(),'foreign')$$,
  '42501', null,
  'Member A cannot create presence in congregation B'
);
select throws_ok(
  $$insert into public.bible_teams(id,congregation_id,created_by,team_type,name,active)
    values('73000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111112','game_team','Member Team',true)$$,
  '42501', null,
  'ordinary Member A cannot directly create a team'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111111';

select lives_ok(
  $q$insert into public.bible_teams(id,congregation_id,created_by,team_type,name,active)
    values('74000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','game_team','Leader Team',true)$q$,
  'Leader A may directly create a team in congregation A'
);
select results_eq(
  $q$select count(*)::bigint from public.bible_presence$q$,
  array[1::bigint],
  'Leader A may read raw presence rows only in congregation A'
);
select throws_ok(
  $$insert into public.bible_teams(id,congregation_id,created_by,team_type,name,active)
    values('75000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','game_team','Foreign Team',true)$$,
  '42501', null,
  'Leader A cannot directly create a team in congregation B'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111113';

select results_eq(
  $$select count(*)::bigint from public.bible_groups$$,
  array[0::bigint],
  'Pastor A cannot read private journey groups it has not joined'
);

set local "request.jwt.claim.sub"='11111111-1111-4111-8111-111111111114';

select results_eq(
  $q$select count(*)::bigint from public.bible_groups$q$,
  array[0::bigint],
  'former congregation member cannot retain Journey Group visibility from stale group membership'
);
select results_eq(
  $q$select count(*)::bigint from public.bible_group_members$q$,
  array[0::bigint],
  'former congregation member cannot read group membership roster'
);
select is(
  private.is_bible_group_member('61000000-0000-4000-8000-000000000001'::uuid),
  false,
  'group membership helper rejects stale membership after congregation removal'
);
select is(
  private.shares_bible_group('11111111-1111-4111-8111-111111111111'::uuid),
  false,
  'shared-group helper rejects stale congregation membership'
);

set local "request.jwt.claim.sub"='22222222-2222-4222-8222-222222222222';

select results_eq(
  $q$select id from public.bible_groups order by id$q$,
  array['62000000-0000-4000-8000-000000000002'::uuid],
  'Member B reads only its joined journey group'
);
select results_eq(
  $q$select count(*)::bigint from public.bible_presence$q$,
  array[0::bigint],
  'ordinary Member B cannot read raw per-member presence rows'
);

reset role;
select * from finish();
rollback;
