import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2, Edit3, Users, RefreshCw, CheckCircle2, XCircle, Building2, Eye, EyeOff } from 'lucide-react';

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

export const MasterAdminPanel: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // New company form
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [saving, setSaving] = useState(false);

  // Provision user form
  const [provisioningFor, setProvisioningFor] = useState<string | null>(null);
  const [provEmail, setProvEmail] = useState('');
  const [provName, setProvName] = useState('');
  const [provPassword, setProvPassword] = useState('');
  const [provRole, setProvRole] = useState('Super Admin');
  const [provisionSaving, setProvisionSaving] = useState(false);
  const [provisionResult, setProvisionResult] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await masterFetch('/master/companies');
      if (!res.ok) throw new Error('Clé Master Admin incorrecte ou serveur non disponible');
      const data = await res.json();
      setCompanies(data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

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
    if (!confirm(`Supprimer définitivement "${company.name}" et toutes ses données ? Cette action est irréversible.`)) return;
    try {
      await masterFetch(`/master/companies/${company.id}`, { method: 'DELETE' });
      await fetchCompanies();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleProvisionUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provEmail || !provName || !provisioningFor) return;
    setProvisionSaving(true);
    setProvisionResult('');
    try {
      const res = await masterFetch('/master/provision-user', {
        method: 'POST',
        body: JSON.stringify({
          email: provEmail,
          full_name: provName,
          password: provPassword || 'Hypro2024!',
          role: provRole,
          company_id: provisioningFor,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur création utilisateur');
      setProvisionResult(`✅ Utilisateur "${provName}" créé avec succès ! Email: ${provEmail} / Mot de passe: ${provPassword || 'Hypro2024!'}`);
      setProvEmail(''); setProvName(''); setProvPassword('');
    } catch (e: any) {
      setProvisionResult(`❌ ${e.message}`);
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
            <h3 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Users className="w-4 h-4 text-violet-500" /> Créer un Utilisateur
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Société: <strong>{companies.find(c => c.id === provisioningFor)?.name}</strong></p>
            {provisionResult && (
              <div className={`p-3 rounded-lg text-xs mb-4 ${provisionResult.startsWith('✅') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700'}`}>
                {provisionResult}
              </div>
            )}
            <form onSubmit={handleProvisionUser} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nom Complet *</label>
                <input type="text" value={provName} onChange={e => setProvName(e.target.value)} placeholder="Mohamed Amine Belabed" className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Email *</label>
                <input type="email" value={provEmail} onChange={e => setProvEmail(e.target.value)} placeholder="admin@client.dz" className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Mot de Passe (défaut: Hypro2024!)</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={provPassword} onChange={e => setProvPassword(e.target.value)} placeholder="Hypro2024!" className="w-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 pr-8" />
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
                  {provisionSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
                  {provisionSaving ? 'Création...' : 'Créer l\'utilisateur'}
                </button>
                <button type="button" onClick={() => { setProvisioningFor(null); setProvisionResult(''); }} className="px-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-2 rounded-lg text-sm font-bold">Fermer</button>
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

      {/* Companies List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Liste des Clients</h3>
        </div>
        {loading ? (
          <div className="p-8 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">Aucun client. Créez-en un ci-dessus.</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {companies.map(company => (
              <div key={company.id} className="p-4 flex items-center justify-between group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center font-bold text-violet-600 dark:text-violet-400 text-sm">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{company.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{company.id.substring(0, 8)}... • créé le {new Date(company.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${company.subscription_status === 'active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    {company.subscription_status === 'active' ? '● Actif' : '○ Suspendu'}
                  </span>
                  <button
                    onClick={() => setProvisioningFor(company.id)}
                    className="p-1.5 text-slate-400 hover:text-violet-500 border border-slate-200 dark:border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Créer un utilisateur pour ce client"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(company)}
                    className="p-1.5 text-slate-400 hover:text-amber-500 border border-slate-200 dark:border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title={company.subscription_status === 'active' ? 'Suspendre' : 'Réactiver'}
                  >
                    {company.subscription_status === 'active' ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDeleteCompany(company)}
                    className="p-1.5 text-rose-400 hover:text-rose-600 border border-slate-200 dark:border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How to use guide */}
      <div className="bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/50 rounded-2xl p-5 text-xs space-y-2">
        <p className="font-bold text-violet-700 dark:text-violet-300 text-sm">📋 Comment ajouter un nouveau client en 3 étapes</p>
        <ol className="list-decimal list-inside space-y-1.5 text-violet-600 dark:text-violet-400">
          <li>Cliquez sur <strong>"Nouveau Client"</strong> et entrez le nom de la société du client.</li>
          <li>Sur la ligne du client créé, cliquez sur l'icône <strong>👤 Utilisateurs</strong> pour créer le premier compte Super Admin du client avec son email et son mot de passe.</li>
          <li>Donnez à votre client son email et son mot de passe. Il peut se connecter sur votre site et ne verra que ses propres données.</li>
        </ol>
        <p className="text-violet-500 dark:text-violet-500 pt-1">⚠️ Pour que l'isolation fonctionne complètement, assurez-vous d'avoir exécuté le script SQL <code>multi_tenant_migration.sql</code> dans Supabase.</p>
      </div>
    </div>
  );
};
