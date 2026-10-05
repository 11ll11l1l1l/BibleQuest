begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- This is a production-readiness contract, not an RLS behavior fixture. Any new
-- public V7 table must be reviewed here so accidental Data API exposure cannot
-- enter the release candidate unnoticed.
select is(
  (
    select count(*)::integer
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and left(c.relname, 3) = 'v7_'
  ),
  16,
  'Reviewed V7 public table inventory remains exactly 16 tables'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and left(c.relname, 3) = 'v7_'
      and not c.relrowsecurity
  ),
  'Every V7 public table has row-level security enabled'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))
    ) acl
    left join pg_catalog.pg_roles grantee on grantee.oid = acl.grantee
    where n.nspname = 'public'
      and c.relkind = 'r'
      and left(c.relname, 3) = 'v7_'
      and (acl.grantee = 0 or grantee.rolname = 'anon')
  ),
  'No V7 public table grants any privilege to PUBLIC or anon'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and left(c.relname, 3) = 'v7_'
      and not has_table_privilege('authenticated', c.oid, 'SELECT')
  ),
  'Every reviewed V7 table remains explicitly readable through the authenticated Data API'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))
    ) acl
    join pg_catalog.pg_roles grantee on grantee.oid = acl.grantee
    where n.nspname = 'public'
      and c.relkind = 'r'
      and left(c.relname, 3) = 'v7_'
      and grantee.rolname = 'authenticated'
      and upper(acl.privilege_type) in ('TRUNCATE', 'REFERENCES', 'TRIGGER')
  ),
  'Authenticated V7 clients never receive table-owner style privileges'
);

select ok(
  not has_table_privilege('authenticated', 'public.v7_pair_assignments', 'INSERT'),
  'Direct assignment INSERT stays revoked from authenticated clients'
);

select ok(
  has_table_privilege('authenticated', 'public.v7_pair_assignments', 'UPDATE'),
  'Bounded assignment lifecycle UPDATE remains available behind RLS'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'Authenticated mentors can call the race-safe assignment creation authority'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and left(p.proname, 9) = 'bible_v7_'
      and has_function_privilege('anon', p.oid, 'EXECUTE')
  ),
  'Anonymous clients cannot execute any public BibleQuest V7 RPC'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc p
    join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and left(p.proname, 9) = 'bible_v7_'
      and not has_function_privilege('authenticated', p.oid, 'EXECUTE')
  ),
  'Every public BibleQuest V7 RPC is intentionally executable by authenticated clients'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.bible_v7_publish_curriculum_path(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid[])',
    'EXECUTE'
  ),
  'Authenticated reviewers can call the canonical curriculum publication authority'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.bible_v7_withdraw_curriculum_lesson(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid)',
    'EXECUTE'
  ),
  'Authenticated reviewers can call the canonical curriculum withdrawal authority'
);

select * from finish();
rollback;
