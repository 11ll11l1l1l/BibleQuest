-- V6 S2 Live Room stale-tenant response hardening.
--
-- Room responses are user-owned writes, but ownership alone must not preserve
-- write authority after congregation membership is removed. Re-prove active
-- membership in the response session's congregation for both the existing row
-- and the post-update row.

drop policy if exists "room responses self update" on public.bible_room_responses;

create policy "room responses self update"
on public.bible_room_responses
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.bible_shared_sessions s
    where s.id = bible_room_responses.session_id
      and private.is_bible_congregation_member(s.congregation_id)
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.bible_shared_sessions s
    where s.id = bible_room_responses.session_id
      and private.is_bible_congregation_member(s.congregation_id)
  )
);
