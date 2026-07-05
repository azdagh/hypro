import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Users, RefreshCw, CheckCircle2, XCircle, Building2, Eye, EyeOff, ChevronDown, ChevronRight, UserPlus, Shield, Briefcase, Edit2 } from 'lucide-react';

const MASTER_KEY = 'hypro-master-secret-2024'; // must match MASTER_ADMIN_KEY in server.ts / env

async function masterFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-master-admin-key': MASTER_KEY,
      ...options.headers,
    },
  });
}

interface Company {
  id: string;
  name: string;
  logo_url?: string;
  subscription_status?: string;
  created_at: string;
}

interface CompanyUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  'Super Admin': <Shield className="w-3 h-3 text-violet-500" />,
  'Financial Director': <Briefcase className="w-3 h-3 text-emerald-500" />,
  'Accountant': <Briefcase className="w-3 h-3 text-blue-500" />,
  'Site Manager': <Briefcase className="w-3 h-3 text-amber-500" />,
  'Employee': <Users className="w-3 h-3 text-slate-400" />,
};

export const MasterAdminPanel: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyUsers, setCompanyUsers] = useState<Record<string, CompanyUser[]>>({});
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New company form
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Provision user form
  const [provisioningFor, setProvisioningFor] = useState<string | null>(null);
  const [provEmail, setProvEmail] = useState('');
  const [provName, setProvName] = useState('');
  const [provPassword, setProvPassword] = useState('');
  const [provRole, setProvRole] = useState('Super Admin');
  const [provisionSaving, setProvisionSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [provisionSuccess, setProvisionSuccess] = useState<{ name: string; email: string; password: string } | null>(null);

  const HYPRO_COMPANY_ID = '0aeca20f-e2eb-43b4-bb04-a8ae63773d8a'; // HYPRO's own company - never show to clients

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await masterFetch('/master/companies');
      if (!res.ok) throw new Error('Clé Master Admin incorrecte ou serveur non disponible');
      const data = await res.json();
      setCompanies((data || []).filter((c: Company) => c.id !== HYPRO_COMPANY_ID));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersForCompany = async (companyId: string) => {
    try {
      // Use service role approach via master endpoint (no standard fetch to avoid 401)
      const masterRes = await masterFetch(`/master/companies/${companyId}/users`);
      if (masterRes.ok) {
        const users = await masterRes.json();
        setCompanyUsers(prev => ({ ...prev, [companyId]: users || [] }));
      }
    } catch (e) {
      console.warn('Could not fetch users for company', companyId);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const toggleExpand = async (companyId: string) => {
    const newExpanded = new Set(expandedCompanies);
    if (newExpanded.has(companyId)) {
      newExpanded.delete(companyId);
    } else {
      newExpanded.add(companyId);
      if (!companyUsers[companyId]) {
        await fetchUsersForCompany(companyId);
      }
    }
    setExpandedCompanies(newExpanded);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setSaving(true);
    try {
      const res = await masterFetch('/master/companies', {
        method: 'POST',
        body: JSON.stringify({ name: newCompanyName.trim() }),
      });
      if (!res.ok) throw new Error('Erreur création société');
      await fetchCompanies();
      setNewCompanyName('');
      setShowAddCompany(false);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (company: Company) => {
    const newStatus = company.subscription_status === 'active' ? 'suspended' : 'active';
    try {
      await masterFetch(`/master/companies/${company.id}`, {
        method: 'PUT',
        body: JSON.stringify({ subscription_status: newStatus }),
      });
      await fetchCompanies();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteCompany = async (company: Company) => {
    if (!confirm(`Supprimer définitivement "${company.name}" et tous ses utilisateurs ? Cette action est irréversible.`)) return;
    setDeletingCompanyId(company.id);
    try {
      const res = await masterFetch(`/master/companies/${company.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur suppression');
      }
      await fetchCompanies();
      setCompanyUsers(prev => { const n = { ...prev }; delete n[company.id]; return n; });
      setExpandedCompanies(prev => { const n = new Set(prev); n.delete(company.id); return n; });
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      setDeletingCompanyId(null);
    }
  };

  const handleDeleteUser = async (userId: string, companyId: string, userName: string) => {
    if (!confirm(`Supprimer l'utilisateur "${userName}" ?`)) return;
    setDeletingUserId(userId);
    try {
      const res = await masterFetch(`/master/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erreur suppression utilisateur');
      }
      setCompanyUsers(prev => ({
        ...prev,
        [companyId]: (prev[companyId] || []).filter(u => u.id !== userId)
      }));
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  const [editingUser, setEditingUser] = useState<any>(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', role: '', password: '' });
  const [editUserSaving, setEditUserSaving] = useState(false);

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEditUserForm({ name: user.full_name, email: user.email, role: user.role, password: '' });
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditUserSaving(true);
    try {
      const body: any = { full_name: editUserForm.name, email: editUserForm.email, role: editUserForm.role };
      if (editUserForm.password) body.password = editUserForm.password;

      const res = await masterFetch(`/master/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Erreur modification utilisateur');

      // Refresh users for that company
      const companyId = editingUser.company_id || Object.keys(companyUsers).find(cid => companyUsers[cid].some(u => u.id === editingUser.id));
      if (companyId) {
        await fetchUsersForCompany(companyId);
      }
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEditUserSaving(false);
    }
  };

  const openProvisionModal = (companyId: string) => {
    setProvisioningFor(companyId);
    setProvEmail('');
    setProvName('');
    setProvPassword('');
    setProvRole('Super Admin');
    setProvisionSuccess(null);
    setShowPassword(false);
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provEmail || !provName || !provisioningFor) return;
    setProvisionSaving(true);
    try {
      const finalPassword = provPassword || 'Hypro2024!';
      const res = await masterFetch('/master/provision-user', {
        method: 'POST',
        body: JSON.stringify({
          email: provEmail,
          full_name: provName,
          password: finalPassword,
          role: provRole,
          company_id: provisioningFor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création utilisateur');

      // Show success then auto-close form
      setProvisionSuccess({ name: provName, email: provEmail, password: finalPassword });

      // Refresh users for this company
      await fetchUsersForCompany(provisioningFor);
      // Also expand this company to show the new user
      setExpandedCompanies(prev => new Set([...prev, provisioningFor!]));

      // Auto-close after 3 seconds
      setTimeout(() => {
        setProvisioningFor(null);
        setProvisionSuccess(null);
      }, 3000);

    } catch (e: any) {
      alert('❌ ' + e.message);
    } finally {
      setProvisionSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="master-admin-panel">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-violet-500" />
            Gestion Multi-Clients
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Tableau de bord maître — visible uniquement pour vous</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchCompanies} className="p-2 text-slate-400 hover:text-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddCompany(true)}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Nouveau Client
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-4 text-sm text-rose-700 dark:text-rose-300">
          ⚠️ {error}
        </div>
      )}

      {/* Add Company Modal */}
      {showAddCompany && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-violet-500" /> Créer un Nouveau Client
            </h3>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nom de la Société *</label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  placeholder="ex: Société BATI Construction SARL"
                  className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  {saving ? 'Création...' : 'Créer'}
                </button>
                <button type="button" onClick={() => setShowAddCompany(false)} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-sm font-bold">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {provisioningFor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            {provisionSuccess ? (
              // Success state
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Utilisateur Créé !</h3>
                  <p className="text-slate-400 text-sm mt-1">Le compte est prêt. Transmettez ces identifiants au client.</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-left space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nom</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provisionSuccess.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provisionSuccess.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mot de passe</span>
                    <span className="font-mono font-bold text-violet-600">{provisionSuccess.password}</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">Cette fenêtre se fermera automatiquement dans 3 secondes...</p>
                <button onClick={() => { setProvisioningFor(null); setProvisionSuccess(null); }} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-bold">
                  Fermer
                </button>
              </div>
            ) : (
              // Form state
              <>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-violet-500" /> Créer un Utilisateur
                </h3>
                <p className="text-[11px] text-slate-400 mb-4">Société: <strong>{companies.find(c => c.id === provisioningFor)?.name}</strong></p>
                <form onSubmit={handleProvisionUser} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Nom Complet *</label>
                    <input type="text" value={provName} onChange={e => setProvName(e.target.value)} placeholder="Seif El Islam" className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Email *</label>
                    <input type="email" value={provEmail} onChange={e => setProvEmail(e.target.value)} placeholder="admin@client.dz" className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Mot de Passe (défaut: Hypro2026!)</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={provPassword} onChange={e => setProvPassword(e.target.value)} placeholder="Hypro2026!" className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2 text-slate-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1">Rôle Initial</label>
                    <select value={provRole} onChange={e => setProvRole(e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                      <option>Super Admin</option>
                      <option>Financial Director</option>
                      <option>Accountant</option>
                      <option>Site Manager</option>
                      <option>Employee</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={provisionSaving} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
                      {provisionSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      {provisionSaving ? 'Création...' : "Créer l'utilisateur"}
                    </button>
                    <button type="button" onClick={() => { setProvisioningFor(null); setProvisionSuccess(null); }} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-sm font-bold">Annuler</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-violet-500" /> Modifier l'Utilisateur
            </h3>
            <form onSubmit={handleEditUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nom Complet *</label>
                <input type="text" value={editUserForm.name} onChange={e => setEditUserForm({ ...editUserForm, name: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Email *</label>
                <input type="email" value={editUserForm.email} onChange={e => setEditUserForm({ ...editUserForm, email: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nouveau Mot de Passe (laisser vide pour ne pas changer)</label>
                <input type="text" value={editUserForm.password} onChange={e => setEditUserForm({ ...editUserForm, password: e.target.value })} placeholder="********" className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Rôle</label>
                <select value={editUserForm.role} onChange={e => setEditUserForm({ ...editUserForm, role: e.target.value })} className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500">
                  <option>Super Admin</option>
                  <option>Financial Director</option>
                  <option>Accountant</option>
                  <option>Site Manager</option>
                  <option>Employee</option>
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={editUserSaving} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-1.5">
                  {editUserSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {editUserSaving ? 'Enregistrement...' : "Sauvegarder"}
                </button>
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-sm font-bold">Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Total Clients</p>
          <p className="text-3xl font-black text-violet-600 mt-1">{companies.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Actifs</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{companies.filter(c => c.subscription_status === 'active').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Suspendus</p>
          <p className="text-3xl font-black text-amber-500 mt-1">{companies.filter(c => c.subscription_status !== 'active').length}</p>
        </div>
      </div>

      {/* Companies Tree List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Liste des Clients</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Cliquez sur une société pour voir ses utilisateurs</p>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Aucun client. Créez-en un ci-dessus.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {companies.map(company => {
              const isExpanded = expandedCompanies.has(company.id);
              const users = companyUsers[company.id] || [];
              return (
                <div key={company.id}>
                  {/* Company row */}
                  <div className="p-4 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <button
                      onClick={() => toggleExpand(company.id)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="text-slate-400">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                      <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center font-bold text-violet-600 dark:text-violet-400 text-sm flex-shrink-0">
                        {company.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{company.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{company.id.substring(0, 8)}... • créé le {new Date(company.created_at).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${company.subscription_status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                        {company.subscription_status === 'active' ? '● Actif' : '○ Suspendu'}
                      </span>
                      <button
                        onClick={() => openProvisionModal(company.id)}
                        className="p-1.5 text-slate-400 hover:text-violet-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                        title="Ajouter un utilisateur"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(company)}
                        className="p-1.5 text-slate-400 hover:text-amber-500 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                        title={company.subscription_status === 'active' ? 'Suspendre' : 'Réactiver'}
                      >
                        {company.subscription_status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDeleteCompany(company)}
                        className="text-slate-400 hover:text-rose-500 p-2"
                        title="Supprimer la société"
                        disabled={deletingCompanyId === company.id}
                      >
                        {deletingCompanyId === company.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Users sub-tree */}
                  {isExpanded && (
                    <div className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-700">
                      {users.length === 0 ? (
                        <div className="py-4 px-12 text-[11px] text-slate-400 flex items-center gap-2">
                          <Users className="w-3.5 h-3.5" />
                          Aucun utilisateur — cliquez sur <span className="font-bold text-violet-500">+</span> pour en ajouter un.
                        </div>
                      ) : (
                        users.map((user, idx) => (
                          <div key={user.id} className={`flex items-center justify-between px-4 py-2.5 ${idx < users.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                            <div className="flex items-center gap-3 pl-8">
                              {/* Tree line */}
                              <div className="flex items-center gap-2 text-slate-300 dark:text-slate-600">
                                <span className="text-xs">└─</span>
                              </div>
                              <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                {user.full_name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user.full_name}</p>
                                <p className="text-[10px] text-slate-400">{user.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                {ROLE_ICON[user.role] || <Users className="w-3 h-3" />}
                                {user.role}
                              </span>
                              <button
                                onClick={() => openEditModal({ ...user, company_id: company.id })}
                                className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors"
                                title="Modifier l'utilisateur"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, company.id, user.full_name)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm disabled:opacity-50"
                                title="Supprimer l'utilisateur"
                                disabled={deletingUserId === user.id}
                              >
                                {deletingUserId === user.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                      <div className="px-12 py-2">
                        <button
                          onClick={() => openProvisionModal(company.id)}
                          className="text-[11px] text-violet-500 hover:text-violet-700 font-semibold flex items-center gap-1"
                        >
                          <UserPlus className="w-3 h-3" /> Ajouter un utilisateur
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* How to use guide */}
      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-5 text-xs space-y-2">
        <p className="font-bold text-violet-700 dark:text-violet-300 text-sm">📋 Comment ajouter un nouveau client en 3 étapes</p>
        <ol className="list-decimal list-inside space-y-1.5 text-violet-600 dark:text-violet-400">
          <li>Cliquez sur <strong>"Nouveau Client"</strong> et entrez le nom de la société.</li>
          <li>Cliquez sur l'icône <strong>👤+</strong> de la société pour créer le premier compte Super Admin du client.</li>
          <li>Donnez à votre client son email et son mot de passe. Il accède directement à son propre espace vide.</li>
        </ol>
      </div>
    </div>
  );
};
