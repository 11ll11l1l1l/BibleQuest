-- BibleQuest V7 Lane C P4: preserve ONE 2 ONE authorization identity across updates.
-- RLS authorizes progress and response reads through assignment -> pair joins. If
-- an authenticated mentor can move an existing assignment to another pair, the
-- read scope moves with it and can expose operational progress to the wrong pair.
-- Identity columns therefore become immutable; state/content fields remain
-- intentionally mutable through their existing RLS policies.

create or replace function private.v7_guard_pair_assignment_identity()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  if new.pair_id is distinct from old.pair_id
     or new.lesson_revision_id is distinct from old.lesson_revision_id
     or new.assigned_by is distinct from old.assigned_by then
    raise exception 'V7 pair assignment identity is immutable';
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_pair_assignment_identity() from public, anon, authenticated;

drop trigger if exists v7_pair_assignment_identity_guard on public.v7_pair_assignments;
create trigger v7_pair_assignment_identity_guard
before update on public.v7_pair_assignments
for each row execute function private.v7_guard_pair_assignment_identity();

create or replace function private.v7_guard_learner_progress_identity()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  if new.assignment_id is distinct from old.assignment_id
     or new.learner_id is distinct from old.learner_id
     or new.lesson_revision_id is distinct from old.lesson_revision_id then
    raise exception 'V7 learner progress identity is immutable';
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_learner_progress_identity() from public, anon, authenticated;

drop trigger if exists v7_learner_progress_identity_guard on public.v7_learner_progress;
create trigger v7_learner_progress_identity_guard
before update on public.v7_learner_progress
for each row execute function private.v7_guard_learner_progress_identity();

create or replace function private.v7_guard_lesson_response_identity()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  if new.assignment_id is distinct from old.assignment_id
     or new.lesson_revision_id is distinct from old.lesson_revision_id
     or new.lesson_step_id is distinct from old.lesson_step_id
     or new.learner_id is distinct from old.learner_id then
    raise exception 'V7 lesson response identity is immutable';
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_lesson_response_identity() from public, anon, authenticated;

drop trigger if exists v7_lesson_response_identity_guard on public.v7_lesson_responses;
create trigger v7_lesson_response_identity_guard
before update on public.v7_lesson_responses
for each row execute function private.v7_guard_lesson_response_identity();

create or replace function private.v7_guard_response_share_identity()
returns trigger
language plpgsql
set search_path = ''
as $bq$
begin
  if new.response_id is distinct from old.response_id
     or new.recipient_id is distinct from old.recipient_id then
    raise exception 'V7 response share identity is immutable';
  end if;
  return new;
end;
$bq$;

revoke all on function private.v7_guard_response_share_identity() from public, anon, authenticated;

drop trigger if exists v7_response_share_identity_guard on public.v7_response_shares;
create trigger v7_response_share_identity_guard
before update on public.v7_response_shares
for each row execute function private.v7_guard_response_share_identity();
