-- V6 recognition tenant-target hardening.
-- Keep recognition awards inside one congregation at the database authority layer:
-- the actor must hold an accepted ministry role in the congregation and the
-- recognized user must be an active member of that same congregation.

drop policy if exists "leaders create recognitions"
on public.bible_member_recognitions;

create policy "leaders create recognitions"
on public.bible_member_recognitions
for insert
to authenticated
with check (
  awarded_by = auth.uid()
  and private.bible_role_in_congregation(congregation_id) = any(array['leader','pastor','admin'])
  and exists (
    select 1
    from public.bible_congregation_members as target_membership
    where target_membership.congregation_id = bible_member_recognitions.congregation_id
      and target_membership.user_id = bible_member_recognitions.user_id
      and target_membership.active
  )
);
