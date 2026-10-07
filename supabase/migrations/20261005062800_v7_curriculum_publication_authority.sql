-- V7 Lane A P3: canonical curriculum publication authority.
-- Publication is congregation-scoped. Global/null-scoped tracks are intentionally
-- excluded from this authoring boundary until a separate global publication
-- authority is explicitly designed.

create or replace function private.v7_guard_curriculum_publication_state()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  -- Draft authoring remains available through the existing RLS policies, but
  -- authenticated clients may not bypass the atomic publication/withdraw RPCs.
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' and new.publication_state <> 'draft' then
      raise exception 'Use the V7 curriculum publication authority for publication state changes'
        using errcode = '42501';
    end if;
    if tg_op = 'UPDATE' and new.publication_state is distinct from old.publication_state then
      raise exception 'Use the V7 curriculum publication authority for publication state changes'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_curriculum_publication_state() from public, anon;

drop trigger if exists v7_track_publication_authority on public.v7_tracks;
create trigger v7_track_publication_authority
before insert or update on public.v7_tracks
for each row execute function private.v7_guard_curriculum_publication_state();

drop trigger if exists v7_module_publication_authority on public.v7_modules;
create trigger v7_module_publication_authority
before insert or update on public.v7_modules
for each row execute function private.v7_guard_curriculum_publication_state();

drop trigger if exists v7_lesson_publication_authority on public.v7_lessons;
create trigger v7_lesson_publication_authority
before insert or update on public.v7_lessons
for each row execute function private.v7_guard_curriculum_publication_state();

-- Preserve the existing immutable-published-revision contract while closing the
-- direct authenticated draft -> published_at bypass. SECURITY DEFINER publication
-- remains subject to the same seven-step invariant below.
create or replace function private.v7_guard_published_lesson_revision()
returns trigger
language plpgsql
set search_path = ''
as $bq$
declare
  step_count bigint;
begin
  if tg_op = 'DELETE' then
    if old.published_at is not null then
      raise exception 'Published V7 lesson revisions are immutable';
    end if;
    return old;
  end if;

  if tg_op = 'UPDATE' and old.published_at is not null then
    raise exception 'Published V7 lesson revisions are immutable';
  end if;

  if tg_op = 'INSERT' and new.published_at is not null then
    raise exception 'Create a draft lesson revision and publish it after its steps are complete';
  end if;

  if tg_op = 'UPDATE' and old.published_at is null and new.published_at is not null then
    if current_user = 'authenticated' then
      raise exception 'Use the V7 curriculum publication authority to publish lesson revisions'
        using errcode = '42501';
    end if;
    select count(*) into step_count
    from public.v7_lesson_steps s
    where s.lesson_revision_id = new.id;
    if step_count <> 7 then
      raise exception 'A published lesson revision must contain all seven ordered steps';
    end if;
  end if;

  return new;
end;
$bq$;

