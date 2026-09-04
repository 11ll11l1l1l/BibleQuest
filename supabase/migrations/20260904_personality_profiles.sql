create table if not exists public.bible_personality_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  assessment_version text not null default 'ipip_big_five_50_v1',
  result jsonb not null,
  presentation_profile jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bible_personality_profiles enable row level security;

revoke all on table public.bible_personality_profiles from anon, authenticated;
grant select, insert, update, delete on table public.bible_personality_profiles to authenticated;

drop policy if exists "bible_personality_select_own" on public.bible_personality_profiles;
create policy "bible_personality_select_own"
on public.bible_personality_profiles for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "bible_personality_insert_own" on public.bible_personality_profiles;
create policy "bible_personality_insert_own"
on public.bible_personality_profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "bible_personality_update_own" on public.bible_personality_profiles;
create policy "bible_personality_update_own"
on public.bible_personality_profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "bible_personality_delete_own" on public.bible_personality_profiles;
create policy "bible_personality_delete_own"
on public.bible_personality_profiles for delete
to authenticated
using ((select auth.uid()) = user_id);

create index if not exists bible_personality_profiles_updated_idx
on public.bible_personality_profiles(updated_at desc);
