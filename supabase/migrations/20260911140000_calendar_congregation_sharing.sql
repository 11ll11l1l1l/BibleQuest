-- Calendar v1.5: congregation-shared calendar entries (leader-authored,
-- member-readable) plus a simple weekly-recurrence field and a member
-- notification on creation. Personal events (congregation_id null) are
-- unchanged from v1 and keep their own-row-only RLS.

alter table public.bible_calendar_events
  add column if not exists congregation_id uuid references public.bible_congregations(id) on delete cascade,
  add column if not exists recurrence_weeks integer not null default 0;
alter table public.bible_calendar_events
  add constraint bible_calendar_events_recurrence_weeks_check check (recurrence_weeks >= 0 and recurrence_weeks <= 52);
create index if not exists bible_calendar_events_congregation_date_idx on public.bible_calendar_events(congregation_id, event_date) where congregation_id is not null;

-- Congregation members may read congregation-shared events (personal events
-- remain covered only by the existing own-row select policy).
drop policy if exists "calendar events congregation read" on public.bible_calendar_events;
create policy "calendar events congregation read" on public.bible_calendar_events for select to authenticated
using (congregation_id is not null and private.is_bible_congregation_member(congregation_id));

-- Only a ministry role may create a congregation-shared event; personal
-- events (congregation_id null) keep using the existing self-insert policy.
drop policy if exists "calendar events leader insert" on public.bible_calendar_events;
create policy "calendar events leader insert" on public.bible_calendar_events for insert to authenticated
with check (
  user_id = (select auth.uid())
  and congregation_id is not null
  and private.bible_role_in_congregation(congregation_id) = any(array['facilitator','leader','pastor','admin'])
);

-- Only the creating leader may update/delete their own congregation event
-- (existing self-update/self-delete policies already scope by user_id, so
-- no separate policy is needed here).

-- Notify active congregation members (excluding the creator) when a
-- congregation-shared event is created. Personal events never notify.
create or replace function private.bible_calendar_event_notify()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.congregation_id is not null then
    insert into public.bible_notifications(user_id, congregation_id, created_by, notification_type, title, body, action_kind, action_payload)
    select m.user_id, new.congregation_id, new.user_id, 'calendar_event',
           'New congregation event: '||new.title,
           to_char(new.event_date, 'YYYY-MM-DD'),
           'navigate', jsonb_build_object('route','calendar')
    from public.bible_congregation_members m
    where m.congregation_id = new.congregation_id and m.active and m.user_id <> new.user_id;
  end if;
  return new;
end;
$$;
revoke all on function private.bible_calendar_event_notify() from public;

drop trigger if exists bible_calendar_event_notify_trigger on public.bible_calendar_events;
create trigger bible_calendar_event_notify_trigger
  after insert on public.bible_calendar_events
  for each row execute function private.bible_calendar_event_notify();
