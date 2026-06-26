import React, { useState } from 'react';
import { 
  User, Shield, Settings, Monitor, Globe, Bell, 
  Smartphone, Laptop, Compass, Key, Tag, Plus, Trash2
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useTheme } from '../theme';

interface SettingsViewProps {
  currentRole: string;
  onChangeRole: (newRole: string) => void;
  currentUser: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
  };
  categories?: { id: string; name: string }[];
  onAddCategory?: (name: string) => Promise<any>;
  onDeleteCategory?: (id: string) => Promise<any>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onChangeRole,
  currentUser,
  categories = [],
  onAddCategory,
  onDeleteCategory,
}) => {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme } = useTheme();

  const [fullName, setFullName] = useState(currentUser.full_name);
  const [phone, setPhone] = useState(currentUser.phone || '0550 12 34 56');
  const [email, setEmail] = useState(currentUser.email);
  const [saving, setSaving] = useState(false);

  // Active sessions mock list
  const mockSessions = [
    { id: '1', device: 'Safari - Apple iPhone 15 Pro', ip: '197.200.45.12', location: 'Alger, Algérie', current: true, date: 'Aujourd\'hui' },
    { id: '2', device: 'Chrome - Linux (AI Studio VM Client)', ip: '34.120.90.111', location: 'Vercel Preview Server', current: false, date: 'Hier à 14:32' }
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert('Profil mis à jour avec succès (Local Db) !');
    }, 500);
  };

  return (
    <div className="space-y-6" id="settings-view-panel">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs lg:col-span-2" id="settings-profile-card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <User className="w-4 h-4 text-slate-500" /> {t('profileTitle')}
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">{t('fullName')} *</label>
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-medium" 
                  required 
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">{t('phone')} *</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono" 
                  required 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-500">{t('email')} *</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 rounded-lg p-2.5 text-slate-500" 
                disabled 
              />
            </div>

            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                className="bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-slate-50 dark:text-slate-900 px-4 py-2 rounded-lg font-semibold transition-colors"
                disabled={saving}
              >
                {saving ? 'Sauvegarde...' : t('save')}
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic RBAC Simulation Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="settings-rbac-card">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Shield className="w-4 h-4 text-slate-500" /> Commutateur de Rôle (RBAC)
          </h3>
          <p className="text-[11px] text-slate-400">
            En tant qu'environnement de démonstration pour HYPRO, vous pouvez changer dynamiquement votre rôle ci-dessous pour tester instantanément les écrans, approbations et alertes correspondantes :
          </p>

          <div className="space-y-2 text-xs" id="settings-role-radios">
            {['Super Admin', 'Financial Director', 'Accountant', 'Site Manager', 'Employee'].map(role => (
              <label 
                key={role} 
                className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                  currentRole === role 
                    ? 'border-slate-900 dark:border-slate-100 bg-slate-50 dark:bg-slate-800/40 font-semibold' 
                    : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50/50'
                }`}
              >
                <span className="text-slate-800 dark:text-slate-200">{role}</span>
                <input 
                  type="radio" 
                  name="rbac_selector" 
                  checked={currentRole === role} 
                  onChange={() => onChangeRole(role)}
                  className="accent-slate-900"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Customization Preferences */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="settings-preferences">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Globe className="w-4 h-4 text-slate-500" /> Personnalisation de l'Applet
          </h3>

          <div className="space-y-4 text-xs" id="settings-preferences-controls">
            {/* Language Switcher */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{t('languageSelector')}</span>
                <p className="text-[10px] text-slate-400">Réglez l'interface de l'ERP en Arabe ou en Français.</p>
              </div>
              <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                <button 
                  onClick={() => setLang('fr')}
                  className={`px-3 py-1.5 rounded font-semibold transition-all ${lang === 'fr' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs' : 'text-slate-400'}`}
                >
                  Français
                </button>
                <button 
                  onClick={() => setLang('ar')}
                  className={`px-3 py-1.5 rounded font-semibold transition-all ${lang === 'ar' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs' : 'text-slate-400'}`}
                >
                  العربية
                </button>
              </div>
            </div>

            {/* Dark Mode Switcher */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="space-y-0.5">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{t('appearance')}</span>
                <p className="text-[10px] text-slate-400">Gérez le thème sombre de l'écran.</p>
              </div>
              <div className="flex gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg">
                {(['light', 'dark', 'system'] as const).map(tOpt => (
                  <button 
                    key={tOpt}
                    onClick={() => setTheme(tOpt)}
                    className={`px-2.5 py-1.5 rounded font-semibold capitalize transition-all ${theme === tOpt ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 shadow-xs' : 'text-slate-400'}`}
                  >
                    {tOpt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Active sessions list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="settings-sessions">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <Key className="w-4 h-4 text-slate-500" /> {t('securityTitle')}
          </h3>

          <div className="space-y-3 text-xs" id="settings-sessions-list">
            {mockSessions.map(sess => (
              <div key={sess.id} className="flex items-start justify-between p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl gap-2.5">
                <div className="flex gap-2.5">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-500 border border-slate-100 dark:border-slate-800">
                    {sess.device.includes('iPhone') ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{sess.device}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">IP: {sess.ip} • {sess.location}</span>
                  </div>
                </div>
                
                {sess.current ? (
                  <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">{t('currentSession')}</span>
                ) : (
                  <span className="text-slate-400 font-mono text-[10px] shrink-0">{sess.date}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expense Categories Management */}
      {onAddCategory && (
        <CategoriesPanel
          categories={categories}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
        />
      )}
    </div>
  );
};

// ── Categories sub-panel ──────────────────────────────────────────────────────
const CategoriesPanel: React.FC<{
  categories: { id: string; name: string }[];
  onAddCategory: (name: string) => Promise<any>;
  onDeleteCategory?: (id: string) => Promise<any>;
}> = ({ categories, onAddCategory, onDeleteCategory }) => {
  const [newCatName, setNewCatName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await onAddCategory(newCatName.trim());
      setNewCatName('');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!onDeleteCategory) return;
    if (!confirm(`Supprimer la catégorie "${name}" ?`)) return;
    try {
      await onDeleteCategory(id);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs" id="settings-categories-panel">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <Tag className="w-4 h-4 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Catégories de Dépenses</h3>
          <p className="text-[11px] text-slate-400">Gérez les catégories utilisées dans les notes de frais</p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          placeholder="Nom de la nouvelle catégorie..."
          className="flex-1 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={saving || !newCatName.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </form>

      {/* List */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {categories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Aucune catégorie. Ajoutez-en une ci-dessus.</p>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2 group">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
              </div>
              {onDeleteCategory && (
                <button
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-rose-400 hover:text-rose-500 transition-all"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
