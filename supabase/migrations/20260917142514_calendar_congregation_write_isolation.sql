-- Gate C hardening: prevent authenticated users from creating or moving
-- self-owned calendar rows into congregations they do not belong to.
--
-- Personal events remain owner-only and must keep congregation_id NULL.
-- Congregation-shared events remain creator-owned, but insert/update/delete
-- additionally require a current ministry role in that congregation.

-- Personal-event policies must never authorize congregation-scoped rows.
drop policy if exists "calendar events self select" on public.bible_calendar_events;
create policy "calendar events self select"
on public.bible_calendar_events
for select
to authenticated
using (
  user_id = (select auth.uid())
  and congregation_id is null
);

drop policy if exists "calendar events self insert" on public.bible_calendar_events;
create policy "calendar events self insert"
on public.bible_calendar_events
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and congregation_id is null
);

drop policy if exists "calendar events self update" on public.bible_calendar_events;
create policy "calendar events self update"
on public.bible_calendar_events
for update
to authenticated
using (
  user_id = (select auth.uid())
  and congregation_id is null
)
with check (
  user_id = (select auth.uid())
  and congregation_id is null
);

drop policy if exists "calendar events self delete" on public.bible_calendar_events;
create policy "calendar events self delete"
on public.bible_calendar_events
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and congregation_id is null
);

-- Congregation events require creator ownership plus a current ministry role.
drop policy if exists "calendar events leader update" on public.bible_calendar_events;
create policy "calendar events leader update"
on public.bible_calendar_events
for update
to authenticated
using (
  user_id = (select auth.uid())
  and congregation_id is not null
  and private.bible_role_in_congregation(congregation_id)
      = any(array['facilitator','leader','pastor','admin'])
)
with check (
  user_id = (select auth.uid())
  and congregation_id is not null
  and private.bible_role_in_congregation(congregation_id)
      = any(array['facilitator','leader','pastor','admin'])
);

drop policy if exists "calendar events leader delete" on public.bible_calendar_events;
create policy "calendar events leader delete"
on public.bible_calendar_events
for delete
to authenticated
using (
  user_id = (select auth.uid())
  and congregation_id is not null
  and private.bible_role_in_congregation(congregation_id)
      = any(array['facilitator','leader','pastor','admin'])
);
