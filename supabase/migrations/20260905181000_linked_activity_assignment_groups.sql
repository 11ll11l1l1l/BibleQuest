-- Link leader assignments to Journey Groups without exposing unrelated groups.

ALTER TABLE public.bible_assignments
  DROP CONSTRAINT IF EXISTS bible_assignments_target_scope_check;
ALTER TABLE public.bible_assignments
  ADD CONSTRAINT bible_assignments_target_scope_check
  CHECK (target_scope = ANY (ARRAY['all'::text, 'member'::text, 'team'::text, 'group'::text]));

ALTER TABLE public.bible_assignments
  DROP CONSTRAINT IF EXISTS bible_assignments_check;
ALTER TABLE public.bible_assignments
  ADD CONSTRAINT bible_assignments_check
  CHECK (
    (target_scope = 'all'::text AND target_id IS NULL)
    OR (target_scope = ANY (ARRAY['member'::text, 'team'::text, 'group'::text]) AND target_id IS NOT NULL)
  );

CREATE OR REPLACE FUNCTION private.bible_assignment_visible(
  target_congregation uuid,
  target_scope text,
  target_id uuid
) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $$
DECLARE viewer uuid := (SELECT auth.uid()); viewer_role text;
BEGIN
  IF viewer IS NULL THEN RETURN false; END IF;
  SELECT m.role INTO viewer_role
  FROM public.bible_congregation_members m
  WHERE m.congregation_id=target_congregation
    AND m.user_id=viewer
    AND m.active
  LIMIT 1;
  IF viewer_role IS NULL THEN RETURN false; END IF;
  IF viewer_role IN ('facilitator','leader','pastor','admin') THEN RETURN true; END IF;
  IF target_scope='all' THEN RETURN true; END IF;
  IF target_scope='member' THEN RETURN target_id=viewer; END IF;
  IF target_scope='team' THEN
    RETURN EXISTS(
      SELECT 1 FROM public.bible_team_members tm
      WHERE tm.team_id=target_id AND tm.user_id=viewer
    );
  END IF;
  IF target_scope='group' THEN
    RETURN EXISTS(
      SELECT 1
      FROM public.bible_group_members gm
      JOIN public.bible_groups g ON g.id=gm.group_id
      WHERE gm.group_id=target_id
        AND gm.user_id=viewer
        AND gm.active
        AND g.active
        AND g.congregation_id=target_congregation
    );
  END IF;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION private.bible_assignment_visible(uuid,text,uuid) FROM public;
GRANT EXECUTE ON FUNCTION private.bible_assignment_visible(uuid,text,uuid) TO authenticated;
