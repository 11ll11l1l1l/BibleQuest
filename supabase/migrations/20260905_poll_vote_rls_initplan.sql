-- BibleQuest production hardening: preserve poll-vote ownership/integrity semantics
-- while evaluating auth.uid() once per statement instead of once per candidate row.
-- Scope is intentionally limited to bible_* objects in the shared Supabase project.

drop policy if exists "votes insert own" on public.bible_poll_votes;
create policy "votes insert own"
on public.bible_poll_votes
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
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
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.bible_polls p
    where p.id = bible_poll_votes.poll_id
      and p.active = true
      and jsonb_typeof(p.options) = 'array'
      and bible_poll_votes.option_index < jsonb_array_length(p.options)
  )
);
