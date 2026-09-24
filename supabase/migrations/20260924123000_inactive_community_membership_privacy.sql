-- V6 S2 inactive-membership privacy hardening.
--
-- Browser-facing congregation and Journey Group rosters represent current
-- membership. Inactive congregation rows remain retained for trusted backend
-- history/recovery but must not stay visible through ordinary authenticated
-- SELECT policies.

drop policy if exists "members congregation read" on public.bible_congregation_members;
create policy "members congregation read"
on public.bible_congregation_members
for select
to authenticated
using (
  active
  and (
    private.is_bible_congregation_member(congregation_id)
    or exists (
      select 1
      from public.bible_congregations c
      where c.id = congregation_id
        and c.owner_id = (select auth.uid())
    )
  )
);

drop policy if exists "journey group members read" on public.bible_group_members;
create policy "journey group members read"
on public.bible_group_members
for select
to authenticated
using (
  private.is_bible_group_member(group_id)
  and exists (
    select 1
    from public.bible_groups g
    join public.bible_congregation_members cm
      on cm.congregation_id = g.congregation_id
     and cm.user_id = bible_group_members.user_id
     and cm.active
    where g.id = bible_group_members.group_id
      and g.active
  )
);
