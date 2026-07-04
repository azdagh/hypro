-- =========================================================================
-- HYPRO ERP MULTI-TENANCY MIGRATION SCRIPT
-- Run this in your Supabase SQL Editor
-- =========================================================================

-- 1. Create the companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    logo_url TEXT,
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own company
CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
USING (
    id IN (SELECT company_id FROM public.profiles WHERE profiles.id = auth.uid())
);

-- 2. Create a default company for existing data
DO $$
DECLARE
    default_company_id UUID;
BEGIN
    INSERT INTO public.companies (name) 
    VALUES ('HYPRO Default Company')
    RETURNING id INTO default_company_id;

    -- 3. Add company_id to profiles and set default
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.profiles SET company_id = default_company_id WHERE company_id IS NULL;

    -- 4. Add company_id to all business tables and set default
    -- Projects
    ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.projects SET company_id = default_company_id WHERE company_id IS NULL;

    -- Allocations
    ALTER TABLE public.allocations ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.allocations SET company_id = default_company_id WHERE company_id IS NULL;

    -- Expense Categories
    ALTER TABLE public.expense_categories ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.expense_categories SET company_id = default_company_id WHERE company_id IS NULL;

    -- Expenses
    ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.expenses SET company_id = default_company_id WHERE company_id IS NULL;

    -- Suppliers
    ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.suppliers SET company_id = default_company_id WHERE company_id IS NULL;

    -- Subcontractors
    ALTER TABLE public.subcontractors ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.subcontractors SET company_id = default_company_id WHERE company_id IS NULL;

    -- Purchase Requests
    ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.purchase_requests SET company_id = default_company_id WHERE company_id IS NULL;

    -- Purchase Orders
    ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.purchase_orders SET company_id = default_company_id WHERE company_id IS NULL;

    -- Contracts
    ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.contracts SET company_id = default_company_id WHERE company_id IS NULL;

    -- Stock Items
    ALTER TABLE public.stock_items ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.stock_items SET company_id = default_company_id WHERE company_id IS NULL;

    -- Equipment
    ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.equipment SET company_id = default_company_id WHERE company_id IS NULL;

    -- Audit Logs
    ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.audit_logs SET company_id = default_company_id WHERE company_id IS NULL;
    
    -- Project Assignments
    ALTER TABLE public.project_assignments ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.project_assignments SET company_id = default_company_id WHERE company_id IS NULL;
    
    -- Notifications
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);
    UPDATE public.notifications SET company_id = default_company_id WHERE company_id IS NULL;

END $$;

-- 5. Update RLS Policies to strictly enforce multi-tenancy
-- Note: You should ideally drop old policies and recreate them with company_id checks.
-- For safety, we add a general tenant isolation function you can use in all policies.

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
DECLARE
    cid UUID;
BEGIN
    SELECT company_id INTO cid FROM public.profiles WHERE id = auth.uid();
    RETURN cid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example of dropping an old policy and creating a new isolated one for projects:
-- DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.projects;
-- CREATE POLICY "Tenant isolated project read" ON public.projects FOR SELECT USING (company_id = public.get_user_company_id());
-- CREATE POLICY "Tenant isolated project insert" ON public.projects FOR INSERT WITH CHECK (company_id = public.get_user_company_id());
-- CREATE POLICY "Tenant isolated project update" ON public.projects FOR UPDATE USING (company_id = public.get_user_company_id());
-- CREATE POLICY "Tenant isolated project delete" ON public.projects FOR DELETE USING (company_id = public.get_user_company_id());

-- (You will need to apply this pattern to all tables if your backend strictly relies on RLS)
-- Since the backend uses a Service Role in some places and explicitly filters by company_id via the API, 
-- applying company_id at the backend logic level is also required.
