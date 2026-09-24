-- V6 S2 poll vote integrity hardening.
--
-- Existing vote RLS bounded option_index only on the upper side, so negative
-- indexes could satisfy "option_index < jsonb_array_length(options)". Enforce
-- a non-negative invariant for new/updated rows without validating historical
-- production rows as part of this additive migration.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bible_poll_votes_option_index_nonnegative'
      and conrelid = 'public.bible_poll_votes'::regclass
  ) then
    alter table public.bible_poll_votes
      add constraint bible_poll_votes_option_index_nonnegative
      check (option_index >= 0) not valid;
  end if;
end
$$;

drop policy if exists "votes insert congregation own" on public.bible_poll_votes;
create policy "votes insert congregation own"
on public.bible_poll_votes
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and option_index >= 0
  and exists (
    select 1
    from public.bible_polls p
    where p.id = poll_id
      and p.active = true
      and private.is_bible_congregation_member(p.congregation_id)
      and (p.closes_at is null or p.closes_at > now())
      and jsonb_typeof(p.options) = 'array'
      and option_index < jsonb_array_length(p.options)
  )
);

drop policy if exists "votes update congregation own" on public.bible_poll_votes;
create policy "votes update congregation own"
on public.bible_poll_votes
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and option_index >= 0
  and exists (
    select 1
    from public.bible_polls p
    where p.id = poll_id
      and p.active = true
      and private.is_bible_congregation_member(p.congregation_id)
      and (p.closes_at is null or p.closes_at > now())
      and jsonb_typeof(p.options) = 'array'
      and option_index < jsonb_array_length(p.options)
  )
);
