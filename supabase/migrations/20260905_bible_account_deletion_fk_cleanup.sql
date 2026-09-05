alter table public.bible_shared_sessions alter column created_by drop not null;
alter table public.bible_shared_sessions drop constraint if exists bible_shared_sessions_created_by_fkey;
alter table public.bible_shared_sessions add constraint bible_shared_sessions_created_by_fkey foreign key(created_by) references auth.users(id) on delete set null;

alter table public.bible_teams alter column created_by drop not null;
alter table public.bible_teams drop constraint if exists bible_teams_created_by_fkey;
alter table public.bible_teams add constraint bible_teams_created_by_fkey foreign key(created_by) references auth.users(id) on delete set null;
