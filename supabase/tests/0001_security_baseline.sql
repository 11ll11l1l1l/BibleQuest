-- V5 Lab A2 executable database characterization.
-- Run only against a disposable local/CI Supabase database after migrations.
-- These assertions intentionally inspect real Postgres catalog state rather
-- than searching SQL text.

begin;

-- Sensitive congregation tables must remain protected by RLS.
do $$
declare
  missing_rls text;
begin
  select string_agg(c.relname, ', ' order by c.relname)
    into missing_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname in (
      'bible_congregations',
      'bible_congregation_members',
      'bible_teams',
      'bible_shared_sessions',
      'bible_session_participants',
      'bible_score_events'
    )
    and not c.relrowsecurity;

  if missing_rls is not null then
    raise exception 'RLS disabled on sensitive tables: %', missing_rls;
  end if;
end
$$;

-- The membership helper is a protected SECURITY DEFINER seam. It must exist,
-- remain SECURITY DEFINER, and retain an explicit search_path setting.
do $$
declare
  fn oid := to_regprocedure('private.is_bible_congregation_member(uuid)');
  is_definer boolean;
  settings text[];
begin
  if fn is null then
    raise exception 'missing private.is_bible_congregation_member(uuid)';
  end if;

  select p.prosecdef, p.proconfig
    into is_definer, settings
  from pg_proc p
  where p.oid = fn;

  if not is_definer then
    raise exception 'private.is_bible_congregation_member(uuid) is not SECURITY DEFINER';
  end if;

  if settings is null or not exists (
    select 1 from unnest(settings) setting where setting like 'search_path=%'
  ) then
    raise exception 'private.is_bible_congregation_member(uuid) lacks explicit search_path';
  end if;
end
$$;

-- PUBLIC/anonymous callers must not inherit execution on the private helper,
-- while authenticated callers need the explicit grant used by RLS policies.
do $$
begin
  if has_function_privilege('public', 'private.is_bible_congregation_member(uuid)', 'EXECUTE') then
    raise exception 'PUBLIC can execute private.is_bible_congregation_member(uuid)';
  end if;

  if not has_function_privilege('authenticated', 'private.is_bible_congregation_member(uuid)', 'EXECUTE') then
    raise exception 'authenticated lacks execute on private.is_bible_congregation_member(uuid)';
  end if;
end
$$;

rollback;
