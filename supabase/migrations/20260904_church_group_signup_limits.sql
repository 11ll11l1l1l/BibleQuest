alter table public.bible_profiles
  add column if not exists church_group text;

alter table public.bible_profiles
  drop constraint if exists bible_profiles_church_group_len;
alter table public.bible_profiles
  add constraint bible_profiles_church_group_len
  check (church_group is null or char_length(church_group) <= 120);

create table if not exists public.bible_signup_limits (
  ip_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now(),
  primary key (ip_hash, window_start)
);

alter table public.bible_signup_limits enable row level security;
revoke all on public.bible_signup_limits from anon, authenticated;

create index if not exists bible_signup_limits_updated_idx
  on public.bible_signup_limits (updated_at);
