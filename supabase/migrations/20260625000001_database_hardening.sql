-- HYPRO ERP Database Hardening & Normalization Migration
-- Designed for Supabase / PostgreSQL (Algeria context: DZD primary currency)

-- =========================================================================
-- 1. PROJECT ASSIGNMENTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.project_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assignment_role TEXT NOT NULL DEFAULT 'Site Manager',
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_project_user_assignment UNIQUE (project_id, user_id)
);

-- Indexes for lightning-fast lookups
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON public.project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignments_user ON public.project_assignments(user_id);

-- Enable RLS
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 2. ALLOCATIONS TABLE NORMALIZATION
-- =========================================================================
DROP POLICY IF EXISTS "Allocations are readable based on roles and assignments" ON public.allocations;

-- Add a temporary column for profile UUID references
ALTER TABLE public.allocations ADD COLUMN IF NOT EXISTS allocated_to_uuid UUID REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- Backfill from profiles by matching full_name (fuzzy/exact matching)
UPDATE public.allocations a
SET allocated_to_uuid = p.id
FROM public.profiles p
WHERE SPLIT_PART(a.allocated_to, ' (', 1) = p.full_name;

-- Backfill fallback: if no match, map to the allocated_by user (usually Admin/Fin Director)
UPDATE public.allocations
SET allocated_to_uuid = allocated_by
WHERE allocated_to_uuid IS NULL;

-- Remove old allocated_to column and rename new one
ALTER TABLE public.allocations DROP COLUMN IF EXISTS allocated_to;
ALTER TABLE public.allocations RENAME COLUMN allocated_to_uuid TO allocated_to;

-- Enforce NOT NULL on the normalized UUID column
ALTER TABLE public.allocations ALTER COLUMN allocated_to SET NOT NULL;

-- Create index on the normalized foreign key column
CREATE INDEX IF NOT EXISTS idx_allocations_allocated_to ON public.allocations(allocated_to);

-- =========================================================================
-- 3. PROJECT ASSIGNMENT ENGINE REFACTORING
-- =========================================================================
CREATE OR REPLACE FUNCTION public.is_project_assigned_to_user(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role public.user_role;
BEGIN
  -- Fetch user role from profiles
  SELECT role INTO v_role
  FROM public.profiles
  WHERE id = u_id;

  -- Super Admin, Financial Director, Accountant, and Auditor can access all projects
  IF v_role IN ('Super Admin', 'Financial Director', 'Accountant', 'Auditor') THEN
    RETURN TRUE;
  END IF;

  -- Site Manager / Employee must have an explicit project assignment
  IF EXISTS (
    SELECT 1 FROM public.project_assignments
    WHERE project_id = p_id AND user_id = u_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- 4. ROW LEVEL SECURITY (RLS) HARDENING
-- =========================================================================

-- Re-enable RLS on all tables to be safe
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;

-- Clean existing policy definitions
DROP POLICY IF EXISTS "Projects are readable by assigned/roles" ON public.projects;
DROP POLICY IF EXISTS "Projects are insertable/modifiable by admins and directors" ON public.projects;
DROP POLICY IF EXISTS "Allocations are readable by all authenticated users" ON public.allocations;
DROP POLICY IF EXISTS "Allocations are readable based on roles and assignments" ON public.allocations;
DROP POLICY IF EXISTS "Allocations are insertable by Super Admin and Financial Director" ON public.allocations;
DROP POLICY IF EXISTS "Expenses are readable by all authenticated users" ON public.expenses;
DROP POLICY IF EXISTS "Expenses are readable based on roles and assignments" ON public.expenses;
DROP POLICY IF EXISTS "Expenses are insertable by Employee and Site Manager and Accountant" ON public.expenses;
DROP POLICY IF EXISTS "Expenses can be approved/updated by Accountant, Financial Director, or Super Admin" ON public.expenses;
DROP POLICY IF EXISTS "Purchase Requests are readable by everyone" ON public.purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests are readable based on roles and ownership" ON public.purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests can be submitted by Site Manager/Employee" ON public.purchase_requests;
DROP POLICY IF EXISTS "Purchase Requests can be approved by Fin Director or Super Admin" ON public.purchase_requests;
DROP POLICY IF EXISTS "Purchase Orders are readable by everyone" ON public.purchase_orders;
DROP POLICY IF EXISTS "Purchase Orders are readable based on roles and assignments" ON public.purchase_orders;
DROP POLICY IF EXISTS "Purchase Orders can be submitted by Accountant/Fin Director/Admin" ON public.purchase_orders;
DROP POLICY IF EXISTS "Contracts are readable by everyone" ON public.contracts;
DROP POLICY IF EXISTS "Contracts are readable based on roles and assignments" ON public.contracts;
DROP POLICY IF EXISTS "Contracts can be created/managed by Fin Director / Accountant / Admin" ON public.contracts;
DROP POLICY IF EXISTS "Stocks are readable by everyone" ON public.stocks;
DROP POLICY IF EXISTS "Stocks are readable based on roles and assignments" ON public.stocks;
DROP POLICY IF EXISTS "Stocks can be managed by Site Managers, Accountants, Admins" ON public.stocks;
DROP POLICY IF EXISTS "Equipment is readable by everyone" ON public.equipment;
DROP POLICY IF EXISTS "Equipment is readable based on roles and assignments" ON public.equipment;
DROP POLICY IF EXISTS "Equipment is manageable by Site Managers, Accountants, Admins" ON public.equipment;
DROP POLICY IF EXISTS "Notifications are readable by target user" ON public.notifications;
DROP POLICY IF EXISTS "Notifications can be updated (marked read) by target user" ON public.notifications;

-- ----------------- PROJECTS POLICIES -----------------
CREATE POLICY "Projects SELECT policy"
  ON public.projects FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    public.is_project_assigned_to_user(id, auth.uid())
  );

CREATE POLICY "Projects INSERT policy"
  ON public.projects FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

CREATE POLICY "Projects UPDATE policy"
  ON public.projects FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

CREATE POLICY "Projects DELETE policy"
  ON public.projects FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin')
  );

