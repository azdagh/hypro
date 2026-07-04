const fs = require('fs');

// ─────────────────────────────────────────────────────────────
// 1. PATCH server/supabase.ts
// ─────────────────────────────────────────────────────────────
let s = fs.readFileSync('server/supabase.ts', 'utf8');

// Add getCompanyId helper after SupabaseDbService opening
s = s.replace(
  `export const SupabaseDbService = {\n  // Profiles`,
  `export const SupabaseDbService = {\n  // Multi-tenant: get company_id for a user\n  async getCompanyId(userId: string): Promise<string | null> {\n    const supabase = getServiceRoleSupabase();\n    const { data } = await supabase.from('profiles').select('company_id').eq('id', userId).maybeSingle();\n    return data?.company_id || null;\n  },\n\n  // Companies (Master Admin only)\n  async getCompanies() {\n    const supabase = getServiceRoleSupabase();\n    const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async createCompany(companyData: { name: string, logo_url?: string }) {\n    const supabase = getServiceRoleSupabase();\n    const { data, error } = await supabase\n      .from('companies')\n      .insert([{ name: companyData.name, logo_url: companyData.logo_url || null, subscription_status: 'active' }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async updateCompany(id: string, updates: { name?: string, logo_url?: string, subscription_status?: string }) {\n    const supabase = getServiceRoleSupabase();\n    const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select().single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async deleteCompany(id: string) {\n    const supabase = getServiceRoleSupabase();\n    const { error } = await supabase.from('companies').delete().eq('id', id);\n    if (error) throw sanitizeError(error);\n  },\n\n  // Profiles`
);

// Inject company_id into createProject
s = s.replace(
  `        status: projectData.status || 'Planning'\n      }])`,
  `        status: projectData.status || 'Planning',\n        company_id: projectData.company_id || null\n      }])`
);

// Inject company_id into createAllocation
s = s.replace(
  `        receipt_file_id: allocData.receipt_file_id || null,\n        receipt_url: allocData.receipt_url || null,\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async deleteAllocation`,
  `        receipt_file_id: allocData.receipt_file_id || null,\n        receipt_url: allocData.receipt_url || null,\n        company_id: allocData.company_id || null,\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async deleteAllocation`
);

// Inject company_id into createSupplier
s = s.replace(
  `        address: supplierData.address || ''\n      }])`,
  `        address: supplierData.address || '',\n        company_id: supplierData.company_id || null\n      }])`
);

// Inject company_id into createSubcontractor
s = s.replace(
  `        email: subData.email || ''\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async deleteSubcontractor`,
  `        email: subData.email || '',\n        company_id: subData.company_id || null\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async deleteSubcontractor`
);

// Inject company_id into createPurchaseRequest
s = s.replace(
  `        status: 'Pending'\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async approvePurchaseRequest`,
  `        status: 'Pending',\n        company_id: prData.company_id || null\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async approvePurchaseRequest`
);

// Inject company_id into createPurchaseOrder
s = s.replace(
  `        status: 'Pending'\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  // Contracts`,
  `        status: 'Pending',\n        company_id: poData.company_id || null\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  // Contracts`
);

// Inject company_id into createContract
s = s.replace(
  `        start_date: contractData.start_date,\n        end_date: contractData.end_date\n      }])`,
  `        start_date: contractData.start_date,\n        end_date: contractData.end_date,\n        company_id: contractData.company_id || null\n      }])`
);

// Inject company_id into createStock
s = s.replace(
  `        updated_at: new Date().toISOString()\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async updateStockQuantity`,
  `        company_id: stockData.company_id || null,\n        updated_at: new Date().toISOString()\n      }])\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async updateStockQuantity`
);

// Inject company_id into createEquipment
s = s.replace(
  `        status: eqData.status || 'Active',\n        updated_at: new Date().toISOString()\n      }])`,
  `        status: eqData.status || 'Active',\n        company_id: eqData.company_id || null,\n        updated_at: new Date().toISOString()\n      }])`
);

// Inject company_id into adminCreateUser - add company_id to profileData
s = s.replace(
  `    const profileData = {\n      id: newUser.user.id,\n      email: userData.email.toLowerCase(),\n      full_name: userData.full_name,\n      role: userData.role || 'Employee',\n      phone: userData.phone || null,\n    };`,
  `    const profileData = {\n      id: newUser.user.id,\n      email: userData.email.toLowerCase(),\n      full_name: userData.full_name,\n      role: userData.role || 'Employee',\n      phone: userData.phone || null,\n      company_id: userData.company_id || null,\n    };`
);

// Add category updateCategory if not already there
if (!s.includes('async updateCategory')) {
  s = s.replace(
    `  async deleteCategory(id: string) {`,
    `  async updateCategory(id: string, catData: { name: string, is_personal?: boolean }) {\n    const supabase = getSupabase();\n    const { data, error } = await supabase\n      .from('expense_categories')\n      .update({ name: catData.name, is_personal: !!catData.is_personal })\n      .eq('id', id)\n      .select()\n      .single();\n    if (error) throw sanitizeError(error);\n    return data;\n  },\n\n  async deleteCategory(id: string) {`
  );
}

