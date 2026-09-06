-- Prevent congregation members from self-promoting or reactivating themselves.
--
-- RLS restricts UPDATE to the caller's own membership row, but table-level UPDATE
-- privileges still allow every column on that row to be targeted. Browser clients
-- only need to edit their public presentation fields. Trusted role/active changes
-- remain service-role operations through BibleQuest Edge Functions/admin flows.
--
-- BibleQuest-only change: no Karimen objects are touched.

revoke update on table public.bible_congregation_members from authenticated;
grant update (display_name, avatar) on table public.bible_congregation_members to authenticated;
