-- Dropping the global unique constraint on category name
-- This allows different clients/companies to have categories with the same name.

ALTER TABLE public.expense_categories DROP CONSTRAINT IF EXISTS expense_categories_name_key;

-- Optionally, create a new unique constraint that includes the company_id so that a single company cannot duplicate a category.
-- ALTER TABLE public.expense_categories ADD CONSTRAINT expense_categories_name_company_key UNIQUE (name, company_id);
