-- V7 Lane A P3: race-safe ONE 2 ONE assignment creation authority.
-- v7_pair_assignments remains the canonical V7 assignment lifecycle store.

create unique index if not exists v7_pair_assignments_one_active_revision_idx
  on public.v7_pair_assignments(pair_id, lesson_revision_id)
  where status <> 'cancelled';

-- Assignment creation must pass through the transaction boundary below. Existing
-- status/update semantics remain RLS-controlled; only direct authenticated INSERT
-- is removed so clients cannot reintroduce query-then-insert races.
drop policy if exists "v7 pair mentor assignment insert" on public.v7_pair_assignments;
revoke insert on public.v7_pair_assignments from authenticated;

create or replace function public.bible_v7_create_pair_assignment(
  p_pair_id uuid,
  p_track_id uuid,
  p_module_id uuid,
  p_lesson_id uuid,
  p_lesson_revision_id uuid
)
returns table (
  id uuid,
  status text,
  "pairId" uuid,
  "trackId" uuid,
  "moduleId" uuid,
  "lessonId" uuid,
  "lessonRevisionId" uuid
)
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  v_actor uuid := (select auth.uid());
  v_pair record;
  v_path record;
  v_assignment record;
begin
  if v_actor is null then
    raise exception using errcode='42501', message='Authentication is required to create a ONE 2 ONE assignment.';
  end if;

  select p.id, p.congregation_id, p.mentor_id, p.mentee_id, p.state
    into v_pair
  from public.v7_mentor_pairs p
  where p.id = p_pair_id
  for update;

  if not found then
    raise exception using errcode='22023', message='The requested ONE 2 ONE pair does not exist.';
  end if;
  if v_pair.mentor_id <> v_actor then
    raise exception using errcode='42501', message='Only the active pair mentor can create an assignment.';
  end if;
  if v_pair.state <> 'active' then
    raise exception using errcode='55000', message='Assignments require an active ONE 2 ONE pair.';
  end if;

  select
    t.id as track_id,
    t.congregation_id as track_congregation_id,
    t.publication_state as track_state,
    m.id as module_id,
    m.publication_state as module_state,
    l.id as lesson_id,
    l.publication_state as lesson_state,
    r.id as lesson_revision_id,
    r.published_at
    into v_path
  from public.v7_lesson_revisions r
  join public.v7_lessons l on l.id = r.lesson_id
  join public.v7_modules m on m.id = l.module_id
  join public.v7_tracks t on t.id = m.track_id
  where r.id = p_lesson_revision_id
    and l.id = p_lesson_id
    and m.id = p_module_id
    and t.id = p_track_id
  for share of t, m, l, r;

  if not found then
    raise exception using errcode='22023', message='The assignment request contains a stale or mismatched curriculum path.';
  end if;
  if v_path.track_congregation_id is not null
     and v_path.track_congregation_id <> v_pair.congregation_id then
    raise exception using errcode='42501', message='The requested curriculum belongs to another congregation.';
  end if;
  if v_path.track_state <> 'published'
     or v_path.module_state <> 'published'
     or v_path.lesson_state <> 'published'
     or v_path.published_at is null then
    raise exception using errcode='55000', message='Assignments require an exact published curriculum path and lesson revision.';
  end if;

  select a.id, a.status
    into v_assignment
  from public.v7_pair_assignments a
  where a.pair_id = p_pair_id
    and a.lesson_revision_id = p_lesson_revision_id
    and a.status <> 'cancelled'
  order by a.created_at, a.id
  limit 1;

  if found then
    return query select
      v_assignment.id,
      v_assignment.status,
      p_pair_id,
      p_track_id,
      p_module_id,
      p_lesson_id,
      p_lesson_revision_id;
    return;
  end if;

  begin
    insert into public.v7_pair_assignments(pair_id, lesson_revision_id, assigned_by, status)
    values (p_pair_id, p_lesson_revision_id, v_actor, 'assigned')
    returning v7_pair_assignments.id, v7_pair_assignments.status
      into v_assignment;
  exception when unique_violation then
    -- The pair row lock serializes normal RPC callers. The unique index remains a
    -- database-level race barrier against any concurrent privileged writer.
    select a.id, a.status
      into v_assignment
    from public.v7_pair_assignments a
    where a.pair_id = p_pair_id
      and a.lesson_revision_id = p_lesson_revision_id
      and a.status <> 'cancelled'
    order by a.created_at, a.id
    limit 1;
    if not found then
      raise;
    end if;
  end;

  if not exists (
    select 1 from public.v7_pair_events e
    where e.pair_id = p_pair_id
      and e.event_type = 'assignment_created'
      and e.metadata ->> 'assignment_id' = v_assignment.id::text
  ) then
    insert into public.v7_pair_events(pair_id, actor_id, event_type, metadata)
    values (
      p_pair_id,
      v_actor,
      'assignment_created',
      jsonb_build_object(
        'assignment_id', v_assignment.id,
        'track_id', p_track_id,
        'module_id', p_module_id,
        'lesson_id', p_lesson_id,
        'lesson_revision_id', p_lesson_revision_id
      )
    );
  end if;

  return query select
    v_assignment.id,
    v_assignment.status,
    p_pair_id,
    p_track_id,
    p_module_id,
    p_lesson_id,
    p_lesson_revision_id;
end;
$bq$;

revoke all on function public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid) from public, anon;
grant execute on function public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid) to authenticated;
