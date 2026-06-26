-- HYPRO ERP Database Schema Migration
-- Designed for Supabase / PostgreSQL (Algeria context: DZD primary currency)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM for Roles
CREATE TYPE user_role AS ENUM (
  'Super Admin',
  'Financial Director',
  'Accountant',
  'Site Manager',
  'Employee',
  'Auditor'
);

-- Create ENUM for Project Status
CREATE TYPE project_status AS ENUM (
  'Planning',
  'Active',
  'Completed',
  'Delayed',
  'Archived'
);

-- Create ENUM for Approval Status
CREATE TYPE approval_status AS ENUM (
  'Pending',
  'Approved',
  'Rejected'
);

-- =========================================================================
-- TABLES DESIGN
-- =========================================================================

-- 1. Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'Employee',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. User Preferences Table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  language TEXT NOT NULL DEFAULT 'fr', -- 'fr' (default) or 'ar'
  theme TEXT NOT NULL DEFAULT 'light', -- 'light' | 'dark' | 'system'
  notification_settings JSONB NOT NULL DEFAULT '{"email": true, "push": true, "realtime": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  total_land_area NUMERIC(15, 2) NOT NULL, -- in sqm
  built_area NUMERIC(15, 2) NOT NULL,      -- in sqm
  number_of_buildings INTEGER NOT NULL DEFAULT 1,
  number_of_blocks INTEGER NOT NULL DEFAULT 1,
  number_of_floors INTEGER NOT NULL DEFAULT 1,
  number_of_apartments INTEGER NOT NULL DEFAULT 0,
  budget NUMERIC(20, 2) NOT NULL CHECK (budget >= 0), -- DZD Currency
  start_date DATE NOT NULL,
  planned_end_date DATE NOT NULL,
  actual_end_date DATE,
  status project_status NOT NULL DEFAULT 'Planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Allocations Table (Funding of projects)
CREATE TABLE IF NOT EXISTS public.allocations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  amount_dzd NUMERIC(20, 2) NOT NULL CHECK (amount_dzd > 0),
  allocated_by UUID REFERENCES public.profiles(id) NOT NULL,
  allocated_to TEXT NOT NULL, -- e.g. Site Manager name or Cashier
  notes TEXT,
  receipt_file_id TEXT, -- Google Drive File ID
  receipt_url TEXT,     -- Google Drive webViewLink
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Expense Categories Table
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- 6. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) NOT NULL,
  submitted_by UUID REFERENCES public.profiles(id) NOT NULL,
  amount_dzd NUMERIC(20, 2) NOT NULL CHECK (amount_dzd > 0),
  description TEXT NOT NULL,
  receipt_file_id TEXT, -- Google Drive File ID
  receipt_url TEXT,     -- Google Drive webViewLink
  status approval_status NOT NULL DEFAULT 'Pending',
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Subcontractors Table
CREATE TABLE IF NOT EXISTS public.subcontractors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Purchase Requests Table
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES public.profiles(id) NOT NULL,
  description TEXT NOT NULL,
  amount_dzd NUMERIC(20, 2) NOT NULL CHECK (amount_dzd > 0),
  receipt_file_id TEXT,
  receipt_url TEXT,
  status approval_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  amount_dzd NUMERIC(20, 2) NOT NULL CHECK (amount_dzd > 0),
  receipt_file_id TEXT,
  receipt_url TEXT,
  status approval_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Contracts Table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  contractor_id UUID REFERENCES public.subcontractors(id) ON DELETE CASCADE NOT NULL,
  amount_dzd NUMERIC(20, 2) NOT NULL CHECK (amount_dzd > 0),
  receipt_file_id TEXT,
  receipt_url TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Stocks Table (Materials inventory)
CREATE TABLE IF NOT EXISTS public.stocks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC(12, 2) NOT NULL CHECK (quantity >= 0),
  unit TEXT NOT NULL, -- e.g. "tonnes", "sacs", "m3"
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Equipment Table
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  equipment_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Active', -- 'Active' | 'Under Maintenance' | 'Inactive'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- INDEXING STRATEGY
-- =========================================================================

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_code ON public.projects(code);
CREATE INDEX idx_allocations_project ON public.allocations(project_id);
CREATE INDEX idx_expenses_project ON public.expenses(project_id);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_purchase_requests_project ON public.purchase_requests(project_id);
CREATE INDEX idx_purchase_orders_project ON public.purchase_orders(project_id);
CREATE INDEX idx_contracts_project ON public.contracts(project_id);
CREATE INDEX idx_stocks_project ON public.stocks(project_id);
CREATE INDEX idx_equipment_project ON public.equipment(project_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at);

-- =========================================================================
-- SECURITY FUNCTIONS & RBAC helper functions
-- =========================================================================

