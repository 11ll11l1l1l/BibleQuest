-- V7 A3 ONE 2 ONE stale-tenant hardening.
--
-- Pair participation is not sufficient authorization after a congregation
-- membership is deactivated. Keep learner-owned private response history
-- available, but fail closed for tenant-scoped pair history and all active
-- mentor/mentee collaboration.

create or replace function private.v7_pair_has_user(
  target_pair uuid,
  target_user uuid,
  require_active boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.v7_mentor_pairs p
    where p.id = target_pair
      and target_user = (select auth.uid())
      and target_user in (p.mentor_id, p.mentee_id)
      and private.is_bible_congregation_member(p.congregation_id)
      and (
        not require_active
        or (
          p.state = 'active'
          and exists (
            select 1
            from public.bible_congregation_members mentor_membership
            where mentor_membership.congregation_id = p.congregation_id
              and mentor_membership.user_id = p.mentor_id
              and mentor_membership.active
          )
          and exists (
            select 1
            from public.bible_congregation_members mentee_membership
            where mentee_membership.congregation_id = p.congregation_id
              and mentee_membership.user_id = p.mentee_id
              and mentee_membership.active
          )
        )
      )
  );
$$;

revoke all on function private.v7_pair_has_user(uuid,uuid,boolean) from public, anon;
grant execute on function private.v7_pair_has_user(uuid,uuid,boolean) to authenticated;

-- Pair invitations are created with INSERT ... RETURNING. Do not route this
-- SELECT policy through v7_pair_has_user(): the STABLE helper cannot reread the
-- row inserted by the same statement. The canonical congregation helper does
-- not reread v7_mentor_pairs, so it remains safe for RETURNING.
drop policy if exists "v7 pair participant read" on public.v7_mentor_pairs;
create policy "v7 pair participant read"
on public.v7_mentor_pairs for select to authenticated
using (
  (select auth.uid()) in (mentor_id, mentee_id)
  and private.is_bible_congregation_member(public.v7_mentor_pairs.congregation_id)
);

-- Active assignment changes require the mentor and both pair participants to
-- remain active members of the pair congregation.
drop policy if exists "v7 pair assignment mentor update" on public.v7_pair_assignments;
create policy "v7 pair assignment mentor update"
on public.v7_pair_assignments for update to authenticated
using (
  exists (
    select 1
    from public.v7_mentor_pairs p
    where p.id = pair_id
      and p.mentor_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
  )
)
with check (
  exists (
    select 1
    from public.v7_mentor_pairs p
    join public.v7_lesson_revisions r on r.id = public.v7_pair_assignments.lesson_revision_id
    join public.v7_lessons l on l.id = r.lesson_id
    join public.v7_modules m on m.id = l.module_id
    join public.v7_tracks t on t.id = m.track_id
    where p.id = public.v7_pair_assignments.pair_id
      and p.mentor_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
      and r.published_at is not null
      and l.publication_state = 'published'
      and m.publication_state = 'published'
      and t.publication_state = 'published'
      and (t.congregation_id is null or t.congregation_id = p.congregation_id)
  )
);

-- Progress is operational pair state. Once either participant loses current
-- congregation membership it is no longer readable or mutable through the
-- active-pair path.
drop policy if exists "v7 progress learner insert" on public.v7_learner_progress;
create policy "v7 progress learner insert"
on public.v7_learner_progress for insert to authenticated
with check (
  learner_id = (select auth.uid())
  and exists (
    select 1
    from public.v7_pair_assignments a
    join public.v7_mentor_pairs p on p.id = a.pair_id
    where a.id = assignment_id
      and a.lesson_revision_id = public.v7_learner_progress.lesson_revision_id
      and p.mentee_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
  )
);

drop policy if exists "v7 progress learner update" on public.v7_learner_progress;
create policy "v7 progress learner update"
on public.v7_learner_progress for update to authenticated
using (
  learner_id = (select auth.uid())
  and exists (
    select 1
    from public.v7_pair_assignments a
    join public.v7_mentor_pairs p on p.id = a.pair_id
    where a.id = assignment_id
      and p.mentee_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
  )
)
with check (
  learner_id = (select auth.uid())
  and exists (
    select 1
    from public.v7_pair_assignments a
    join public.v7_mentor_pairs p on p.id = a.pair_id
    where a.id = assignment_id
      and a.lesson_revision_id = public.v7_learner_progress.lesson_revision_id
      and p.mentee_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
  )
);

-- A learner may still SELECT or DELETE their own private response history after
-- a pair ends or membership changes. Creating or editing a response remains an
-- active collaboration operation and therefore requires a current pair tenant.
drop policy if exists "v7 response learner insert" on public.v7_lesson_responses;
create policy "v7 response learner insert"
on public.v7_lesson_responses for insert to authenticated
with check (
  learner_id = (select auth.uid())
  and exists (
    select 1
    from public.v7_pair_assignments a
    join public.v7_mentor_pairs p on p.id = a.pair_id
    where a.id = assignment_id
      and a.lesson_revision_id = public.v7_lesson_responses.lesson_revision_id
      and p.mentee_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
  )
);

drop policy if exists "v7 response learner update" on public.v7_lesson_responses;
create policy "v7 response learner update"
on public.v7_lesson_responses for update to authenticated
using (
  learner_id = (select auth.uid())
  and exists (
    select 1
    from public.v7_pair_assignments a
    join public.v7_mentor_pairs p on p.id = a.pair_id
    where a.id = assignment_id
      and p.mentee_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
  )
)
with check (
  learner_id = (select auth.uid())
  and exists (
    select 1
    from public.v7_pair_assignments a
    join public.v7_mentor_pairs p on p.id = a.pair_id
    where a.id = assignment_id
      and a.lesson_revision_id = public.v7_lesson_responses.lesson_revision_id
      and p.mentee_id = (select auth.uid())
      and private.v7_pair_has_user(p.id, (select auth.uid()), true)
  )
);

-- Re-sharing requires an active current tenant. Revocation intentionally stays
-- possible after the pair ends or membership changes so a learner can retract
-- access to their own historical response.
create or replace function private.v7_response_share_authorized(
  target_response uuid,
  target_user uuid,
  target_recipient uuid,
  require_active boolean
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.v7_lesson_responses r
    join public.v7_pair_assignments a on a.id = r.assignment_id
    join public.v7_mentor_pairs p on p.id = a.pair_id
    where r.id = target_response
      and target_user = (select auth.uid())
      and r.learner_id = target_user
      and p.mentor_id = target_recipient
      and (
        not require_active
        or private.v7_pair_has_user(p.id, target_user, true)
      )
  );
$$;

revoke all on function private.v7_response_share_authorized(uuid,uuid,uuid,boolean) from public, anon;
grant execute on function private.v7_response_share_authorized(uuid,uuid,uuid,boolean) to authenticated;

-- A stale mentor should not retain visibility of share metadata. The learner
-- owner keeps access to their own sharing history for review/revocation.
drop policy if exists "v7 response share participant read" on public.v7_response_shares;
create policy "v7 response share participant read"
on public.v7_response_shares for select to authenticated
using (
  private.v7_response_is_owned(response_id, (select auth.uid()))
  or (
    recipient_id = (select auth.uid())
    and exists (
      select 1
      from public.v7_lesson_responses r
      join public.v7_pair_assignments a on a.id = r.assignment_id
      where r.id = response_id
        and private.v7_pair_has_user(a.pair_id, (select auth.uid()), true)
    )
  )
);
