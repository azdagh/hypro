-- =========================================================================
-- HYPRO ERP MULTI-TENANCY MIGRATION SCRIPT v2
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 1: Create the companies table
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 2: Add company_id column to ALL tables FIRST
-- (We must do this before creating any RLS policies that reference it)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.projects         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.allocations      ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.expenses         ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.suppliers        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.subcontractors   ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.purchase_orders  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.contracts        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.stocks           ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.equipment        ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.audit_logs       ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.project_assignments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
ALTER TABLE public.notifications    ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 3: Create default company and assign ALL existing data to it
-- ─────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    -- Create a default company for all existing users/data
    INSERT INTO public.companies (name)
    VALUES ('HYPRO Default Company')
    RETURNING id INTO default_company_id;

    -- Assign existing records to the default company
    UPDATE public.profiles          SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.projects          SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.allocations       SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.expense_categories SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.expenses          SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.suppliers         SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.subcontractors    SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.purchase_requests SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.purchase_orders   SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.contracts         SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.stocks            SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.equipment         SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.audit_logs        SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.project_assignments SET company_id = default_company_id WHERE company_id IS NULL;
    UPDATE public.notifications     SET company_id = default_company_id WHERE company_id IS NULL;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 4: Enable RLS on companies and add policies
-- (NOW safe because profiles.company_id already exists)
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop policy if it already exists to avoid errors on re-run
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
USING (
    id IN (SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid())
);

-- ─────────────────────────────────────────────────────────────────────────
-- STEP 5: Helper function to get the current user's company_id
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT company_id INTO cid FROM public.profiles WHERE id = auth.uid();
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────────────────
-- DONE! 
-- Your existing data is assigned to "HYPRO Default Company".
-- New clients you create via the Master Admin panel will be fully isolated.
-- ─────────────────────────────────────────────────────────────────────────
