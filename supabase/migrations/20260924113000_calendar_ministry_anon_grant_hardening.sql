-- V6 S2 least-privilege hardening.
--
-- Supabase project defaults can leave newly-created public-schema tables with
-- effective privileges for the anon role even when all RLS policies are scoped
-- to authenticated callers. These domains contain account/congregation data and
-- have no signed-out product contract, so remove unnecessary anonymous table
-- privileges explicitly. Authenticated grants and RLS policies remain unchanged.

revoke all on table public.bible_calendar_events from anon;
revoke all on table public.bible_ministry_messages from anon;
revoke all on table public.bible_polls from anon;
revoke all on table public.bible_poll_votes from anon;
