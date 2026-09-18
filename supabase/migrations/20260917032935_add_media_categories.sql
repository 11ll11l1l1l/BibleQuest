alter table public.bible_media_library
  add column if not exists category text not null default 'other'
  check (category in ('sunday-service','bible-study','worship','testimony','kids','family-couples','other'));

create index if not exists bible_media_library_category_idx
  on public.bible_media_library(congregation_id,category,active,created_at desc);
