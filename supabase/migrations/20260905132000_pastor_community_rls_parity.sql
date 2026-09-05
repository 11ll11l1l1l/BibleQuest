-- Keep database RLS authority aligned with the production leadership role model.
-- Pastor is already an authorized leadership role in the corresponding Edge Functions.

DROP POLICY IF EXISTS "assignment progress visible" ON public.bible_assignment_progress;
CREATE POLICY "assignment progress visible"
ON public.bible_assignment_progress
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.bible_assignments a
    WHERE a.id = bible_assignment_progress.assignment_id
      AND private.bible_role_in_congregation(a.congregation_id)
          = ANY (ARRAY['facilitator'::text, 'leader'::text, 'pastor'::text, 'admin'::text])
  )
);

DROP POLICY IF EXISTS "challenges leaders create" ON public.bible_challenges;
CREATE POLICY "challenges leaders create"
ON public.bible_challenges
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = created_by
  AND private.bible_role_in_congregation(congregation_id)
      = ANY (ARRAY['facilitator'::text, 'leader'::text, 'pastor'::text, 'admin'::text])
);

DROP POLICY IF EXISTS "challenges creator update" ON public.bible_challenges;
CREATE POLICY "challenges creator update"
ON public.bible_challenges
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = created_by
  AND private.bible_role_in_congregation(congregation_id)
      = ANY (ARRAY['facilitator'::text, 'leader'::text, 'pastor'::text, 'admin'::text])
)
WITH CHECK (
  (SELECT auth.uid()) = created_by
  AND private.bible_role_in_congregation(congregation_id)
      = ANY (ARRAY['facilitator'::text, 'leader'::text, 'pastor'::text, 'admin'::text])
);

DROP POLICY IF EXISTS "room responses facilitators read" ON public.bible_room_responses;
CREATE POLICY "room responses facilitators read"
ON public.bible_room_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.bible_shared_sessions s
    WHERE s.id = bible_room_responses.session_id
      AND private.is_bible_congregation_member(s.congregation_id)
      AND (
        (SELECT auth.uid()) = s.created_by
        OR private.bible_role_in_congregation(s.congregation_id)
           = ANY (ARRAY['facilitator'::text, 'leader'::text, 'pastor'::text, 'admin'::text])
      )
  )
);

DROP POLICY IF EXISTS "sessions controlled create" ON public.bible_shared_sessions;
CREATE POLICY "sessions controlled create"
ON public.bible_shared_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND private.is_bible_congregation_member(congregation_id)
  AND (
    session_type <> 'live-room'::text
    OR private.bible_role_in_congregation(congregation_id)
       = ANY (ARRAY['facilitator'::text, 'leader'::text, 'pastor'::text, 'admin'::text])
  )
);

DROP POLICY IF EXISTS "sessions creator update" ON public.bible_shared_sessions;
CREATE POLICY "sessions creator update"
ON public.bible_shared_sessions
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = created_by
  AND private.is_bible_congregation_member(congregation_id)
)
WITH CHECK (
  (SELECT auth.uid()) = created_by
  AND private.is_bible_congregation_member(congregation_id)
  AND (
    session_type <> 'live-room'::text
    OR private.bible_role_in_congregation(congregation_id)
       = ANY (ARRAY['facilitator'::text, 'leader'::text, 'pastor'::text, 'admin'::text])
  )
);
