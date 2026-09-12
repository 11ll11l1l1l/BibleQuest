-- BibleQuest V4 Phase 3: privacy-safe "active in the last 30 min" aggregate.
--
-- Verified finding before this migration: the existing "presence congregation
-- read" policy on bible_presence grants SELECT of every raw row (including
-- user_id) to any authenticated congregation member. This means an ordinary
-- member could already query the full list of who is currently present,
-- not just a count - exactly what the new requirement says not to expose.
-- This migration: (1) restricts raw row SELECT to ministry roles only
-- (Leader Center use case), and (2) adds a SECURITY DEFINER aggregate
-- function that returns only a count, safe for ordinary members to call.

drop policy if exists "presence congregation read" on public.bible_presence;
create policy "presence congregation read" on public.bible_presence for select to authenticated
using (
  private.bible_role_in_congregation(congregation_id)
      = any (array['facilitator','leader','pastor','admin'])
);
comment on policy "presence congregation read" on public.bible_presence is
  'Raw per-member presence rows are ministry-role-only (Leader Center). Ordinary members must use public.bible_presence_active_count() instead, which returns an aggregate only.';

-- Ordinary members can still write/clear their own heartbeat row (unchanged -
-- "presence own insert/update/delete" policies already scope by
-- user_id = auth.uid() and are not touched by this migration).

create or replace function public.bible_presence_active_count(
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

revoke all on function public.bible_presence_active_count(uuid, integer) from public;
grant execute on function public.bible_presence_active_count(uuid, integer) to authenticated;

comment on function public.bible_presence_active_count(uuid, integer) is
  'Privacy-safe aggregate: returns only a count of members active within the given window (default 30 min). Verifies the caller belongs to the congregation server-side; never returns individual rows, names, or timestamps. Ordinary members use this; ministry roles may still read raw bible_presence rows for the Leader Center.';
