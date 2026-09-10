-- #82 Avatar Vault: complete the congregation-visible avatar column that
-- 20260905_congregation_member_column_hardening.sql already grants column
-- privileges for, but which was never actually created, and add the missing
-- self-update RLS policy (grants alone do not satisfy RLS with no policy).
-- bible_avatar_cosmetics (private per-user selection/unlock record) already
-- exists from 20260904_assignments_presence_unlocks.sql and is unchanged here.

alter table public.bible_congregation_members
  add column if not exists avatar jsonb not null default '{}'::jsonb;

drop policy if exists "members self avatar update" on public.bible_congregation_members;
create policy "members self avatar update" on public.bible_congregation_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
