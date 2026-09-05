-- Restrict direct browser creation of Cloud Teams to the same congregation
-- leadership roles enforced by the bq-team Edge Function and production UI.
-- Service-role Edge Function writes bypass RLS and are unaffected.

drop policy if exists "teams member create" on public.bible_teams;

create policy "teams leaders create"
on public.bible_teams
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and private.bible_role_in_congregation(congregation_id) in ('facilitator','leader','pastor','admin')
);
