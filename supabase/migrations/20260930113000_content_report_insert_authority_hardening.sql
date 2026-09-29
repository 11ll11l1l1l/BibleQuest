drop policy if exists "content reports submit own" on public.bible_content_reports;
create policy "content reports submit own"
on public.bible_content_reports for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and private.is_bible_congregation_member(congregation_id)
  and status = 'open'
  and reviewed_by is null
  and reviewed_at is null
);

comment on policy "content reports submit own" on public.bible_content_reports is
  'Members may submit only new open reports for themselves inside an active congregation membership. Review state and reviewer identity remain server-authorized reviewer fields.';
