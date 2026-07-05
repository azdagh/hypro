-- =========================================================================
-- PATCH: Add technical_files JSONB column to projects table
-- Run this in your Supabase SQL Editor if the column doesn't exist yet
-- =========================================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS technical_files JSONB DEFAULT '[]'::jsonb;

-- Update all existing projects that have NULL to empty array
UPDATE public.projects
  SET technical_files = '[]'::jsonb
  WHERE technical_files IS NULL;
