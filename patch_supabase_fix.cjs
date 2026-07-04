const fs = require('fs');
let s = fs.readFileSync('server/supabase.ts', 'utf8');

// Find the SupabaseDbService opening line
const marker = 'export const SupabaseDbService = {';
const idx = s.indexOf(marker);
if (idx === -1) { console.error('MARKER NOT FOUND'); process.exit(1); }

const insertAfter = idx + marker.length;

const newMethods = `
  // Multi-tenant: get company_id for a user
  async getCompanyId(userId: string): Promise<string | null> {
    if (!userId) return null;
    const supabase = getServiceRoleSupabase();
    const { data } = await supabase.from('profiles').select('company_id').eq('id', userId).maybeSingle();
    return data?.company_id || null;
  },

  // Companies (Master Admin only)
  async getCompanies() {
    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase.from('companies').select('*').order('name', { ascending: true });
    if (error) throw sanitizeError(error);
    return data || [];
  },

  async createCompany(companyData: { name: string, logo_url?: string }) {
    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase
      .from('companies')
      .insert([{ name: companyData.name, logo_url: companyData.logo_url || null, subscription_status: 'active' }])
      .select().single();
    if (error) throw sanitizeError(error);
    return data;
  },

  async updateCompany(id: string, updates: { name?: string, logo_url?: string, subscription_status?: string }) {
    const supabase = getServiceRoleSupabase();
    const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select().single();
    if (error) throw sanitizeError(error);
    return data;
  },

  async deleteCompany(id: string) {
    const supabase = getServiceRoleSupabase();
    const { error } = await supabase.from('companies').delete().eq('id', id);
    if (error) throw sanitizeError(error);
  },
`;

s = s.substring(0, insertAfter) + newMethods + s.substring(insertAfter);
fs.writeFileSync('server/supabase.ts', s);
console.log('Injected multi-tenant methods into supabase.ts');
