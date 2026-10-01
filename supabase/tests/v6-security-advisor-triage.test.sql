begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

select ok(
  (select prosecdef
     from pg_proc
    where oid='public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)'::regprocedure),
  'telemetry ingestion remains an intentional SECURITY DEFINER boundary'
);

select ok(
  coalesce((
    select array_to_string(proconfig, ',') like '%search_path=%pg_catalog%public%private%'
      from pg_proc
     where oid='public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)'::regprocedure
  ), false),
  'telemetry SECURITY DEFINER function pins its search_path'
);

select ok(
  has_function_privilege(
    'anon',
    'public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)',
    'EXECUTE'
  ),
  'anonymous clients may call only the reviewed write-only telemetry ingress'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)',
    'EXECUTE'
  ),
  'authenticated clients may call the reviewed write-only telemetry ingress'
);

select ok(
  has_function_privilege(
    'service_role',
    'public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)',
    'EXECUTE'
  ),
  'service role retains telemetry ingestion execution'
);

select ok(
  not exists (
    select 1
      from (values
        ('bible_telemetry_visitors'),
        ('bible_telemetry_sessions'),
        ('bible_telemetry_events')
      ) as t(table_name)
      cross join unnest(array['SELECT','INSERT','UPDATE','DELETE']) as p(privilege_name)
     where has_table_privilege(
       'anon',
       format('public.%I', t.table_name),
       p.privilege_name
     )
  ),
  'anonymous clients have no direct DML privileges on telemetry storage'
);

select ok(
  not exists (
    select 1
      from (values
        ('bible_telemetry_visitors'),
        ('bible_telemetry_sessions'),
        ('bible_telemetry_events')
      ) as t(table_name)
      cross join unnest(array['SELECT','INSERT','UPDATE','DELETE']) as p(privilege_name)
     where has_table_privilege(
       'authenticated',
       format('public.%I', t.table_name),
       p.privilege_name
     )
  ),
  'authenticated clients have no direct DML privileges on telemetry storage'
);

select ok(
  (select relrowsecurity
     from pg_class
    where oid='public.bible_telemetry_events'::regclass),
  'telemetry event storage keeps RLS enabled in addition to revoked table grants'
);

select ok(
  coalesce(
    obj_description(
      'public.bible_record_telemetry_batch(uuid,uuid,jsonb,jsonb)'::regprocedure,
      'pg_proc'
    ),
    ''
  ) like '%Write-only V6 telemetry endpoint%',
  'the intentional public telemetry exception is documented at the database boundary'
);

select * from finish();
rollback;
