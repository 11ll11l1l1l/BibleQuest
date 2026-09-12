-- BibleQuest V4 Phase 3 follow-up: make the intended API grant explicit.
-- Existing Supabase default privileges may grant EXECUTE directly to anon,
-- so revoking PUBLIC alone is insufficient.

revoke execute on function public.bible_presence_active_count(uuid, integer)
  from anon, public;

grant execute on function public.bible_presence_active_count(uuid, integer)
  to authenticated;

comment on function public.bible_presence_active_count(uuid, integer) is
  'Privacy-safe aggregate for signed-in congregation members only. Returns only a count after server-side membership verification; anon execute is explicitly revoked.';
