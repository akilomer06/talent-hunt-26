-- Run in Supabase SQL Editor AFTER configuring SUPABASE_SECRET_KEY on Render.
-- The API uses a server-only secret key; browsers must not access these tables.
BEGIN;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.registrations, public.site_content FROM anon, authenticated;
GRANT ALL ON public.registrations, public.site_content TO service_role;

-- Remove the permissive policies from both versions of the imported schema.
DROP POLICY IF EXISTS "Allow public all on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public insert on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public select on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public delete on registrations" ON public.registrations;
DROP POLICY IF EXISTS "Allow public all on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow public read on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow public write on site_content" ON public.site_content;
DROP POLICY IF EXISTS "Allow public update on site_content" ON public.site_content;
COMMIT;
