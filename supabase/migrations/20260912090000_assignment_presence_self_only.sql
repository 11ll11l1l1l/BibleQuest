-- BibleQuest V4 assignment privacy tightening (Phase 1).
--
-- Verified finding before this migration: bible_assignment_progress (actual
-- answer text + leader_feedback) was already correctly self-only + ministry-role
-- scoped and is NOT changed here. The only thing genuinely visible to ordinary
-- members was bible_assignment_response_presence (display_name + completed_at
-- only, no answer content) - visible to any member the assignment was visible
-- to. New product requirement: ordinary members see only their own
-- assignment/response state; nothing about other members' responses, not even
-- name + completion status. Ministry roles keep congregation-scoped presence
-- visibility for review purposes.

drop policy if exists assignment_response_presence_select on public.bible_assignment_response_presence;
create policy assignment_response_presence_select
on public.bible_assignment_response_presence
for select
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.bible_assignments a
    where a.id = bible_assignment_response_presence.assignment_id
      and a.congregation_id = bible_assignment_response_presence.congregation_id
      and private.bible_role_in_congregation(a.congregation_id)
          = any (array['facilitator','leader','pastor','admin'])
  )
);

comment on policy assignment_response_presence_select on public.bible_assignment_response_presence is
  'Members: own presence row only. Ministry roles (facilitator/leader/pastor/admin): congregation-scoped presence for review. No general peer-visibility for ordinary members.';
