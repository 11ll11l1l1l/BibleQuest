-- Record Couples Week / couples-type congregation challenge completion in the active linked couple history.
-- Individual challenge progress and points remain individual; this adds one shared pair-level record per day.

CREATE UNIQUE INDEX IF NOT EXISTS bible_couple_shared_challenge_once_idx
ON public.bible_couple_shared(pair_id, body)
WHERE item_type='challenge';

CREATE OR REPLACE FUNCTION private.bible_link_couple_challenge_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=''
AS $$
DECLARE
  v_type text;
  v_title text;
  v_pair uuid;
BEGIN
  SELECT c.challenge_type,c.title
    INTO v_type,v_title
  FROM public.bible_challenges c
  WHERE c.id=NEW.challenge_id;

  IF v_type IS DISTINCT FROM 'couples' THEN
    RETURN NEW;
  END IF;

  SELECT p.id
    INTO v_pair
  FROM public.bible_couple_pairs p
  WHERE p.status='active'
    AND (p.user_a=NEW.user_id OR p.user_b=NEW.user_id)
  ORDER BY p.updated_at DESC
  LIMIT 1;

  IF v_pair IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.bible_couple_shared(
    pair_id,author_id,item_type,body,created_at,updated_at
  ) VALUES (
    v_pair,
    NEW.user_id,
    'challenge',
    NEW.challenge_id::text || ':' || NEW.day_key || '|' || COALESCE(v_title,'Couples Challenge'),
    COALESCE(NEW.completed_at,now()),
    now()
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.bible_link_couple_challenge_progress() FROM public,anon,authenticated;

DROP TRIGGER IF EXISTS bible_link_couple_challenge_progress ON public.bible_challenge_progress;
CREATE TRIGGER bible_link_couple_challenge_progress
AFTER INSERT OR UPDATE OF completed_at
ON public.bible_challenge_progress
FOR EACH ROW
EXECUTE FUNCTION private.bible_link_couple_challenge_progress();
