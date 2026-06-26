-- Add status column to contracts table
ALTER TABLE public.contracts 
  ADD COLUMN IF NOT EXISTS status approval_status NOT NULL DEFAULT 'Pending';

-- Add RLS policy to allow Super Admin / Financial Director to update PO and Contract status
DROP POLICY IF EXISTS "PO status can be updated by admins" ON public.purchase_orders;
CREATE POLICY "PO status can be updated by admins"
  ON public.purchase_orders FOR UPDATE TO authenticated
  USING (public.has_role('Super Admin') OR public.has_role('Financial Director'))
  WITH CHECK (public.has_role('Super Admin') OR public.has_role('Financial Director'));

DROP POLICY IF EXISTS "Contract status can be updated by admins" ON public.contracts;
CREATE POLICY "Contract status can be updated by admins"
  ON public.contracts FOR UPDATE TO authenticated
  USING (public.has_role('Super Admin') OR public.has_role('Financial Director'))
  WITH CHECK (public.has_role('Super Admin') OR public.has_role('Financial Director'));