create or replace function public.bible_v7_publish_curriculum_path(
  p_congregation_id uuid,
  p_track_id uuid,
  p_module_id uuid,
  p_lesson_id uuid,
  p_lesson_revision_id uuid,
  p_expected_track_revision_id uuid,
  p_expected_module_revision_id uuid,
  p_expected_lesson_revision_id uuid,
  p_library_revision_ids uuid[] default '{}'::uuid[]
)
returns table (
  congregation_id uuid,
  track_id uuid,
  module_id uuid,
  lesson_id uuid,
  lesson_revision_id uuid,
  track_publication_state text,
  module_publication_state text,
  lesson_publication_state text,
  published_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  v_actor uuid := (select auth.uid());
  v_track public.v7_tracks%rowtype;
  v_module public.v7_modules%rowtype;
  v_lesson public.v7_lessons%rowtype;
  v_revision public.v7_lesson_revisions%rowtype;
  v_positions smallint[];
  v_step_types text[];
  v_actual_library_ids uuid[] := '{}'::uuid[];
  v_requested_library_ids uuid[] := '{}'::uuid[];
  v_library_count integer := 0;
  v_published_at timestamptz;
begin
  if v_actor is null or p_congregation_id is null then
    raise exception 'Authenticated active-congregation context is required'
      using errcode = '42501';
  end if;

  if not private.bible_can_review_content(p_congregation_id) then
    raise exception 'Not authorized to publish curriculum for this congregation'
      using errcode = '42501';
  end if;

  select t.* into v_track
  from public.v7_tracks t
  where t.id = p_track_id
    and t.congregation_id = p_congregation_id
  for update;
  if not found then
    raise exception 'Curriculum track is not available in the active congregation'
      using errcode = '42501';
  end if;

  if v_track.revision_id is distinct from p_expected_track_revision_id then
    raise exception 'Curriculum track is stale; reload before publishing'
      using errcode = '40001';
  end if;

  select m.* into v_module
  from public.v7_modules m
  where m.id = p_module_id
    and m.track_id = v_track.id
  for update;
  if not found then
    raise exception 'Curriculum module does not belong to the selected track'
      using errcode = '22023';
  end if;

  if v_module.revision_id is distinct from p_expected_module_revision_id then
    raise exception 'Curriculum module is stale; reload before publishing'
      using errcode = '40001';
  end if;

  select l.* into v_lesson
  from public.v7_lessons l
  where l.id = p_lesson_id
    and l.module_id = v_module.id
  for update;
  if not found then
    raise exception 'Curriculum lesson does not belong to the selected module'
      using errcode = '22023';
  end if;

  if v_lesson.revision_id is distinct from p_expected_lesson_revision_id then
    raise exception 'Curriculum lesson is stale; reload before publishing'
      using errcode = '40001';
  end if;

  select r.* into v_revision
  from public.v7_lesson_revisions r
  where r.id = p_lesson_revision_id
    and r.lesson_id = v_lesson.id
  for update;
  if not found then
    raise exception 'Lesson revision does not belong to the selected lesson'
      using errcode = '22023';
  end if;

  -- Exact retry of a completed publication is safe and returns the canonical
  -- committed identity without changing timestamps or content.
  if v_track.publication_state = 'published'
     and v_module.publication_state = 'published'
     and v_lesson.publication_state = 'published'
     and v_revision.published_at is not null then
    return query
    select p_congregation_id, v_track.id, v_module.id, v_lesson.id, v_revision.id,
           v_track.publication_state, v_module.publication_state,
           v_lesson.publication_state, v_revision.published_at;
    return;
  end if;

  if v_track.publication_state <> 'draft'
     or v_module.publication_state <> 'draft'
     or v_lesson.publication_state <> 'draft'
     or v_revision.published_at is not null then
    raise exception 'Curriculum hierarchy changed while publication was being prepared'
      using errcode = '40001';
  end if;

  -- Lock the full revision body so an editor cannot alter/delete a step between
  -- readiness validation and the publication commit.
  perform 1
  from public.v7_lesson_steps s
  where s.lesson_revision_id = v_revision.id
  for update;

  select
    coalesce(array_agg(s.position order by s.position), '{}'::smallint[]),
    coalesce(array_agg(s.step_type order by s.position), '{}'::text[]),
    coalesce(
      array_agg(distinct s.library_revision_id order by s.library_revision_id)
        filter (where s.library_revision_id is not null),
      '{}'::uuid[]
    )
  into v_positions, v_step_types, v_actual_library_ids
  from public.v7_lesson_steps s
  where s.lesson_revision_id = v_revision.id;

  if v_positions is distinct from array[0,1,2,3,4,5,6]::smallint[]
     or v_step_types is distinct from array['scripture','understand','discuss','reflect','apply','pray','action']::text[] then
    raise exception 'A curriculum lesson must contain exactly the seven canonical ordered steps'
      using errcode = '22023';
  end if;

  select coalesce(array_agg(distinct requested_id order by requested_id), '{}'::uuid[])
  into v_requested_library_ids
  from unnest(coalesce(p_library_revision_ids, '{}'::uuid[])) as requested(requested_id);

  if v_actual_library_ids is distinct from v_requested_library_ids then
    raise exception 'Curriculum Library references are stale; reload before publishing'
      using errcode = '40001';
  end if;

  if cardinality(v_actual_library_ids) > 0 then
    -- Lock both the immutable revision and its mutable Library item pointer/state
    -- so the readability decision cannot change until this transaction commits.
    perform 1
    from public.v7_library_revisions lr
    join public.v7_library_items i on i.id = lr.item_id
    where lr.id = any(v_actual_library_ids)
    for update of lr, i;

    select count(*) into v_library_count
    from public.v7_library_revisions lr
    join public.v7_library_items i on i.id = lr.item_id
    where lr.id = any(v_actual_library_ids)
      and lr.publication_state = 'published'
      and lr.review_status = 'approved'
      and lr.rights_status = 'verified'
      and lr.source_kind <> 'fixture'
      and i.current_revision_id = lr.id
      and i.publication_state = 'published'
      and (i.congregation_id is null or i.congregation_id = p_congregation_id);

    if v_library_count <> cardinality(v_actual_library_ids) then
      raise exception 'A referenced Library revision is not currently publishable in this congregation'
        using errcode = '22023';
    end if;
  end if;

  v_published_at := clock_timestamp();

  update public.v7_lesson_revisions r
  set published_at = v_published_at
  where r.id = v_revision.id;

  update public.v7_lessons l
  set publication_state = 'published'
  where l.id = v_lesson.id;

  update public.v7_modules m
  set publication_state = 'published'
  where m.id = v_module.id;

  update public.v7_tracks t
  set publication_state = 'published', updated_at = v_published_at
  where t.id = v_track.id;

  return query
  select p_congregation_id, v_track.id, v_module.id, v_lesson.id, v_revision.id,
         'published'::text, 'published'::text, 'published'::text, v_published_at;
end;
$bq$;

revoke all on function public.bible_v7_publish_curriculum_path(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid[]) from public, anon;
grant execute on function public.bible_v7_publish_curriculum_path(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid[]) to authenticated;

-- Withdrawal is deliberately lesson-level, not hierarchy-level. Withdrawing one
-- lesson must not hide sibling lessons/modules/tracks. The immutable published
-- revision, its steps, and historical assignment references remain untouched.
create or replace function public.bible_v7_withdraw_curriculum_lesson(
  p_congregation_id uuid,
  p_track_id uuid,
  p_module_id uuid,
  p_lesson_id uuid,
  p_lesson_revision_id uuid,
  p_expected_track_revision_id uuid,
  p_expected_module_revision_id uuid,
  p_expected_lesson_revision_id uuid
)
returns table (
  congregation_id uuid,
  track_id uuid,
  module_id uuid,
  lesson_id uuid,
  lesson_revision_id uuid,
  track_publication_state text,
  module_publication_state text,
  lesson_publication_state text,
  published_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $bq$
declare
  v_actor uuid := (select auth.uid());
  v_track public.v7_tracks%rowtype;
  v_module public.v7_modules%rowtype;
  v_lesson public.v7_lessons%rowtype;
  v_revision public.v7_lesson_revisions%rowtype;
begin
  if v_actor is null or p_congregation_id is null then
    raise exception 'Authenticated active-congregation context is required'
      using errcode = '42501';
  end if;

  if not private.bible_can_review_content(p_congregation_id) then
    raise exception 'Not authorized to withdraw curriculum for this congregation'
      using errcode = '42501';
  end if;

  select t.* into v_track
  from public.v7_tracks t
  where t.id = p_track_id and t.congregation_id = p_congregation_id
  for update;
  if not found then
    raise exception 'Curriculum track is not available in the active congregation'
      using errcode = '42501';
  end if;

  select m.* into v_module
  from public.v7_modules m
  where m.id = p_module_id and m.track_id = v_track.id
  for update;
  if not found then
    raise exception 'Curriculum module does not belong to the selected track'
      using errcode = '22023';
  end if;

  select l.* into v_lesson
  from public.v7_lessons l
  where l.id = p_lesson_id and l.module_id = v_module.id
  for update;
  if not found then
    raise exception 'Curriculum lesson does not belong to the selected module'
      using errcode = '22023';
  end if;

  select r.* into v_revision
  from public.v7_lesson_revisions r
  where r.id = p_lesson_revision_id and r.lesson_id = v_lesson.id
  for update;
  if not found then
    raise exception 'Lesson revision does not belong to the selected lesson'
      using errcode = '22023';
  end if;

  if v_track.revision_id is distinct from p_expected_track_revision_id
     or v_module.revision_id is distinct from p_expected_module_revision_id
     or v_lesson.revision_id is distinct from p_expected_lesson_revision_id then
    raise exception 'Curriculum hierarchy is stale; reload before withdrawal'
      using errcode = '40001';
  end if;

  if v_track.publication_state <> 'published'
     or v_module.publication_state <> 'published'
     or v_revision.published_at is null then
    raise exception 'Only a published curriculum lesson can be withdrawn'
      using errcode = '40001';
  end if;

  if v_lesson.publication_state = 'withdrawn' then
    return query
    select p_congregation_id, v_track.id, v_module.id, v_lesson.id, v_revision.id,
           v_track.publication_state, v_module.publication_state,
           v_lesson.publication_state, v_revision.published_at;
    return;
  end if;

  if v_lesson.publication_state <> 'published' then
    raise exception 'Curriculum lesson changed while withdrawal was being prepared'
      using errcode = '40001';
  end if;

  update public.v7_lessons l
  set publication_state = 'withdrawn'
  where l.id = v_lesson.id;

  return query
  select p_congregation_id, v_track.id, v_module.id, v_lesson.id, v_revision.id,
         v_track.publication_state, v_module.publication_state,
         'withdrawn'::text, v_revision.published_at;
end;
$bq$;

revoke all on function public.bible_v7_withdraw_curriculum_lesson(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid) from public, anon;
grant execute on function public.bible_v7_withdraw_curriculum_lesson(uuid,uuid,uuid,uuid,uuid,uuid,uuid,uuid) to authenticated;