-- ----------------- ALLOCATIONS POLICIES -----------------
CREATE POLICY "Allocations SELECT policy"
  ON public.allocations FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    allocated_to = auth.uid() OR
    allocated_by = auth.uid()
  );

CREATE POLICY "Allocations INSERT policy"
  ON public.allocations FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

CREATE POLICY "Allocations UPDATE policy"
  ON public.allocations FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

CREATE POLICY "Allocations DELETE policy"
  ON public.allocations FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

-- ----------------- EXPENSES POLICIES -----------------
CREATE POLICY "Expenses SELECT policy"
  ON public.expenses FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    submitted_by = auth.uid() OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Expenses INSERT policy"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (
    submitted_by = auth.uid() AND (
      public.has_role('Employee') OR
      public.has_role('Site Manager') OR
      public.has_role('Accountant') OR
      public.has_role('Super Admin')
    )
  );

CREATE POLICY "Expenses UPDATE policy"
  ON public.expenses FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Expenses DELETE policy"
  ON public.expenses FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin')
  );

-- ----------------- PURCHASE REQUESTS POLICIES -----------------
CREATE POLICY "Purchase Requests SELECT policy"
  ON public.purchase_requests FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    requester_id = auth.uid()
  );

CREATE POLICY "Purchase Requests INSERT policy"
  ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (
    requester_id = auth.uid() AND (
      public.has_role('Employee') OR
      public.has_role('Site Manager') OR
      public.has_role('Super Admin')
    )
  );

CREATE POLICY "Purchase Requests UPDATE policy"
  ON public.purchase_requests FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

CREATE POLICY "Purchase Requests DELETE policy"
  ON public.purchase_requests FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin')
  );

-- ----------------- PURCHASE ORDERS POLICIES -----------------
CREATE POLICY "Purchase Orders SELECT policy"
  ON public.purchase_orders FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Purchase Orders INSERT policy"
  ON public.purchase_orders FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Purchase Orders UPDATE policy"
  ON public.purchase_orders FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Purchase Orders DELETE policy"
  ON public.purchase_orders FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin')
  );

