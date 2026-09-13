-- BibleQuest production release hardening.
-- Keep privileged aggregation out of the exposed REST RPC surface.
drop function if exists public.bible_room_poll_totals(uuid, integer);

-- Cover foreign keys used by the new production features.
create index if not exists bible_room_responses_user_idx on public.bible_room_responses(user_id);
create index if not exists bible_challenges_created_by_idx on public.bible_challenges(created_by);
create index if not exists bible_couple_invites_pair_idx on public.bible_couple_invites(pair_id);
create index if not exists bible_couple_invites_created_by_idx on public.bible_couple_invites(created_by);
create index if not exists bible_couple_invites_used_by_idx on public.bible_couple_invites(used_by) where used_by is not null;
create index if not exists bible_couple_shared_author_idx on public.bible_couple_shared(author_id);

-- Live poll totals are served by the authenticated bq-room-poll Edge Function,
-- which verifies active congregation membership before using the service role.
