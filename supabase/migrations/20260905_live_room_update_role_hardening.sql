-- Prevent an ordinary member from creating a permitted non-live shared session and then
-- changing its session_type to 'live-room'. Live-room creation and updates must retain
-- the same facilitator/leader/admin boundary.

drop policy if exists "sessions creator update" on public.bible_shared_sessions;

create policy "sessions creator update"
on public.bible_shared_sessions
for update
to authenticated
using (
  (select auth.uid()) = created_by
  and private.is_bible_congregation_member(congregation_id)
)
with check (
  (select auth.uid()) = created_by
  and private.is_bible_congregation_member(congregation_id)
  and (
    session_type <> 'live-room'
    or private.bible_role_in_congregation(congregation_id) = any (array['facilitator'::text,'leader'::text,'admin'::text])
  )
);
