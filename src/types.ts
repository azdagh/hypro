// Types and Interfaces for HYPRO ERP (Fonds de Roulement & Construction Management)

export type UserRole = 
  | 'Super Admin'
  | 'Financial Director'
  | 'Accountant'
  | 'Site Manager'
  | 'Employee'
  | 'Auditor';

export type ProjectStatus = 
  | 'Planning'
  | 'Active'
  | 'Completed'
  | 'Delayed'
  | 'Archived';

export type ApprovalStatus = 
  | 'Pending'
  | 'Approved'
  | 'Rejected';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreference {
  id: string;
  user_id: string;
  language: 'fr' | 'ar';
  theme: 'light' | 'dark' | 'system';
  notification_settings: {
    email: boolean;
    push: boolean;
    realtime: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description?: string;
  location: string;
  total_land_area: number;
  built_area: number;
  number_of_buildings: number;
  number_of_blocks: number;
  number_of_floors: number;
  number_of_apartments: number;
  budget: number; // in DZD
  start_date: string;
  planned_end_date: string;
  actual_end_date?: string;
  status: ProjectStatus;
  technical_files?: { id: string, name: string, url: string }[];
  created_at: string;
  updated_at: string;
}

export interface Allocation {
  id: string;
  project_id: string;
  amount_dzd: number;
  allocated_by: string; // profile_id (or expanded full_name in query)
  allocated_by_name?: string;
  allocated_to: string;
  allocated_to_id?: string;
  allocated_to_name?: string;
  notes?: string;
  receipt_file_id?: string;
  receipt_url?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  project_id: string;
  project_name?: string;
  project_code?: string;
  category_id: string;
  category_name?: string;
  submitted_by: string; // profile_id
  submitted_by_name?: string;
  amount_dzd: number;
  description: string;
  receipt_file_id?: string;
  receipt_url?: string;
  status: ApprovalStatus;
  rejection_reason?: string;
  submitted_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at: string;
}

export interface Subcontractor {
  id: string;
  company_name: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  created_at: string;
}

export interface PurchaseRequest {
  id: string;
  project_id: string;
  project_name?: string;
  requester_id: string;
  requester_name?: string;
  description: string;
  amount_dzd: number;
  receipt_file_id?: string;
  receipt_url?: string;
  status: ApprovalStatus;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  supplier_id: string;
  supplier_name?: string;
  project_id: string;
  project_name?: string;
  amount_dzd: number;
  receipt_file_id?: string;
  receipt_url?: string;
  status: ApprovalStatus;
  created_at: string;
}

export interface Contract {
  id: string;
  project_id: string;
  project_name?: string;
  contractor_id: string;
  contractor_name?: string;
  amount_dzd: number;
  receipt_file_id?: string;
  receipt_url?: string;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Stock {
  id: string;
  project_id: string;
  project_name?: string;
  item_name: string;
  quantity: number;
  unit: string;
  min_alert_threshold?: number;
  updated_at: string;
}

export type StockItem = Stock;


export interface Equipment {
  id: string;
  project_id: string;
  project_name?: string;
  equipment_name: string;
  status: 'Active' | 'Under Maintenance' | 'Inactive';
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  entity: string;
  entity_id: string;
  action: string;
  old_value?: any;
  new_value?: any;
  created_at: string;
}

export interface OnlineQueueItem {
  id: string;
  action: 'CREATE_EXPENSE' | 'CREATE_ALLOCATION' | 'CREATE_PURCHASE_REQUEST' | 'UPDATE_EXPENSE_STATUS';
  payload: any;
  timestamp: number;
}
