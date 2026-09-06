create or replace function private.bible_touch_updated_at()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  new.updated_at=now();
  return new;
end $$;

drop trigger if exists bible_media_library_touch_updated_at on public.bible_media_library;
create trigger bible_media_library_touch_updated_at
before update on public.bible_media_library
for each row execute function private.bible_touch_updated_at();