-- Check if user is logged in and has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is Super Admin or Financial Director
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('Super Admin', 'Financial Director')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage a project
CREATE OR REPLACE FUNCTION public.can_manage_project(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Super Admin & Financial Director can manage all projects.
  -- Site Manager can manage projects if they are Site Manager role.
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('Super Admin', 'Financial Director', 'Site Manager', 'Accountant')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if project is assigned to user based on roles, allocations, or expense history
CREATE OR REPLACE FUNCTION public.is_project_assigned_to_user(p_id UUID, u_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_full_name TEXT;
  v_role public.user_role;
BEGIN
  SELECT full_name, role INTO v_full_name, v_role
  FROM public.profiles
  WHERE id = u_id;

  -- Super Admin, Financial Director, and Accountant can access all projects
  IF v_role IN ('Super Admin', 'Financial Director', 'Accountant') THEN
    RETURN TRUE;
  END IF;

  -- Check if they have submitted an expense for this project
  IF EXISTS (
    SELECT 1 FROM public.expenses
    WHERE project_id = p_id AND submitted_by = u_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check allocations where they allocated, allocated_to matches their ID or contains their name
  IF EXISTS (
    SELECT 1 FROM public.allocations
    WHERE project_id = p_id AND (
      allocated_by = u_id OR
      allocated_to = u_id::TEXT OR
      (v_full_name IS NOT NULL AND LOWER(allocated_to) LIKE '%' || LOWER(v_full_name) || '%')
    )
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are readable by everyone authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Profiles can only be updated by the owner or Super Admin"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role('Super Admin'))
  WITH CHECK (id = auth.uid() OR public.has_role('Super Admin'));

-- User Preferences Policies
CREATE POLICY "Preferences are readable and writable by owner"
  ON public.user_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Projects Policies
CREATE POLICY "Projects are readable by all authenticated users"
  ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Projects are manageable by Admin and Financial Director"
  ON public.projects FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allocations Policies
CREATE POLICY "Allocations are readable based on roles and assignments"
  ON public.allocations FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (
      (public.has_role('Employee') OR public.has_role('Site Manager')) AND (
        allocated_by = auth.uid() OR
        allocated_to = auth.uid()::TEXT OR
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND (
            full_name IS NOT NULL AND LOWER(allocated_to) LIKE '%' || LOWER(full_name) || '%'
          )
        )
      )
    )
  );

CREATE POLICY "Allocations are insertable by Super Admin and Financial Director"
  ON public.allocations FOR INSERT TO authenticated
  WITH CHECK (public.has_role('Super Admin') OR public.has_role('Financial Director'));

-- Expenses Policies
CREATE POLICY "Expenses are readable based on roles and assignments"
  ON public.expenses FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (public.has_role('Employee') AND submitted_by = auth.uid()) OR
    (public.has_role('Site Manager') AND (
      submitted_by = auth.uid() OR
      public.is_project_assigned_to_user(project_id, auth.uid())
    ))
  );

CREATE POLICY "Expenses are insertable by Employee and Site Manager and Accountant"
  ON public.expenses FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = submitted_by AND (
      public.has_role('Employee') OR
      public.has_role('Site Manager') OR
      public.has_role('Accountant') OR
      public.has_role('Super Admin')
    )
  );

CREATE POLICY "Expenses can be approved/updated by Accountant, Financial Director, or Super Admin"
  ON public.expenses FOR UPDATE TO authenticated
  USING (
    public.has_role('Accountant') OR
    public.has_role('Financial Director') OR
    public.has_role('Super Admin')
  );

-- Suppliers Table Policies
CREATE POLICY "Suppliers are readable by all authenticated"
  ON public.suppliers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Suppliers are manageable by Admin, Fin Director, and Accountant"
  ON public.suppliers FOR ALL TO authenticated
  USING (public.has_role('Super Admin') OR public.has_role('Financial Director') OR public.has_role('Accountant'));

-- Subcontractors Table Policies
CREATE POLICY "Subcontractors are readable by all authenticated"
  ON public.subcontractors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Subcontractors are manageable by Admin, Fin Director, and Accountant"
  ON public.subcontractors FOR ALL TO authenticated
  USING (public.has_role('Super Admin') OR public.has_role('Financial Director') OR public.has_role('Accountant'));

-- Purchase Requests Policies
CREATE POLICY "Purchase Requests are readable based on roles and ownership"
  ON public.purchase_requests FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (requester_id = auth.uid())
  );

CREATE POLICY "Purchase Requests can be submitted by Site Manager/Employee"
  ON public.purchase_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Purchase Requests can be approved by Fin Director or Super Admin"
  ON public.purchase_requests FOR UPDATE TO authenticated
  USING (public.has_role('Financial Director') OR public.has_role('Super Admin'));

-- Purchase Orders Policies
CREATE POLICY "Purchase Orders are readable based on roles and assignments"
  ON public.purchase_orders FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Purchase Orders can be submitted by Accountant/Fin Director/Admin"
  ON public.purchase_orders FOR ALL TO authenticated
  USING (public.has_role('Accountant') OR public.has_role('Financial Director') OR public.has_role('Super Admin'));

