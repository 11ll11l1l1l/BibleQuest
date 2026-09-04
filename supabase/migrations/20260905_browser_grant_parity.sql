-- BibleQuest browser grant parity hardening.
--
-- The shared Supabase project's Data API requires explicit table grants in
-- addition to RLS. Some BibleQuest tables inherited blanket anon/authenticated
-- privileges while other tables had valid UPDATE policies but no matching
-- UPDATE grant. Normalize only bible_* objects, preserving the Karimen side of
-- the shared project and intentionally leaving server-only no-policy tables
-- inaccessible to browser roles.
--
-- This migration is idempotent: it first removes browser table privileges from
-- BibleQuest tables, then re-grants only DML operations represented by current
-- RLS policies for anon/authenticated (or public) roles. It never grants
-- TRUNCATE, TRIGGER, or REFERENCES to browser roles.

do $$
declare
  r record;
  privilege_name text;
begin
  -- Reset browser privileges only on BibleQuest-owned tables.
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r'
      and n.nspname = 'public'
      and left(c.relname, 6) = 'bible_'
  loop
    execute format('revoke all privileges on table public.%I from anon, authenticated', r.table_name);
  end loop;

  -- Re-grant only operations backed by an RLS policy for anon/public.
  for r in
    select distinct tablename, cmd
    from pg_policies
    where schemaname = 'public'
      and left(tablename, 6) = 'bible_'
      and (
        roles @> array['anon']::name[]
        or roles @> array['public']::name[]
      )
  loop
    if r.cmd = 'ALL' then
      foreach privilege_name in array array['SELECT','INSERT','UPDATE','DELETE']
      loop
        execute format('grant %s on table public.%I to anon', privilege_name, r.tablename);
      end loop;
    elsif r.cmd in ('SELECT','INSERT','UPDATE','DELETE') then
      execute format('grant %s on table public.%I to anon', r.cmd, r.tablename);
    end if;
  end loop;

  -- Re-grant only operations backed by an RLS policy for authenticated/public.
  for r in
    select distinct tablename, cmd
    from pg_policies
    where schemaname = 'public'
      and left(tablename, 6) = 'bible_'
      and (
        roles @> array['authenticated']::name[]
        or roles @> array['public']::name[]
      )
  loop
    if r.cmd = 'ALL' then
      foreach privilege_name in array array['SELECT','INSERT','UPDATE','DELETE']
      loop
        execute format('grant %s on table public.%I to authenticated', privilege_name, r.tablename);
      end loop;
    elsif r.cmd in ('SELECT','INSERT','UPDATE','DELETE') then
      execute format('grant %s on table public.%I to authenticated', r.cmd, r.tablename);
    end if;
  end loop;
end
$$;
