drop policy if exists "content reviewers read congregation members" on public.bible_congregation_members;
drop policy if exists "members congregation read" on public.bible_congregation_members;
create policy "members congregation read"
on public.bible_congregation_members for select
to authenticated
using (
  private.is_bible_congregation_member(congregation_id)
  or private.bible_can_review_content(congregation_id)
  or exists (
    select 1 from public.bible_congregations c
    where c.id=bible_congregation_members.congregation_id
      and c.owner_id=(select auth.uid())
  )
);

drop policy if exists "content reviewers read congregations" on public.bible_congregations;
drop policy if exists "congregations member read" on public.bible_congregations;
create policy "congregations member read"
on public.bible_congregations for select
to authenticated
using (
  owner_id=(select auth.uid())
  or private.is_bible_congregation_member(id)
  or private.bible_can_review_content(id)
);

create index if not exists bible_content_reports_reviewed_by_idx
  on public.bible_content_reports(reviewed_by)
  where reviewed_by is not null;
create index if not exists bible_content_decisions_reviewed_by_idx
  on public.bible_content_decisions(reviewed_by)
  where reviewed_by is not null;