-- Contracts Policies
CREATE POLICY "Contracts are readable based on roles and assignments"
  ON public.contracts FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Contracts can be created/managed by Fin Director / Accountant / Admin"
  ON public.contracts FOR ALL TO authenticated
  USING (public.has_role('Financial Director') OR public.has_role('Accountant') OR public.has_role('Super Admin'));

-- Stocks & Equipment Policies
CREATE POLICY "Stocks are readable based on roles and assignments"
  ON public.stocks FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Stocks can be managed by Site Managers, Accountants, Admins"
  ON public.stocks FOR ALL TO authenticated
  USING (public.has_role('Site Manager') OR public.has_role('Accountant') OR public.has_role('Super Admin'));

CREATE POLICY "Equipment is readable based on roles and assignments"
  ON public.equipment FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Accountant') OR
    public.has_role('Auditor') OR
    (public.has_role('Site Manager') AND public.is_project_assigned_to_user(project_id, auth.uid()))
  );

CREATE POLICY "Equipment is manageable by Site Managers, Accountants, Admins"
  ON public.equipment FOR ALL TO authenticated
  USING (public.has_role('Site Manager') OR public.has_role('Accountant') OR public.has_role('Super Admin'));

-- Notifications Policies
CREATE POLICY "Notifications are readable by target user"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Notifications can be updated (marked read) by target user"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Audit Logs are readable by Super Admin, Financial Director and Auditor only"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    public.has_role('Super Admin') OR
    public.has_role('Financial Director') OR
    public.has_role('Auditor')
  );

-- =========================================================================
-- SYSTEM TRIGGERS & AUDITING
-- =========================================================================

-- Trigger to log database changes dynamically
CREATE OR REPLACE FUNCTION public.proc_audit_logger()
RETURNS TRIGGER AS $$
DECLARE
  v_old JSONB := NULL;
  v_new JSONB := NULL;
  v_user_id UUID := auth.uid();
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
  ELSIF (TG_OP = 'INSERT') THEN
    v_new := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    v_old := to_jsonb(OLD);
  END IF;

  INSERT INTO public.audit_logs (user_id, entity, entity_id, action, old_value, new_value)
  VALUES (
    v_user_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    v_old,
    v_new
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Audit trigger to key tables
CREATE TRIGGER audit_trigger_projects AFTER INSERT OR UPDATE OR DELETE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();
CREATE TRIGGER audit_trigger_allocations AFTER INSERT OR UPDATE OR DELETE ON public.allocations FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();
CREATE TRIGGER audit_trigger_expenses AFTER INSERT OR UPDATE OR DELETE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();
CREATE TRIGGER audit_trigger_purchase_requests AFTER INSERT OR UPDATE OR DELETE ON public.purchase_requests FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();
CREATE TRIGGER audit_trigger_purchase_orders AFTER INSERT OR UPDATE OR DELETE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();
CREATE TRIGGER audit_trigger_contracts AFTER INSERT OR UPDATE OR DELETE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.proc_audit_logger();

-- =========================================================================
-- TRANSACTIONAL BUDGET CONTROL RPC FUNCTION
-- =========================================================================

CREATE OR REPLACE FUNCTION public.record_expense_with_budget_check(
  p_project_id UUID,
  p_category_id UUID,
  p_amount NUMERIC,
  p_description TEXT,
  p_submitted_by UUID,
  p_receipt_file_id TEXT DEFAULT NULL,
  p_receipt_url TEXT DEFAULT NULL
)
RETURNS public.expenses AS $$
DECLARE
  v_budget NUMERIC;
  v_current_expenses NUMERIC;
  v_new_expense public.expenses;
BEGIN
  -- 1. Fetch total project budget under strict row-level lock
  SELECT budget INTO v_budget FROM public.projects WHERE id = p_project_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Projet introuvable (ID: %).', p_project_id;
  END IF;

  -- 2. Validate current expense totals (Approved + Pending)
  SELECT COALESCE(SUM(amount_dzd), 0) INTO v_current_expenses 
  FROM public.expenses 
  WHERE project_id = p_project_id AND status != 'Rejected';

  -- 3. Reject atomically if expense exceeds remaining project budget
  IF (v_current_expenses + p_amount) > v_budget THEN
    RAISE EXCEPTION 'Dépassement budgétaire bloqué ! Le budget total du projet est de % DZD, et cette dépense porterait le total à % DZD (limite dépassée de % DZD).',
      v_budget, (v_current_expenses + p_amount), ((v_current_expenses + p_amount) - v_budget);
  END IF;

  -- 4. Record expense securely in the same transaction
  INSERT INTO public.expenses (
    project_id,
    category_id,
    amount_dzd,
    description,
    submitted_by,
    receipt_file_id,
    receipt_url,
    status
  ) VALUES (
    p_project_id,
    p_category_id,
    p_amount,
    p_description,
    p_submitted_by,
    p_receipt_file_id,
    p_receipt_url,
    'Pending'
  )
  RETURNING * INTO v_new_expense;

  RETURN v_new_expense;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

