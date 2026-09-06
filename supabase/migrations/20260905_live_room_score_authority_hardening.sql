-- Keep Live Room scoring authority out of the browser.
-- Browser members may submit/update their response payloads, but may not write score fields
-- or move an existing response to a different session/user/round. Participant join upserts
-- remain compatible while browser attempts to alter team/participation score fields are ignored.

revoke insert, update on table public.bible_room_responses from authenticated;
grant insert (session_id, user_id, round_no, response, updated_at)
  on table public.bible_room_responses to authenticated;
grant update (session_id, user_id, round_no, response, updated_at)
  on table public.bible_room_responses to authenticated;

create or replace function public.bible_guard_room_response_browser_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.points := 0;
    else
      if new.session_id is distinct from old.session_id
         or new.user_id is distinct from old.user_id
         or new.round_no is distinct from old.round_no then
        raise exception 'Live Room response identity fields are immutable';
      end if;
      new.points := old.points;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.bible_guard_room_response_browser_mutation() from public, anon, authenticated;

drop trigger if exists bible_guard_room_response_browser_mutation on public.bible_room_responses;
create trigger bible_guard_room_response_browser_mutation
before insert or update on public.bible_room_responses
for each row execute function public.bible_guard_room_response_browser_mutation();

create or replace function public.bible_guard_participant_browser_mutation()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.role() = 'authenticated' then
    if tg_op = 'INSERT' then
      new.participation_points := 0;
      new.team_id := null;
    else
      if new.session_id is distinct from old.session_id
         or new.user_id is distinct from old.user_id then
        raise exception 'Live Room participant identity fields are immutable';
      end if;
      new.team_id := old.team_id;
      new.participation_points := old.participation_points;
      new.created_at := old.created_at;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.bible_guard_participant_browser_mutation() from public, anon, authenticated;

drop trigger if exists bible_guard_participant_browser_mutation on public.bible_session_participants;
create trigger bible_guard_participant_browser_mutation
before insert or update on public.bible_session_participants
for each row execute function public.bible_guard_participant_browser_mutation();
