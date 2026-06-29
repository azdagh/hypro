import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AsyncLocalStorage } from 'async_hooks';

export const supabaseClientLS = new AsyncLocalStorage<SupabaseClient>();

let supabaseInstance: SupabaseClient | null = null;

/**
 * Lazy initialization of the Supabase Client to prevent app crashes if credentials are not yet configured.
 */
export function getSupabase(): SupabaseClient {
  const reqClient = supabaseClientLS.getStore();
  if (reqClient) {
    return reqClient;
  }
  if (!supabaseInstance) {
    const rawUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!rawUrl || !supabaseAnonKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required for live Supabase connections.'
      );
    }
    const supabaseUrl = rawUrl.trim().replace(/\/$/, '');
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Server-side environment
        autoRefreshToken: false,
      },
    });
  }
  return supabaseInstance;
}

let supabaseServiceRoleInstance: SupabaseClient | null = null;

/**
 * Lazy initialization of the Service Role Supabase Client for administrative tasks.
 */
export function getServiceRoleSupabase(): SupabaseClient {
  if (!supabaseServiceRoleInstance) {
    const rawUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!rawUrl || !serviceRoleKey) {
      throw new Error(
        'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required for admin operations.'
      );
    }
    const supabaseUrl = rawUrl.trim().replace(/\/$/, '');
    supabaseServiceRoleInstance = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseServiceRoleInstance;
}

/**
 * Startup Validation Service
 * Fails fast by throwing an informative error if any required environment variable is missing.
 */
export function validateEnvironmentVariables() {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'GOOGLE_DRIVE_FOLDER_ID',
  ];
  const missing = required.filter((v) => !process.env[v]);
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  }
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_PRIVATE_KEY) {
    missing.push('GOOGLE_PRIVATE_KEY');
  }
  if (missing.length > 0) {
    throw new Error(
      `CRITICAL CONFIGURATION ERROR: Missing required environment variables on boot: ${missing.join(', ')}`
    );
  }
}

/**
 * REAL AUTHENTICATION MODULE
 */
export const SupabaseAuthService = {
  async login(email: string, passwordInput: string) {
    const supabase = getSupabase();
    const supabaseAdmin = getServiceRoleSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: passwordInput,
    });
    if (error) throw error;

    // Fetch the linked profile
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profileErr || !profile) {
      // Automatic profile fallback generation in case trigger is delayed
      const fallbackProfile = {
        id: data.user.id,
        email: (data.user.email || email).toLowerCase(),
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: 'Employee',
      };
      await supabaseAdmin.from('profiles').upsert([fallbackProfile], { onConflict: 'id' });
      return { user: fallbackProfile, session: data.session };
    }

    return { user: profile, session: data.session };
  },

  async logout() {
    const supabase = getSupabase();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string, redirectUrl?: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl || `${process.env.APP_URL || 'http://localhost:3000'}/reset-password`,
    });
    if (error) throw error;
    return data;
  }
};

/**
 * REAL DATABASE SERVICE (Supabase PostgreSQL CRUD Operations)
 */
