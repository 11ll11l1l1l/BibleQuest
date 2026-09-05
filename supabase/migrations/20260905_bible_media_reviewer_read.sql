drop policy if exists "media reviewer read" on public.bible_media_library;
create policy "media reviewer read" on public.bible_media_library for select to authenticated using (private.bible_can_review_content(congregation_id));
