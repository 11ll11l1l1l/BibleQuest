-- BibleQuest V7 Lane C: authoritative race-safe ONE 2 ONE assignment creation.
--
-- v7_pair_assignments remains the single V7 assignment lifecycle authority.
-- Authenticated clients may not insert assignment rows directly. Creation is
-- serialized with pair lifecycle transitions, revalidates the exact published
-- curriculum ancestry and congregation membership, and is idempotent for one
-- non-cancelled assignment per pair + immutable lesson revision.

create unique index if not exists v7_pair_assignments_one_live_revision_idx
  on public.v7_pair_assignments(pair_id, lesson_revision_id)
  where status <> 'cancelled';

-- Retire the former direct-table creation authority. Reads and bounded mentor
-- updates remain governed by their existing RLS policies.
drop policy if exists "v7 pair mentor assignment insert" on public.v7_pair_assignments;
revoke insert on public.v7_pair_assignments from authenticated;

create or replace function public.bible_v7_create_pair_assignment(
  p_pair_id uuid,
  p_track_id uuid,
  p_module_id uuid,
  p_lesson_id uuid,
  p_lesson_revision_id uuid
)
returns table(assignment_id uuid, assignment_status text)
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  v_actor uuid := auth.uid();
  v_pair public.v7_mentor_pairs%rowtype;
  v_assignment public.v7_pair_assignments%rowtype;
  v_created boolean := false;
begin
  if v_actor is null then
    raise exception using errcode = '42501', message = 'Authentication is required to create a V7 assignment';
  end if;
  if p_pair_id is null or p_track_id is null or p_module_id is null
     or p_lesson_id is null or p_lesson_revision_id is null then
    raise exception 'A complete V7 assignment path is required';
  end if;

  -- Pair lifecycle transitions use FOR UPDATE on this same row. Taking the same
  -- lock prevents an assignment from racing with decline/end while authority is
  -- being checked.
  select p.* into v_pair
  from public.v7_mentor_pairs p
  where p.id = p_pair_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'V7 mentor pair was not found';
  end if;
  if v_pair.state <> 'active' or v_pair.mentor_id <> v_actor then
    raise exception using errcode = '42501', message = 'Only the active pair mentor can create a V7 assignment';
  end if;

  -- Lock both current membership rows while the assignment is created. An
  -- active pair alone is not sufficient if congregation membership changed
  -- after pair activation.
  perform 1
  from public.bible_congregation_members m
  where m.congregation_id = v_pair.congregation_id
    and m.user_id = v_pair.mentor_id
    and m.active
  for share;
  if not found then
    raise exception using errcode = '42501', message = 'The mentor must remain an active congregation member';
  end if;

  perform 1
  from public.bible_congregation_members m
  where m.congregation_id = v_pair.congregation_id
    and m.user_id = v_pair.mentee_id
    and m.active
  for share;
  if not found then
    raise exception using errcode = '42501', message = 'The mentee must remain an active congregation member';
  end if;

  -- Validate and lock the exact immutable request emitted by Lane B. The
  -- ancestry must still be published and either global or scoped to the pair's
  -- congregation at mutation time; client-side preparation is not authority.
  perform 1
  from public.v7_tracks t
  join public.v7_modules m on m.track_id = t.id
  join public.v7_lessons l on l.module_id = m.id
  join public.v7_lesson_revisions r on r.lesson_id = l.id
  where t.id = p_track_id
    and m.id = p_module_id
    and l.id = p_lesson_id
    and r.id = p_lesson_revision_id
    and t.publication_state = 'published'
    and m.publication_state = 'published'
    and l.publication_state = 'published'
    and r.published_at is not null
    and (t.congregation_id is null or t.congregation_id = v_pair.congregation_id)
  for share of t, m, l, r;

  if not found then
    raise exception using errcode = 'P0001', message = 'The requested published V7 lesson revision is unavailable in this pair congregation';
  end if;

  insert into public.v7_pair_assignments(pair_id, lesson_revision_id, assigned_by, status)
  values (v_pair.id, p_lesson_revision_id, v_actor, 'assigned')
  on conflict (pair_id, lesson_revision_id) where status <> 'cancelled'
  do nothing
  returning * into v_assignment;

  v_created := found;
  if not v_created then
    select a.* into v_assignment
    from public.v7_pair_assignments a
    where a.pair_id = v_pair.id
      and a.lesson_revision_id = p_lesson_revision_id
      and a.status <> 'cancelled';

    if not found then
      -- The partial unique index plus pair lock should make this unreachable.
      -- Fail closed rather than manufacturing a second assignment identity.
      raise exception using errcode = '40001', message = 'V7 assignment creation conflicted; retry the same request';
    end if;
  else
    insert into public.v7_pair_events(pair_id, actor_id, event_type, metadata)
    values (
      v_pair.id,
      v_actor,
      'assignment_created',
      pg_catalog.jsonb_build_object(
        'assignment_id', v_assignment.id,
        'track_id', p_track_id,
        'module_id', p_module_id,
        'lesson_id', p_lesson_id,
        'lesson_revision_id', p_lesson_revision_id
      )
    );
  end if;

  return query select v_assignment.id, v_assignment.status;
end;
$bq$;

revoke all on function public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid) from public, anon, authenticated;
grant execute on function public.bible_v7_create_pair_assignment(uuid,uuid,uuid,uuid,uuid) to authenticated;
