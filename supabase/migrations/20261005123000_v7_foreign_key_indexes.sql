-- BibleQuest V7 Lane A: cover V7 foreign keys used by integrity, RLS, and lifecycle joins.
-- These indexes are additive and preserve the existing authorization model.

create index if not exists v7_learner_progress_assignment_revision_idx
  on public.v7_learner_progress(assignment_id, lesson_revision_id);
create index if not exists v7_learner_progress_current_step_revision_idx
  on public.v7_learner_progress(current_step_id, lesson_revision_id);

create index if not exists v7_lesson_responses_revision_idx
  on public.v7_lesson_responses(lesson_revision_id);
create index if not exists v7_lesson_responses_step_revision_idx
  on public.v7_lesson_responses(lesson_step_id, lesson_revision_id);

create index if not exists v7_lesson_revisions_created_by_idx
  on public.v7_lesson_revisions(created_by);
create index if not exists v7_lesson_steps_library_revision_idx
  on public.v7_lesson_steps(library_revision_id);

create index if not exists v7_library_items_congregation_idx
  on public.v7_library_items(congregation_id);
create index if not exists v7_library_items_created_by_idx
  on public.v7_library_items(created_by);
create index if not exists v7_library_items_current_revision_idx
  on public.v7_library_items(current_revision_id, id);

create index if not exists v7_library_revision_taxonomy_taxonomy_idx
  on public.v7_library_revision_taxonomy(taxonomy_id);
create index if not exists v7_library_revisions_created_by_idx
  on public.v7_library_revisions(created_by);
create index if not exists v7_library_revisions_reviewer_idx
  on public.v7_library_revisions(reviewer_id);

create index if not exists v7_library_taxonomy_congregation_idx
  on public.v7_library_taxonomy(congregation_id);
create index if not exists v7_library_taxonomy_created_by_idx
  on public.v7_library_taxonomy(created_by);

create index if not exists v7_library_translations_reviewer_idx
  on public.v7_library_translations(reviewer_id);
create index if not exists v7_library_translations_source_revision_idx
  on public.v7_library_translations(translated_from_revision_id);

create index if not exists v7_mentor_pairs_initiated_by_idx
  on public.v7_mentor_pairs(initiated_by);
create index if not exists v7_mentor_pairs_mentee_idx
  on public.v7_mentor_pairs(mentee_id);
create index if not exists v7_mentor_pairs_mentor_idx
  on public.v7_mentor_pairs(mentor_id);

create index if not exists v7_pair_assignments_assigned_by_idx
  on public.v7_pair_assignments(assigned_by);
create index if not exists v7_pair_assignments_lesson_revision_idx
  on public.v7_pair_assignments(lesson_revision_id);

create index if not exists v7_pair_events_actor_idx
  on public.v7_pair_events(actor_id);
create index if not exists v7_pair_events_pair_idx
  on public.v7_pair_events(pair_id);

create index if not exists v7_tracks_congregation_idx
  on public.v7_tracks(congregation_id);
create index if not exists v7_tracks_created_by_idx
  on public.v7_tracks(created_by);
