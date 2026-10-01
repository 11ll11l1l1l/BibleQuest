begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

select ok(
  (select relrowsecurity from pg_class where oid='public.bible_congregation_membership_audit'::regclass),
  'membership audit keeps RLS enabled'
);
select ok(
  not has_table_privilege('authenticated','public.bible_congregation_membership_audit','SELECT'),
  'browser roles cannot read membership audit entries'
);
select ok(
  not has_table_privilege('anon','public.bible_congregation_membership_audit','SELECT'),
  'anonymous clients cannot read membership audit entries'
);
select ok(
  (select prosecdef from pg_proc where oid='public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean)'::regprocedure),
  'membership manager is SECURITY DEFINER'
);
select ok(
  coalesce((select array_to_string(proconfig,',') like '%search_path=pg_catalog, public%' from pg_proc where oid='public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean)'::regprocedure),false),
  'membership manager pins search_path'
);
select ok(
  coalesce((select array_to_string(proconfig,',') like '%row_security=off%' from pg_proc where oid='public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean)'::regprocedure),false),
  'service-only membership transaction has stable RLS behavior'
);
select ok(
  has_function_privilege('service_role','public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean)','EXECUTE'),
  'service role can execute membership manager'
);
select ok(
  not has_function_privilege('authenticated','public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean)','EXECUTE'),
  'authenticated clients cannot call membership manager'
);
select ok(
  not has_function_privilege('anon','public.bible_manage_congregation_member_v6(uuid,uuid,uuid,text,boolean)','EXECUTE'),
  'anonymous clients cannot call membership manager'
);

insert into auth.users(id,email,raw_app_meta_data,raw_user_meta_data)
values('11111111-1111-4111-8111-111111111115','tenant-admin-a-membership@bq-v6.invalid','{}'::jsonb,'{}'::jsonb)
on conflict(id) do nothing;

insert into public.bible_app_access(user_id,role,active)
values('11111111-1111-4111-8111-111111111115','member',true)
on conflict(user_id) do update set role='member',active=true;

insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values('10000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111115','admin','Tenant Admin A',true)
on conflict(congregation_id,user_id) do update set role='admin',display_name='Tenant Admin A',active=true;

set local role service_role;
select lives_ok(
  $$select public.bible_manage_congregation_member_v6(
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222221',
    '22222222-2222-4222-8222-222222222222',
    'pastor',true
  )$$,
  'congregation owner can assign a supported ministry role to a member'
);
select is(
  (select role from public.bible_congregation_members where congregation_id='20000000-0000-4000-8000-000000000002' and user_id='22222222-2222-4222-8222-222222222222'),
  'pastor',
  'role change is persisted in the selected congregation'
);
select throws_ok(
  $select public.bible_manage_congregation_member_v6(
    '10000000-0000-4000-8000-000000000001',
    '11111111-1111-4111-8111-111111111111',
    '11111111-1111-4111-8111-111111111112',
    'leader',true
  )$,
  '42501',
  'Congregation admin permission required',
  'a non-admin actor cannot change membership roles'
);
select throws_ok(
  $select public.bible_manage_congregation_member_v6(
    '20000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111115',
    '22222222-2222-4222-8222-222222222222',
    'facilitator',true
  )$,
  '42501',
  'Congregation admin permission required',
  'tenant-only Admin A cannot manage congregation B membership'
);

reset role;
delete from public.bible_congregation_members
where congregation_id='10000000-0000-4000-8000-000000000001'
  and user_id='11111111-1111-4111-8111-111111111115';
delete from public.bible_app_access where user_id='11111111-1111-4111-8111-111111111115';
delete from auth.users where id='11111111-1111-4111-8111-111111111115';
set local role service_role;
select throws_ok(
  $$select public.bible_manage_congregation_member_v6(
    '20000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222221',
    '22222222-2222-4222-8222-222222222221',
    'member',false
  )$$,
  '42501',
  'Transfer congregation ownership before changing its owner membership',
  'the congregation owner membership cannot be disabled or demoted'
);
select is(
  (select count(*)::bigint from public.bible_congregation_membership_audit where congregation_id='20000000-0000-4000-8000-000000000002'),
  1::bigint,
  'successful role change has one private audit row and rejected changes have none'
);

reset role;
insert into public.bible_congregation_members(congregation_id,user_id,role,display_name,active)
values('10000000-0000-4000-8000-000000000001','99999999-9999-4999-8999-999999999999','admin','Platform Owner',true)
on conflict(congregation_id,user_id) do update set role='admin',active=true;
set local role service_role;
select throws_ok(
  $$select public.bible_manage_congregation_member_v6(
    '10000000-0000-4000-8000-000000000001',
    '99999999-9999-4999-8999-999999999999',
    '99999999-9999-4999-8999-999999999999',
    'member',false
  )$$,
  '23514',
  'A congregation must retain at least one active admin',
  'the last active admin cannot be demoted or deactivated'
);
select lives_ok(
  $$select public.bible_manage_congregation_member_v6(
    '10000000-0000-4000-8000-000000000001',
    '99999999-9999-4999-8999-999999999999',
    '11111111-1111-4111-8111-111111111112',
    'facilitator',true
  )$$,
  'an active platform owner can use the same transaction for a non-admin membership change'
);

reset role;
select * from finish();
rollback;
