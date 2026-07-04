const fs = require('fs');

// 1. Fix server/supabase.ts
let supabaseTs = fs.readFileSync('server/supabase.ts', 'utf8');
supabaseTs = supabaseTs.replace(
`  async createCategory(catData: { name: string }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name: catData.name }])
      .select()
      .single();
    if (error) throw sanitizeError(error);
    return data;
  },`,
`  async createCategory(catData: { name: string, is_personal?: boolean }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expense_categories')
      .insert([{ name: catData.name, is_personal: !!catData.is_personal }])
      .select()
      .single();
    if (error) throw sanitizeError(error);
    return data;
  },

  async updateCategory(id: string, catData: { name: string, is_personal?: boolean }) {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('expense_categories')
      .update({ name: catData.name, is_personal: !!catData.is_personal })
      .eq('id', id)
      .select()
      .single();
    if (error) throw sanitizeError(error);
    return data;
  },`
);
fs.writeFileSync('server/supabase.ts', supabaseTs);
console.log('Fixed supabase.ts');

// 2. Fix server.ts
let serverTs = fs.readFileSync('server.ts', 'utf8');
serverTs = serverTs.replace(
`app.post('/api/categories', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  try {
    const data = await SupabaseDbService.createCategory(req.body);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});`,
`app.post('/api/categories', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  try {
    const data = await SupabaseDbService.createCategory(req.body);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/categories/:id', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  try {
    const data = await SupabaseDbService.updateCategory(req.params.id, req.body);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});`
);
fs.writeFileSync('server.ts', serverTs);
console.log('Fixed server.ts');
