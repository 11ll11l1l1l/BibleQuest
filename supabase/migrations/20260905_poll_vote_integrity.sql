-- BibleQuest production hardening: authenticated users may only vote on active polls
-- and only for an option index that actually exists in that poll.
-- Scope is intentionally limited to bible_* objects in the shared Supabase project.

alter table public.bible_poll_votes
  drop constraint if exists bible_poll_votes_option_index_nonnegative;

alter table public.bible_poll_votes
  add constraint bible_poll_votes_option_index_nonnegative
  check (option_index >= 0) not valid;

alter table public.bible_poll_votes
  validate constraint bible_poll_votes_option_index_nonnegative;

drop policy if exists "votes insert own" on public.bible_poll_votes;
create policy "votes insert own"
on public.bible_poll_votes
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.bible_polls p
    where p.id = bible_poll_votes.poll_id
      and p.active = true
      and jsonb_typeof(p.options) = 'array'
      and bible_poll_votes.option_index < jsonb_array_length(p.options)
  )
);

drop policy if exists "votes update own" on public.bible_poll_votes;
create policy "votes update own"
on public.bible_poll_votes
for update
to authenticated
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.bible_polls p
    where p.id = bible_poll_votes.poll_id
      and p.active = true
      and jsonb_typeof(p.options) = 'array'
      and bible_poll_votes.option_index < jsonb_array_length(p.options)
  )
);
