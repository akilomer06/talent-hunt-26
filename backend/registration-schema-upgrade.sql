-- Optional upgrade for the original database, which did not have section.
-- The API also supports the old schema without requiring this migration.
BEGIN;
ALTER TABLE public.registrations ADD COLUMN IF NOT EXISTS section TEXT DEFAULT '';
-- Promote sections saved by the API's lossless legacy-schema compatibility.
UPDATE public.registrations
SET section = COALESCE(NULLIF(section, ''), team_members->>'registrant_section', ''),
    team_members = team_members->'members'
WHERE jsonb_typeof(team_members) = 'object'
  AND jsonb_typeof(team_members->'members') = 'array';
NOTIFY pgrst, 'reload schema';
COMMIT;
