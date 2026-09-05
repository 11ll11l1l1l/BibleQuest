drop policy if exists "announcement media leader update" on storage.objects;
create policy "announcement media leader update" on storage.objects for update to authenticated using (
  bucket_id='biblequest-announcements' and (
    private.bible_role_in_congregation((split_part(name,'/',1))::uuid) in ('facilitator','leader','pastor','admin')
    or private.bible_can_review_content((split_part(name,'/',1))::uuid)
  )
) with check (
  bucket_id='biblequest-announcements' and (
    private.bible_role_in_congregation((split_part(name,'/',1))::uuid) in ('facilitator','leader','pastor','admin')
    or private.bible_can_review_content((split_part(name,'/',1))::uuid)
  )
);
