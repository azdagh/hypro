const fs = require('fs');
let a = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add Company import to types
a = a.replace(
  `  Project, Allocation, Expense, PurchaseRequest, \n  PurchaseOrder, Contract, Supplier, Subcontractor, \n  StockItem, Equipment, AuditLog, ExpenseCategory, UserRole \n} from './types';`,
  `  Project, Allocation, Expense, PurchaseRequest, \n  PurchaseOrder, Contract, Supplier, Subcontractor, \n  StockItem, Equipment, AuditLog, ExpenseCategory, UserRole, Company \n} from './types';`
);

// 2. Add company state after auditLogs state
a = a.replace(
  `  const [myAssignments, setMyAssignments] = useState<any[]>([]);\n  const [profiles, setProfiles] = useState<any[]>([]);`,
  `  const [myAssignments, setMyAssignments] = useState<any[]>([]);\n  const [profiles, setProfiles] = useState<any[]>([]);\n  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);`
);

// 3. Fetch company info after fetching data
a = a.replace(
  `    } catch (err) {  console.error('Error loading HYPRO ERP data:', err);\n    } finally {\n      setLoading(false);\n    }\n  };`,
  `    } catch (err) {  console.error('Error loading HYPRO ERP data:', err);\n    } finally {\n      setLoading(false);\n    }\n    // Fetch company info\n    try {\n      const compRes = await secureFetch('/api/my-company');\n      if (compRes.ok) {\n        const comp = await compRes.json();\n        setCurrentCompany(comp);\n      }\n    } catch (_) {}\n  };`
);

// 4. Add Master Admin sidebar button (after the 'admin' tab button)
a = a.replace(
  `            {activeRole === 'Super Admin' && (\n              <button \n                onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}\n                className={\`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors \${activeTab === 'admin' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}\`}\n              >\n                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Contrôle & Sécurité\n              </button>\n            )}`,
  `            {activeRole === 'Super Admin' && (\n              <button \n                onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}\n                className={\`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors \${activeTab === 'admin' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}\`}\n              >\n                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Contrôle & Sécurité\n              </button>\n            )}\n\n            {activeRole === 'Super Admin' && (\n              <button \n                onClick={() => { setActiveTab('master-admin'); setIsMobileMenuOpen(false); }}\n                className={\`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors \${activeTab === 'master-admin' ? 'bg-violet-500/10 text-violet-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}\`}\n              >\n                <Globe className="w-4 h-4 text-violet-400" /> 🌍 Gestion Clients\n              </button>\n            )}`
);

// 5. Show company name in sidebar footer
a = a.replace(
  `              <p className="font-bold text-white leading-none truncate">{currentUser.full_name}</p>\n              <span className="text-[10px] text-slate-400 font-mono block mt-1">{activeRole}</span>`,
  `              <p className="font-bold text-white leading-none truncate">{currentUser.full_name}</p>\n              <span className="text-[10px] text-slate-400 font-mono block mt-1">{activeRole}</span>\n              {currentCompany && <span className="text-[9px] text-violet-400 font-semibold truncate block">{currentCompany.name}</span>}`
);

// 6. Add onEditCategory prop to SettingsView call
a = a.replace(
  `              {activeTab === 'settings' && (\n                <SettingsView \n                  currentRole={activeRole}\n                  onChangeRole={handleRoleChange}\n                  currentUser={currentUser}\n                  categories={categories}\n                  onAddCategory={handleAddCategory}\n                  onDeleteCategory={handleDeleteCategory}\n                />\n              )}`,
  `              {activeTab === 'settings' && (\n                <SettingsView \n                  currentRole={activeRole}\n                  onChangeRole={handleRoleChange}\n                  currentUser={currentUser}\n                  categories={categories}\n                  onAddCategory={handleAddCategory}\n                  onDeleteCategory={handleDeleteCategory}\n                  onEditCategory={handleEditCategory}\n                />\n              )}`
);

// 7. Add Master Admin panel tab content before the audit tab
a = a.replace(
  `              {activeTab === 'audit' && (`,
  `              {activeTab === 'master-admin' && activeRole === 'Super Admin' && (\n                <MasterAdminPanel />\n              )}\n\n              {activeTab === 'audit' && (`
);

fs.writeFileSync('src/App.tsx', a);
console.log('Patched App.tsx');
