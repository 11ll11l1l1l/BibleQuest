create table if not exists public.bible_media_library (
  id uuid primary key default gen_random_uuid(),
  congregation_id uuid not null references public.bible_congregations(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  media_type text not null default 'youtube_video' check (media_type in ('youtube_video','youtube_channel','youtube_playlist')),
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  youtube_url text not null,
  youtube_id text,
  cover_path text,
  featured boolean not null default false,
  display_order integer not null default 0,
  active boolean not null default true,
  publish_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bible_media_library_congregation_idx on public.bible_media_library(congregation_id,active,publish_at,display_order,created_at desc);
alter table public.bible_media_library enable row level security;

drop policy if exists "media congregation read" on public.bible_media_library;
create policy "media congregation read" on public.bible_media_library for select to authenticated using (
  active and publish_at <= now() and private.is_bible_congregation_member(congregation_id)
);
drop policy if exists "media ministry insert" on public.bible_media_library;
create policy "media ministry insert" on public.bible_media_library for insert to authenticated with check (
  created_by = auth.uid() and private.bible_can_review_content(congregation_id)
);
drop policy if exists "media ministry update" on public.bible_media_library;
create policy "media ministry update" on public.bible_media_library for update to authenticated using (
  private.bible_can_review_content(congregation_id)
) with check (private.bible_can_review_content(congregation_id));
revoke all on public.bible_media_library from anon;
grant select,insert,update on public.bible_media_library to authenticated;

create or replace function private.bible_notify_new_media()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.active and new.publish_at <= now() then
    insert into public.bible_notifications(user_id,congregation_id,created_by,notification_type,title,body,action_kind,action_payload,created_at)
    select m.user_id,new.congregation_id,new.created_by,'media',
      case when new.media_type='youtube_channel' then 'New recommended YouTube channel' else 'New handpicked BibleQuest video' end,
      new.title,'media',jsonb_build_object('media_id',new.id,'media_type',new.media_type),now()
    from public.bible_congregation_members m
    where m.congregation_id=new.congregation_id and m.active;
  end if;
  return new;
end $$;
drop trigger if exists bible_media_library_notify_insert on public.bible_media_library;
create trigger bible_media_library_notify_insert after insert on public.bible_media_library for each row execute function private.bible_notify_new_media();

-- Reuse the private announcement bucket for media covers, while preserving facilitator announcement uploads and adding platform Owner/Admin coverage.
drop policy if exists "announcement media leader insert" on storage.objects;
create policy "announcement media leader insert" on storage.objects for insert to authenticated with check (
  bucket_id='biblequest-announcements' and (
    private.bible_role_in_congregation((split_part(name,'/',1))::uuid) in ('facilitator','leader','pastor','admin')
    or private.bible_can_review_content((split_part(name,'/',1))::uuid)
  )
);
drop policy if exists "announcement media leader update" on storage.objects;
create policy "announcement media leader update" on storage.objects for update to authenticated using (
  bucket_id='biblequest-announcements' and (
    private.bible_role_in_congregation((split_part(name,'/',1))::uuid) in ('facilitator','leader','pastor','admin')
    or private.bible_can_review_content((split_part(name,'/',1))::uuid)
  )
) with check (bucket_id='biblequest-announcements');
drop policy if exists "announcement media leader delete" on storage.objects;
create policy "announcement media leader delete" on storage.objects for delete to authenticated using (
  bucket_id='biblequest-announcements' and (
    private.bible_role_in_congregation((split_part(name,'/',1))::uuid) in ('facilitator','leader','pastor','admin')
    or private.bible_can_review_content((split_part(name,'/',1))::uuid)
  )
);
