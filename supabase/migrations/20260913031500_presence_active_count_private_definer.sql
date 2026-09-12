-- BibleQuest V4 Phase 3 release hardening: keep privileged presence counting
-- out of the exposed public API schema.
--
-- Supabase Security Advisor warns when a SECURITY DEFINER function is directly
-- executable from an exposed schema. Keep the raw-row bypass in private and
-- expose only a SECURITY INVOKER wrapper with the same stable RPC signature.

create or replace function private.bible_presence_active_count_impl(
  target_congregation uuid,
  window_minutes integer default 30
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.bible_presence p
  where p.congregation_id = target_congregation
    and private.is_bible_congregation_member(target_congregation)
    and p.last_seen_at >= now() - make_interval(mins => greatest(1, least(1440, window_minutes)))
$$;

revoke all on function private.bible_presence_active_count_impl(uuid, integer)
  from public, anon;
grant execute on function private.bible_presence_active_count_impl(uuid, integer)
  to authenticated;

comment on function private.bible_presence_active_count_impl(uuid, integer) is
  'Privileged implementation for privacy-safe presence counts. Non-exposed private schema; verifies congregation membership and returns only an integer aggregate.';

create or replace function public.bible_presence_active_count(
  target_congregation uuid,
  window_minutes integer default 30
)
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select private.bible_presence_active_count_impl(target_congregation, window_minutes)
$$;

revoke all on function public.bible_presence_active_count(uuid, integer)
  from public, anon;
grant execute on function public.bible_presence_active_count(uuid, integer)
  to authenticated;

comment on function public.bible_presence_active_count(uuid, integer) is
  'Privacy-safe signed-in RPC wrapper. Runs as SECURITY INVOKER and delegates the aggregate to the non-exposed private implementation; never returns member identities, rows, or timestamps.';
