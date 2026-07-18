-- Fix for personal expenses violating not-null constraint on project_id
ALTER TABLE expenses ALTER COLUMN project_id DROP NOT NULL;
