drop policy if exists "content reviewers read congregation members" on public.bible_congregation_members;
create policy "content reviewers read congregation members"
on public.bible_congregation_members for select
to authenticated
using (private.bible_can_review_content(congregation_id));
