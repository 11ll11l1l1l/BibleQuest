-- BibleQuest V7 P3-A: secure ONE 2 ONE pair lifecycle.
-- Pair rows stay non-updatable by authenticated clients. All lifecycle mutation
-- is serialized through one authenticated SECURITY DEFINER function that
-- re-checks participant identity and congregation membership before writing.

create or replace function private.v7_guard_mentor_pair_invite()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  if new.state <> 'invited'
     or new.mentor_accepted_at is not null
     or new.mentee_accepted_at is not null
     or new.ended_at is not null then
    raise exception 'A V7 mentor pair must begin as a clean invitation';
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_mentor_pair_invite() from public, anon, authenticated;

drop trigger if exists v7_mentor_pair_invite_guard on public.v7_mentor_pairs;
create trigger v7_mentor_pair_invite_guard
before insert on public.v7_mentor_pairs
for each row execute function private.v7_guard_mentor_pair_invite();

create or replace function private.v7_guard_mentor_pair_state()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  if new.state = 'active' and (new.mentor_accepted_at is null or new.mentee_accepted_at is null or new.ended_at is not null) then
    raise exception 'An active V7 mentor pair requires both acceptances and no end timestamp';
  end if;
  if new.state = 'suspended' and (new.mentor_accepted_at is null or new.mentee_accepted_at is null or new.ended_at is not null) then
    raise exception 'A suspended V7 mentor pair must have been mutually accepted and remain open';
  end if;
  if new.state in ('declined','ended') and new.ended_at is null then
    raise exception 'A closed V7 mentor pair requires an end timestamp';
  end if;
  if new.state = 'invited' and new.ended_at is not null then
    raise exception 'An invited V7 mentor pair cannot be ended';
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_mentor_pair_state() from public, anon, authenticated;

drop trigger if exists v7_mentor_pair_state_guard on public.v7_mentor_pairs;
create trigger v7_mentor_pair_state_guard
before update on public.v7_mentor_pairs
for each row execute function private.v7_guard_mentor_pair_state();

create or replace function private.v7_audit_mentor_pair_invite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $bq$
begin
  insert into public.v7_pair_events(pair_id, actor_id, event_type, metadata)
  values (new.id, new.initiated_by, 'invited', pg_catalog.jsonb_build_object('congregation_id', new.congregation_id));
  return new;
end;
$bq$;

revoke all on function private.v7_audit_mentor_pair_invite() from public, anon, authenticated;

drop trigger if exists v7_mentor_pair_invite_audit on public.v7_mentor_pairs;
create trigger v7_mentor_pair_invite_audit
after insert on public.v7_mentor_pairs
for each row execute function private.v7_audit_mentor_pair_invite();