// Fix createCategory to support is_personal
s = s.replace(
  `  async createCategory(catData: { name: string }) {\n    const supabase = getSupabase();\n    const { data, error } = await supabase\n      .from('expense_categories')\n      .insert([{ name: catData.name }])`,
  `  async createCategory(catData: { name: string, is_personal?: boolean, company_id?: string }) {\n    const supabase = getSupabase();\n    const { data, error } = await supabase\n      .from('expense_categories')\n      .insert([{ name: catData.name, is_personal: !!catData.is_personal, company_id: catData.company_id || null }])`
);

fs.writeFileSync('server/supabase.ts', s);
console.log('Done: server/supabase.ts');

// ─────────────────────────────────────────────────────────────
// 2. PATCH server.ts - add Master Admin endpoints + inject company_id
// ─────────────────────────────────────────────────────────────
let t = fs.readFileSync('server.ts', 'utf8');

// Add Master Admin endpoints before the categories block
const masterAdminEndpoints = `
// ── MASTER ADMIN ENDPOINTS (your private endpoints to manage clients) ──────────
const MASTER_ADMIN_KEY = process.env.MASTER_ADMIN_KEY || 'hypro-master-secret-2024';

function requireMasterAdmin(req: any, res: any, next: any) {
  const key = req.headers['x-master-admin-key'];
  if (key !== MASTER_ADMIN_KEY) return res.status(403).json({ error: 'Forbidden' });
  next();
}

app.get('/master/companies', requireMasterAdmin, async (req, res) => {
  try {
    const data = await SupabaseDbService.getCompanies();
    res.json(data);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/master/companies', requireMasterAdmin, async (req, res) => {
  try {
    const data = await SupabaseDbService.createCompany(req.body);
    res.status(201).json(data);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.put('/master/companies/:id', requireMasterAdmin, async (req, res) => {
  try {
    const data = await SupabaseDbService.updateCompany(req.params.id, req.body);
    res.json(data);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.delete('/master/companies/:id', requireMasterAdmin, async (req, res) => {
  try {
    await SupabaseDbService.deleteCompany(req.params.id);
    res.json({ success: true });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// Provision a new user under a specific company (Master Admin creates the first Super Admin for a client)
app.post('/master/provision-user', requireMasterAdmin, async (req, res) => {
  try {
    const result = await SupabaseDbService.adminCreateUser({ ...req.body, role: req.body.role || 'Super Admin' }, 'master-admin');
    res.status(201).json(result);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// User-facing: get the current user's company info
app.get('/api/my-company', async (req: any, res) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const companyId = await SupabaseDbService.getCompanyId(req.user.id);
    if (!companyId) return res.json(null);
    const companies = await SupabaseDbService.getCompanies();
    const company = companies.find((c: any) => c.id === companyId);
    res.json(company || null);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

`;

// Insert before the categories block
t = t.replace('// Categories\napp.get(\'/api/categories\'', masterAdminEndpoints + '// Categories\napp.get(\'/api/categories\'');

// Inject company_id into project creation
t = t.replace(
  `    const data = await SupabaseDbService.createProject(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createProject({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into allocation creation  
t = t.replace(
  `    const data = await SupabaseDbService.createAllocation(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createAllocation({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into supplier creation
t = t.replace(
  `    const data = await SupabaseDbService.createSupplier(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createSupplier({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into subcontractor creation
t = t.replace(
  `    const data = await SupabaseDbService.createSubcontractor(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createSubcontractor({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into purchase request creation
t = t.replace(
  `    const data = await SupabaseDbService.createPurchaseRequest(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createPurchaseRequest({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into purchase order creation
t = t.replace(
  `    const data = await SupabaseDbService.createPurchaseOrder(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createPurchaseOrder({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into contract creation
t = t.replace(
  `    const data = await SupabaseDbService.createContract(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createContract({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into stock creation
t = t.replace(
  `    const data = await SupabaseDbService.createStock(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createStock({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into equipment creation
t = t.replace(
  `    const data = await SupabaseDbService.createEquipment(req.body, userId);`,
  `    const companyId = await SupabaseDbService.getCompanyId(userId);\n    const data = await SupabaseDbService.createEquipment({ ...req.body, company_id: companyId }, userId);`
);

// Inject company_id into category creation
t = t.replace(
  `    const data = await SupabaseDbService.createCategory(req.body);`,
  `    const companyId = await SupabaseDbService.getCompanyId((req as any).user?.id);\n    const data = await SupabaseDbService.createCategory({ ...req.body, company_id: companyId });`
);

fs.writeFileSync('server.ts', t);
console.log('Done: server.ts');