-- ----------------- CONTRACTS POLICIES -----------------
CREATE POLICY "Contracts SELECT policy"
  ON public.contracts FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Contracts INSERT policy"
  ON public.contracts FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Contracts UPDATE policy"
  ON public.contracts FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Contracts DELETE policy"
  ON public.contracts FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin')
  );

-- ----------------- STOCKS POLICIES -----------------
CREATE POLICY "Stocks SELECT policy"
  ON public.stocks FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    public.is_project_assigned_to_user(project_id, auth.uid())
  );

CREATE POLICY "Stocks INSERT policy"
  ON public.stocks FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Accountant') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Stocks UPDATE policy"
  ON public.stocks FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Accountant') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Accountant') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Stocks DELETE policy"
  ON public.stocks FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Accountant')
  );

-- ----------------- EQUIPMENT POLICIES -----------------
CREATE POLICY "Equipment SELECT policy"
  ON public.equipment FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    public.is_project_assigned_to_user(project_id, auth.uid())
  );

CREATE POLICY "Equipment INSERT policy"
  ON public.equipment FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Accountant') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Equipment UPDATE policy"
  ON public.equipment FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Accountant') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Accountant') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Equipment DELETE policy"
  ON public.equipment FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Accountant')
  );

-- ----------------- NOTIFICATIONS POLICIES -----------------
CREATE POLICY "Notifications SELECT policy"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Notifications INSERT policy"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (true); -- Notifications can be triggered by actions

CREATE POLICY "Notifications UPDATE policy"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Notifications DELETE policy"
  ON public.notifications FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ----------------- SUPPLIERS POLICIES -----------------
CREATE POLICY "Suppliers SELECT policy"
  ON public.suppliers FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Suppliers INSERT policy"
  ON public.suppliers FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Suppliers UPDATE policy"
  ON public.suppliers FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Suppliers DELETE policy"
  ON public.suppliers FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin')
  );

-- ----------------- SUBCONTRACTORS POLICIES -----------------
CREATE POLICY "Subcontractors SELECT policy"
  ON public.subcontractors FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Subcontractors INSERT policy"
  ON public.subcontractors FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Subcontractors UPDATE policy"
  ON public.subcontractors FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant')
  );

CREATE POLICY "Subcontractors DELETE policy"
  ON public.subcontractors FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin')
  );

-- ----------------- PROJECT ASSIGNMENTS POLICIES -----------------
CREATE POLICY "Project Assignments SELECT policy"
  ON public.project_assignments FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    user_id = auth.uid()
  );

CREATE POLICY "Project Assignments INSERT policy"
  ON public.project_assignments FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

CREATE POLICY "Project Assignments UPDATE policy"
  ON public.project_assignments FOR UPDATE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  )
  WITH CHECK (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

CREATE POLICY "Project Assignments DELETE policy"
  ON public.project_assignments FOR DELETE TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director')
  );

-- =========================================================================
-- 5. USER INVITATION SYSTEM
-- =========================================================================
CREATE TYPE invitation_status AS ENUM (
  'Pending',
  'Accepted',
  'Expired',
  'Cancelled'
);

CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'Employee',
  status invitation_status NOT NULL DEFAULT 'Pending',
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User Invitations SELECT policy"
  ON public.user_invitations FOR SELECT TO authenticated
  USING (public.has_role('Super Admin'));

CREATE POLICY "User Invitations INSERT policy"
  ON public.user_invitations FOR INSERT TO authenticated
  WITH CHECK (public.has_role('Super Admin'));

CREATE POLICY "User Invitations UPDATE policy"
  ON public.user_invitations FOR UPDATE TO authenticated
  USING (public.has_role('Super Admin'))
  WITH CHECK (public.has_role('Super Admin'));

CREATE POLICY "User Invitations DELETE policy"
  ON public.user_invitations FOR DELETE TO authenticated
  USING (public.has_role('Super Admin'));

-- Attach Audit trigger to invitations and assignments
CREATE TRIGGER audit_trigger_project_assignments AFTER INSERT OR UPDATE OR DELETE ON public.project_assignments FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();
CREATE TRIGGER audit_trigger_user_invitations AFTER INSERT OR UPDATE OR DELETE ON public.user_invitations FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();
