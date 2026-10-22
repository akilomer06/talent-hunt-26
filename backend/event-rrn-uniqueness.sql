-- Optional database-level backstop: run once in the Supabase SQL Editor.
-- Installs functions and a trigger only. Does not rewrite or delete registrations.
-- Existing duplicates remain available for manual review; new overlaps are blocked.
-- PostgreSQL volatile queries refresh snapshots after the advisory lock:
-- https://www.postgresql.org/docs/current/xfunc-volatility.html
-- https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS
BEGIN;

CREATE OR REPLACE FUNCTION public.th26_event_rrn_pairs(p_rrn text, p_events jsonb, p_team jsonb)
RETURNS TABLE(event_id text, rrn text)
LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
  WITH selected AS (
    SELECT DISTINCT value AS event_id
    FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(p_events) = 'array' THEN p_events ELSE '[]'::jsonb END)
  ), members AS (
    SELECT value AS person
    FROM jsonb_array_elements(CASE
      WHEN jsonb_typeof(p_team) = 'array' THEN p_team
      WHEN jsonb_typeof(p_team->'members') = 'array' THEN p_team->'members'
      ELSE '[]'::jsonb END)
  ), team_events AS (
    SELECT event_id FROM selected WHERE event_id NOT IN ('tech-talks', 'shutter-verse', 'fifa')
  )
  SELECT s.event_id, upper(regexp_replace(coalesce(p_rrn, ''), '[[:space:]]+', '', 'g')) FROM selected s
  UNION ALL
  SELECT s.event_id, upper(regexp_replace(coalesce(m.person->>'rrn', ''), '[[:space:]]+', '', 'g'))
  FROM members m CROSS JOIN selected s
  WHERE s.event_id = m.person->>'event_id'
    OR (NOT EXISTS (SELECT 1 FROM selected assigned WHERE assigned.event_id = m.person->>'event_id')
      AND (EXISTS (SELECT 1 FROM team_events t WHERE t.event_id = s.event_id) OR NOT EXISTS (SELECT 1 FROM team_events)));
$$;

CREATE OR REPLACE FUNCTION public.th26_guard_event_rrn()
RETURNS trigger LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE
  old_rrn text := NULL;
  old_events jsonb := '[]'::jsonb;
  old_team jsonb := '[]'::jsonb;
BEGIN
  -- Serialize membership checks across API processes and direct database writers.
  PERFORM pg_advisory_xact_lock(hashtextextended('th26:event-rrn-uniqueness', 0));
  IF TG_OP = 'UPDATE' THEN
    old_rrn := OLD.rrn; old_events := OLD.selected_events; old_team := OLD.team_members;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.th26_event_rrn_pairs(NEW.rrn, NEW.selected_events, NEW.team_members) p
    WHERE p.rrn <> '' GROUP BY p.event_id, p.rrn
    HAVING count(*) > greatest(1, (SELECT count(*) FROM public.th26_event_rrn_pairs(old_rrn, old_events, old_team) previous
      WHERE previous.event_id = p.event_id AND previous.rrn = p.rrn))
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TH26_DUPLICATE_EVENT_RRN: repeated RRN inside a registration';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.th26_event_rrn_pairs(NEW.rrn, NEW.selected_events, NEW.team_members) incoming
    WHERE incoming.rrn <> ''
      AND NOT EXISTS (SELECT 1 FROM public.th26_event_rrn_pairs(old_rrn, old_events, old_team) previous
        WHERE previous.event_id = incoming.event_id AND previous.rrn = incoming.rrn)
      AND EXISTS (
        SELECT 1 FROM public.registrations r
        CROSS JOIN LATERAL public.th26_event_rrn_pairs(r.rrn, r.selected_events, r.team_members) existing
        WHERE r.id IS DISTINCT FROM NEW.id AND existing.event_id = incoming.event_id AND existing.rrn = incoming.rrn
      )
  ) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'TH26_DUPLICATE_EVENT_RRN: participant already belongs to this event';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.th26_event_rrn_pairs(text, jsonb, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.th26_guard_event_rrn() FROM PUBLIC;
DROP TRIGGER IF EXISTS th26_event_rrn_unique ON public.registrations;
CREATE TRIGGER th26_event_rrn_unique
BEFORE INSERT OR UPDATE OF rrn, selected_events, team_members ON public.registrations
FOR EACH ROW EXECUTE FUNCTION public.th26_guard_event_rrn();
COMMIT;
