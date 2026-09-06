-- BibleQuest only: shared couple entries are append-only from browser clients.
-- Current Couple Journey UI only inserts journey completions/commitments and never edits rows.
-- Prevent either partner from mutating the other partner's authored shared history through Data API UPDATE.

revoke update on table public.bible_couple_shared from authenticated;

drop policy if exists "couple shared pair update" on public.bible_couple_shared;

-- Keep service-role/server maintenance unaffected; service_role retains its own privileges and bypasses RLS.
