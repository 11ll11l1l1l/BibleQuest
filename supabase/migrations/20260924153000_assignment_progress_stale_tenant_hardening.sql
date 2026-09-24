-- V6 S2 assignment-progress stale-tenant hardening.
--
-- A progress row belongs to a user, but ownership must not preserve access after
-- the user leaves the assignment congregation. Leadership review likewise must
-- remain scoped to an active leadership membership in that congregation.

drop policy if exists "assignment progress visible" on public.bible_assignment_progress;

create policy "assignment progress visible"
on public.bible_assignment_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.bible_assignments a
    where a.id = bible_assignment_progress.assignment_id
      and (
        (
          bible_assignment_progress.user_id = (select auth.uid())
          and private.bible_assignment_visible(
            a.congregation_id,
            a.target_scope,
            a.target_id
          )
        )
        or private.bible_role_in_congregation(a.congregation_id)
          in ('facilitator', 'leader', 'pastor', 'admin')
      )
  )
);