export const SupabaseDbService = {
  // Profiles
  async getProfileByEmail(email: string) {
    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', email.trim())
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getProfile(id: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getProfiles() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Preferences
  async getPreferences(userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data || { language: 'fr', theme: 'light', notification_settings: { email: true, push: true, realtime: true } };
  },

  async updatePreferences(userId: string, prefs: any) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({ user_id: userId, ...prefs })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  // Assignments
  async getMyAssignments(userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('project_assignments')
      .select('*')
      .eq('user_id', userId);
    if (error) throw error;
    return data;
  },

  // Projects
  async getProjects() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('code', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getProject(id: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createProject(projectData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        code: projectData.code,
        name: projectData.name,
        description: projectData.description || '',
        location: projectData.location,
        total_land_area: Number(projectData.total_land_area || 0),
        built_area: Number(projectData.built_area || 0),
        number_of_buildings: Number(projectData.number_of_buildings || 1),
        number_of_blocks: Number(projectData.number_of_blocks || 1),
        number_of_floors: Number(projectData.number_of_floors || 1),
        number_of_apartments: Number(projectData.number_of_apartments || 0),
        budget: Number(projectData.budget || 0),
        start_date: projectData.start_date,
        planned_end_date: projectData.planned_end_date,
        status: projectData.status || 'Planning'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateProject(id: string, updates: any, userId: string) {
    const supabase = getSupabase();
    const cleanUpdates: Record<string, any> = {};
    const allowed = [
      'code', 'name', 'description', 'location', 'total_land_area', 'built_area',
      'number_of_buildings', 'number_of_blocks', 'number_of_floors',
      'number_of_apartments', 'budget', 'start_date', 'planned_end_date', 'status'
    ];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        if (typeof updates[key] === 'number') {
          cleanUpdates[key] = Number(updates[key]);
        } else {
          cleanUpdates[key] = updates[key];
        }
      }
    }
    const { data, error } = await supabase
      .from('projects')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProject(id: string, userId: string) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  // Allocations
  async getAllocations() {
    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase
      .from('allocations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const projectIds = [...new Set((data || []).map((a: any) => a.project_id).filter(Boolean))];
    const profileIds = [
      ...new Set(
        (data || [])
          .flatMap((a: any) => [a.allocated_by, a.allocated_to])
          .filter(Boolean)
      ),
    ];

    const [{ data: projects }, { data: profiles }] = await Promise.all([
      projectIds.length
        ? supabase.from('projects').select('id, name').in('id', projectIds)
        : Promise.resolve({ data: [] as any[] }),
      profileIds.length
        ? supabase.from('profiles').select('id, full_name').in('id', profileIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const projectsById = new Map((projects || []).map((project: any) => [project.id, project]));
    const profilesById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));

    return (data || []).map((allocation: any) => ({
      ...allocation,
      project_name: projectsById.get(allocation.project_id)?.name,
      allocated_by_name: profilesById.get(allocation.allocated_by)?.full_name,
      allocated_to: profilesById.get(allocation.allocated_to)?.full_name || allocation.allocated_to,
    }));
  },

  async createAllocation(allocData: any, userId: string) {
    const supabase = getSupabase();
    let allocatedTo = allocData.allocated_to;

    if (allocatedTo && typeof allocatedTo === 'string' && !/^[0-9a-f-]{36}$/i.test(allocatedTo)) {
      const { data: profileByName } = await getServiceRoleSupabase()
        .from('profiles')
        .select('id')
        .ilike('full_name', allocatedTo.trim())
        .maybeSingle();
      allocatedTo = profileByName?.id || userId;
    }

    const { data, error } = await supabase
      .from('allocations')
      .insert([{
        project_id: allocData.project_id || null,
        amount_dzd: Number(allocData.amount_dzd),
        allocated_by: userId,
        allocated_to: allocatedTo || userId,
        notes: allocData.notes || '',
        receipt_file_id: allocData.receipt_file_id || null,
        receipt_url: allocData.receipt_url || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteAllocation(id: string, userId: string) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('allocations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Categories
  async getCategories() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expense_categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    
    // Auto-seed if empty
    if (data.length === 0) {
      const defaultCategories = [
        { name: 'Gros Œuvre & Fondations' },
        { name: 'Second Œuvre & Plâtre' },
        { name: 'Matériaux & Ciment' },
        { name: 'Main d\'Œuvre & Journaliers' },
        { name: 'Location Engins & Camions' },
        { name: 'Carburant & Logistique' },
        { name: 'Sécurité & Équipements (EPI)' },
        { name: 'Frais Administratifs & Bureau' }
      ];
      await supabase.from('expense_categories').insert(defaultCategories);
      const { data: newData } = await supabase.from('expense_categories').select('*').order('name', { ascending: true });
      return newData || [];
    }
    return data;
  },

  async createCategory(catData: { name: string }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name: catData.name }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCategory(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('expense_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Expenses with TRANSACTION-SAFE BUDGET VALIDATION RPC
  async getExpenses() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expenses')
      .select('*, projects(name), expense_categories(name), profiles(full_name)')
      .order('submitted_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createExpense(expenseData: any, userId: string) {
    const supabase = getSupabase();
    
    // Call the PostgreSQL transaction-safe stored procedure that performs checks and records atomically.
    const { data, error } = await supabase.rpc('record_expense_with_budget_check', {
      p_project_id: expenseData.project_id,
      p_category_id: expenseData.category_id,
      p_amount: Number(expenseData.amount_dzd),
      p_description: expenseData.description,
      p_submitted_by: userId,
      p_receipt_file_id: expenseData.receipt_file_id || null,
      p_receipt_url: expenseData.receipt_url || null
    });

    if (error) throw error;
    return data;
  },

  async updateExpenseStatus(id: string, status: string, rejectionReason: string | undefined, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expenses')
      .update({
        status,
        rejection_reason: rejectionReason || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string, userId: string) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Suppliers & Subcontractors
  async getSuppliers() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('company_name', { ascending: true });
    if (error) throw error;
    return data.map((s: any) => ({ ...s, name: s.company_name }));
  },

  async createSupplier(supplierData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('suppliers')
      .insert([{
        company_name: supplierData.name || supplierData.company_name,
        contact_name: supplierData.contact_name || '',
        phone: supplierData.phone || '',
        email: supplierData.email || '',
        address: supplierData.address || ''
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getSubcontractors() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subcontractors')
      .select('*')
      .order('company_name', { ascending: true });
    if (error) throw error;
    return data.map((s: any) => ({ ...s, name: s.company_name }));
  },

  async createSubcontractor(subData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('subcontractors')
      .insert([{
        company_name: subData.name || subData.company_name,
        contact_name: subData.contact_name || '',
        phone: subData.phone || '',
        email: subData.email || ''
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Purchase Requests
  async getPurchaseRequests() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('purchase_requests')
      .select('*, projects(name), profiles(full_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      item_description: item.description,
      estimated_amount_dzd: item.amount_dzd,
      requested_by_name: item.profiles?.full_name,
      name: item.company_name
    }));
  },

  async createPurchaseRequest(prData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('purchase_requests')
      .insert([{
        project_id: prData.project_id,
        requester_id: userId,
        description: prData.item_description + (prData.quantity ? '\nQuantité: ' + prData.quantity + ' ' + prData.unit : '') + (prData.suggested_supplier_name ? '\nFournisseur Suggéré: ' + prData.suggested_supplier_name : ''),
        amount_dzd: Number(prData.estimated_amount_dzd || 0),
        receipt_file_id: prData.receipt_file_id || null,
        receipt_url: prData.receipt_url || null,
        status: 'Pending'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async approvePurchaseRequest(id: string, status: string, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('purchase_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Purchase Orders
  async getPurchaseOrders() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*, suppliers(company_name), projects(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      supplier_name: item.suppliers?.company_name,
      project_name: item.projects?.name,
      total_amount_dzd: item.amount_dzd
    }));
  },

  async createPurchaseOrder(poData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('purchase_orders')
      .insert([{
        supplier_id: poData.supplier_id,
        project_id: poData.project_id,
        amount_dzd: Number(poData.total_amount_dzd || poData.amount_dzd || 0),
        receipt_file_id: poData.receipt_file_id || null,
        receipt_url: poData.receipt_url || null,
        status: 'Pending'
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Contracts
  async getContracts() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contracts')
      .select('*, subcontractors(company_name), projects(name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      contractor_name: item.subcontractors?.company_name,
      project_name: item.projects?.name,
      total_amount_dzd: item.amount_dzd,
      subcontractor_id: item.contractor_id
    }));
  },

  async createContract(contractData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contracts')
      .insert([{
        project_id: contractData.project_id,
        contractor_id: contractData.subcontractor_id || contractData.contractor_id,
        amount_dzd: Number(contractData.total_amount_dzd || contractData.amount_dzd || 0),
        receipt_file_id: contractData.receipt_file_id || null,
        receipt_url: contractData.receipt_url || null,
        start_date: contractData.start_date,
        end_date: contractData.end_date
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePurchaseOrderStatus(id: string, status: string, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateContractStatus(id: string, status: string, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('contracts')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Stocks
  async getStocks() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('stocks')
      .select('*, projects(name)')
      .order('item_name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createStock(stockData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('stocks')
      .insert([{
        project_id: stockData.project_id,
        item_name: stockData.item_name,
        quantity: Number(stockData.quantity),
        unit: stockData.unit,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStockQuantity(id: string, quantity: number, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('stocks')
      .update({
        quantity: Number(quantity),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Equipment
  async getEquipment() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('equipment')
      .select('*, projects(name)')
      .order('equipment_name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createEquipment(eqData: any, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('equipment')
      .insert([{
        project_id: eqData.project_id,
        equipment_name: eqData.equipment_name,
        status: eqData.status || 'Active',
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateEquipmentStatus(id: string, status: string, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('equipment')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Notifications
  async getNotifications(userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markNotificationRead(id: string, userId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Audit Logs (Triggers write these automatically! Read here)
  async getAuditLogs() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // -------------------------------------------------------------------------
  // USER ADMINISTRATION MODULE METHODS
  // -------------------------------------------------------------------------
  async getAdminUsers() {
    const supabaseAdmin = getServiceRoleSupabase();
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (pErr) throw pErr;

    const { data: authUsers, error: aErr } = await supabaseAdmin.auth.admin.listUsers();
    const usersList = (authUsers?.users || []) as any[];
    
    return profiles.map(p => {
      const au = usersList.find(u => u.id === p.id);
      return {
        ...p,
        email_confirmed: au?.email_confirmed_at ? true : false,
        last_sign_in_at: au?.last_sign_in_at || null,
        banned: au?.banned_until ? true : false,
        raw_user_meta_data: au?.user_metadata || {},
      };
    });
  },

  async adminCreateUser(userData: any, adminUserId: string) {
    const supabaseAdmin = getServiceRoleSupabase();
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password || 'TemporaryPassword123!',
      email_confirm: true,
      user_metadata: { full_name: userData.full_name }
    });

    if (createError) throw createError;

    const profileData = {
      id: newUser.user.id,
      email: userData.email.toLowerCase(),
      full_name: userData.full_name,
      role: userData.role || 'Employee',
      phone: userData.phone || null,
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert([profileData], { onConflict: 'id' });

    if (profileError) throw profileError;

    await supabaseAdmin.from('audit_logs').insert([{
      user_id: adminUserId,
      entity: 'profiles',
      entity_id: newUser.user.id,
      action: 'INSERT',
      new_value: profileData
    }]);

    return { success: true, user: profileData };
  },

  async adminUpdateUser(id: string, updates: any, adminUserId: string) {
    const supabaseAdmin = getServiceRoleSupabase();

    const { data: oldProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    const profileUpdates: Record<string, any> = {};
    if (updates.full_name !== undefined) profileUpdates.full_name = updates.full_name;
    if (updates.role !== undefined) profileUpdates.role = updates.role;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;

    const { data: updatedProfile, error: pError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', id)
      .select()
      .single();

    if (pError) throw pError;

    if (updates.full_name !== undefined) {
      await supabaseAdmin.auth.admin.updateUserById(id, {
        user_metadata: { full_name: updates.full_name }
      });
    }

    await supabaseAdmin.from('audit_logs').insert([{
      user_id: adminUserId,
      entity: 'profiles',
      entity_id: id,
      action: 'UPDATE',
      old_value: oldProfile,
      new_value: updatedProfile
    }]);

    return updatedProfile;
  },

  async adminDisableUser(id: string, adminUserId: string) {
    const supabaseAdmin = getServiceRoleSupabase();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: '87600h'
    });
    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert([{
      user_id: adminUserId,
      entity: 'profiles',
      entity_id: id,
      action: 'DISABLE',
      new_value: { status: 'Disabled' }
    }]);

    return { success: true };
  },

  async adminReactivateUser(id: string, adminUserId: string) {
    const supabaseAdmin = getServiceRoleSupabase();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      ban_duration: 'none'
    });
    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert([{
      user_id: adminUserId,
      entity: 'profiles',
      entity_id: id,
      action: 'REACTIVATE',
      new_value: { status: 'Active' }
    }]);

    return { success: true };
  },

  async adminResetPassword(id: string, newPasswordInput: string, adminUserId: string) {
    const supabaseAdmin = getServiceRoleSupabase();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPasswordInput
    });
    if (error) throw error;

    await supabaseAdmin.from('audit_logs').insert([{
      user_id: adminUserId,
      entity: 'profiles',
      entity_id: id,
      action: 'PASSWORD_RESET'
    }]);

    return { success: true };
  },

  // -------------------------------------------------------------------------
  // USER INVITATION MODULE METHODS
  // -------------------------------------------------------------------------
  async getInvitations() {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createInvitation(invData: any, adminUserId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_invitations')
      .insert([{
        email: invData.email.toLowerCase(),
        full_name: invData.full_name,
        role: invData.role || 'Employee',
        status: 'Pending',
        invited_by: adminUserId,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateInvitationStatus(id: string, status: string, adminUserId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('user_invitations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // -------------------------------------------------------------------------
  // PROJECT ASSIGNMENTS METHODS
  // -------------------------------------------------------------------------
  async getProjectAssignments() {
    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase
      .from('project_assignments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const projectIds = [...new Set((data || []).map((a: any) => a.project_id).filter(Boolean))];
    const profileIds = [
      ...new Set(
        (data || [])
          .flatMap((a: any) => [a.user_id, a.assigned_by])
          .filter(Boolean)
      ),
    ];

    const [{ data: projects }, { data: profiles }] = await Promise.all([
      projectIds.length
        ? supabase.from('projects').select('id, name, code').in('id', projectIds)
        : Promise.resolve({ data: [] as any[] }),
      profileIds.length
        ? supabase.from('profiles').select('id, full_name, email, role').in('id', profileIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const projectsById = new Map((projects || []).map((project: any) => [project.id, project]));
    const profilesById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));

    return (data || []).map((assignment: any) => ({
      ...assignment,
      projects: projectsById.get(assignment.project_id),
      profiles: profilesById.get(assignment.user_id),
      assigned_by_user: profilesById.get(assignment.assigned_by),
    }));
  },

  async createProjectAssignment(assignmentData: any, adminUserId: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('project_assignments')
      .insert([{
        project_id: assignmentData.project_id,
        user_id: assignmentData.user_id,
        assignment_role: assignmentData.assignment_role || 'Site Manager',
        assigned_by: adminUserId
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteProjectAssignment(id: string, adminUserId: string) {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('project_assignments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true };
  }
};

/**
 * Super Admin Bootstrap Process
 * Executed once during startup. Checks if a Super Admin exists. If not, it creates one.
 */
export async function bootstrapSuperAdmin() {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const fullName = process.env.INITIAL_ADMIN_FULL_NAME || 'Super Admin';

  if (!email || !password) {
    console.log('[Bootstrap] INITIAL_ADMIN_EMAIL/PASSWORD not specified. Skipping admin bootstrap.');
    return;
  }

  try {
    const supabaseAdmin = getServiceRoleSupabase();

    const { data: admins, error: selectError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'Super Admin')
      .limit(1);

    if (selectError) {
      console.error('[Bootstrap] Failed checking existing admins:', selectError.message);
      return;
    }

    if (admins && admins.length > 0) {
      console.log('[Bootstrap] Super Admin already exists. Bootstrap skipped.');
      return;
    }

    console.log(`[Bootstrap] Creating Super Admin user for email: ${email}`);

    const { data: listUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('[Bootstrap] Failed listing auth users:', listError.message);
      return;
    }

    const authUsersList = (listUsers?.users || []) as any[];
    let existingAuthUser = authUsersList.find(u => u.email?.toLowerCase() === email.toLowerCase());
    let userId: string;

    if (existingAuthUser) {
      userId = existingAuthUser.id;
      console.log('[Bootstrap] Auth user exists. Re-linking profile.');
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (createError) {
        console.error('[Bootstrap] Failed to create auth user:', createError.message);
        return;
      }
      userId = newUser.user.id;
    }

    const profileData = {
      id: userId,
      email: email.toLowerCase(),
      full_name: fullName,
      role: 'Super Admin',
      phone: '+213 555 00 00 00'
    };

    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .upsert([profileData], { onConflict: 'id' });

    if (insertError) {
      console.error('[Bootstrap] Failed to insert Super Admin profile:', insertError.message);
      return;
    }

    await supabaseAdmin.from('audit_logs').insert([{
      user_id: userId,
      entity: 'profiles',
      entity_id: userId,
      action: 'BOOTSTRAP',
      new_value: { email, full_name: fullName, role: 'Super Admin' }
    }]);

    console.log('[Bootstrap] Super Admin bootstrap completed successfully!');
  } catch (e: any) {
    console.error('[Bootstrap] Unexpected error in bootstrap process:', e.message);
  }
}