create or replace function public.bible_v7_transition_mentor_pair(
  p_pair_id uuid,
  p_action text
)
returns public.v7_mentor_pairs
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  v_actor uuid := auth.uid();
  v_action text := pg_catalog.lower(pg_catalog.btrim(coalesce(p_action, '')));
  v_pair public.v7_mentor_pairs%rowtype;
  v_role text;
  v_now timestamptz := pg_catalog.now();
  v_activated boolean := false;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required to change a V7 mentor pair';
  end if;
  if p_pair_id is null then
    raise exception 'A V7 mentor pair id is required';
  end if;

  select p.* into v_pair
  from public.v7_mentor_pairs p
  where p.id = p_pair_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'V7 mentor pair was not found';
  end if;

  if v_actor = v_pair.mentor_id then
    v_role := 'mentor';
  elsif v_actor = v_pair.mentee_id then
    v_role := 'mentee';
  else
    raise exception using errcode = '42501', message = 'Only pair participants can change a V7 mentor pair';
  end if;

  if not exists (
    select 1
    from public.bible_congregation_members m
    where m.congregation_id = v_pair.congregation_id
      and m.user_id = v_actor
      and m.active
  ) then
    raise exception using errcode = '42501', message = 'Active congregation membership is required to change a V7 mentor pair';
  end if;

  if v_action = 'accept' then
    -- Safe retries do not create duplicate acceptance events.
    if v_pair.state = 'active'
       and ((v_role = 'mentor' and v_pair.mentor_accepted_at is not null)
         or (v_role = 'mentee' and v_pair.mentee_accepted_at is not null)) then
      return v_pair;
    end if;
    if v_pair.state <> 'invited' then
      raise exception 'Only an invited V7 mentor pair can be accepted';
    end if;

    -- Activation is allowed only while both named participants are active in
    -- the same congregation. This is checked again at transition time rather
    -- than relying on invitation-time membership.
    if not exists (
      select 1 from public.bible_congregation_members m
      where m.congregation_id = v_pair.congregation_id and m.user_id = v_pair.mentor_id and m.active
    ) or not exists (
      select 1 from public.bible_congregation_members m
      where m.congregation_id = v_pair.congregation_id and m.user_id = v_pair.mentee_id and m.active
    ) then
      raise exception using errcode = '42501', message = 'Both pair participants must remain active congregation members';
    end if;

    if v_role = 'mentor' and v_pair.mentor_accepted_at is not null then
      return v_pair;
    end if;
    if v_role = 'mentee' and v_pair.mentee_accepted_at is not null then
      return v_pair;
    end if;

    update public.v7_mentor_pairs p
    set mentor_accepted_at = case when v_role = 'mentor' then v_now else p.mentor_accepted_at end,
        mentee_accepted_at = case when v_role = 'mentee' then v_now else p.mentee_accepted_at end,
        updated_at = v_now
    where p.id = v_pair.id
    returning p.* into v_pair;

    if v_pair.mentor_accepted_at is not null and v_pair.mentee_accepted_at is not null then
      update public.v7_mentor_pairs p
      set state = 'active', updated_at = v_now
      where p.id = v_pair.id
      returning p.* into v_pair;
      v_activated := true;
    end if;

    insert into public.v7_pair_events(pair_id, actor_id, event_type, metadata)
    values (v_pair.id, v_actor, 'accepted', pg_catalog.jsonb_build_object('role', v_role, 'activated', v_activated));

  elsif v_action = 'decline' then
    if v_pair.state = 'declined' then
      return v_pair;
    end if;
    if v_pair.state <> 'invited' then
      raise exception 'Only an invited V7 mentor pair can be declined';
    end if;

    update public.v7_mentor_pairs p
    set state = 'declined', ended_at = v_now, updated_at = v_now
    where p.id = v_pair.id
    returning p.* into v_pair;

    insert into public.v7_pair_events(pair_id, actor_id, event_type, metadata)
    values (v_pair.id, v_actor, 'declined', pg_catalog.jsonb_build_object('role', v_role));

  elsif v_action = 'end' then
    if v_pair.state = 'ended' then
      return v_pair;
    end if;
    if v_pair.state not in ('active','suspended') then
      raise exception 'Only an active or suspended V7 mentor pair can be ended';
    end if;

    update public.v7_mentor_pairs p
    set state = 'ended', ended_at = v_now, updated_at = v_now
    where p.id = v_pair.id
    returning p.* into v_pair;

    insert into public.v7_pair_events(pair_id, actor_id, event_type, metadata)
    values (v_pair.id, v_actor, 'ended', pg_catalog.jsonb_build_object('role', v_role));

  else
    raise exception 'Unsupported V7 mentor pair action';
  end if;

  return v_pair;
end;
$bq$;

revoke all on function public.bible_v7_transition_mentor_pair(uuid,text) from public, anon;
grant execute on function public.bible_v7_transition_mentor_pair(uuid,text) to authenticated;

-- Preserve the fail-closed table boundary established by the foundation:
-- authenticated clients may create/read pair invitations, but cannot update
-- pair rows or append audit events directly.
revoke update on public.v7_mentor_pairs from authenticated;
revoke insert, update, delete on public.v7_pair_events from authenticated;
