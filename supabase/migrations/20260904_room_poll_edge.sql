-- Room poll votes remain private rows. Anonymous aggregates are returned by the authenticated
-- bq-room-poll Edge Function instead of an exposed SECURITY DEFINER RPC.
drop function if exists public.bible_room_poll_totals(uuid,integer);
