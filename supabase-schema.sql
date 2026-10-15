-- ==============================================================================
-- TALENT HUNT 2K26 - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Dashboard: SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create table for Participant Registrations
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  rrn TEXT NOT NULL,
  mobile TEXT NOT NULL,
  programme TEXT NOT NULL,
  year TEXT NOT NULL,
  department TEXT NOT NULL,
  section TEXT DEFAULT '',
  selected_events JSONB NOT NULL DEFAULT '[]'::jsonb,
  team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS and public policies for registrations
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on registrations" ON public.registrations;
CREATE POLICY "Allow public insert on registrations"
ON public.registrations FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on registrations" ON public.registrations;
CREATE POLICY "Allow public select on registrations"
ON public.registrations FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Allow public delete on registrations" ON public.registrations;
CREATE POLICY "Allow public delete on registrations"
ON public.registrations FOR DELETE TO public
USING (true);

-- 2. Create table for Live Site Content Management (Events, Venue, Announcements)
CREATE TABLE IF NOT EXISTS public.site_content (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on site_content" ON public.site_content;
CREATE POLICY "Allow public read on site_content"
ON public.site_content FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "Allow public write on site_content" ON public.site_content;
CREATE POLICY "Allow public write on site_content"
ON public.site_content FOR INSERT TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on site_content" ON public.site_content;
CREATE POLICY "Allow public update on site_content"
ON public.site_content FOR UPDATE TO public
USING (true);
