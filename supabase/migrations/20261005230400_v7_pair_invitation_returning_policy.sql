-- Pair invitations use INSERT ... RETURNING through PostgREST. A STABLE helper
-- that rereads v7_mentor_pairs cannot see that statement's new row during the
-- SELECT-policy check. Evaluate participant identity from the returned row
-- itself, preserving the existing participant-only read boundary.
drop policy if exists "v7 pair participant read" on public.v7_mentor_pairs;
create policy "v7 pair participant read"
on public.v7_mentor_pairs for select to authenticated
using ((select auth.uid()) in (mentor_id, mentee_id));
