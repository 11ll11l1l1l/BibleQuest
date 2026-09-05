-- Harden self-service community writes so foreign-key reassignment cannot cross
-- congregation boundaries through the authenticated Data API.

-- Challenge progress updates must remain attached to a challenge in a
-- congregation the caller currently belongs to.
drop policy if exists "challenge progress self update" on public.bible_challenge_progress;
create policy "challenge progress self update"
on public.bible_challenge_progress
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.bible_challenges c
    where c.id = bible_challenge_progress.challenge_id
      and private.is_bible_congregation_member(c.congregation_id)
  )
);

-- Session participation must stay inside the destination session's congregation.
-- If a team is supplied, it must belong to that same congregation.
drop policy if exists "participants self insert" on public.bible_session_participants;
create policy "participants self insert"
on public.bible_session_participants
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.bible_shared_sessions s
    where s.id = bible_session_participants.session_id
      and private.is_bible_congregation_member(s.congregation_id)
      and (
        bible_session_participants.team_id is null
        or exists (
          select 1
          from public.bible_teams t
          where t.id = bible_session_participants.team_id
            and t.congregation_id = s.congregation_id
        )
      )
  )
);

drop policy if exists "participants self update" on public.bible_session_participants;
create policy "participants self update"
on public.bible_session_participants
for update
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.bible_shared_sessions s
    where s.id = bible_session_participants.session_id
      and private.is_bible_congregation_member(s.congregation_id)
      and (
        bible_session_participants.team_id is null
        or exists (
          select 1
          from public.bible_teams t
          where t.id = bible_session_participants.team_id
            and t.congregation_id = s.congregation_id
        )
      )
  )
);
