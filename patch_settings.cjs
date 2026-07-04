const fs = require('fs');

let settingsTsx = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

const targetProps = `interface SettingsViewProps {
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
}`;

const replaceProps = `interface SettingsViewProps {
  currentRole: string;
  onChangeRole: (newRole: string) => void;
  currentUser: {
    id: string;
    email: string;
    full_name: string;
    phone?: string;
  };
  categories?: { id: string; name: string; is_personal?: boolean }[];
  onAddCategory?: (name: string, is_personal: boolean) => Promise<any>;
  onDeleteCategory?: (id: string) => Promise<any>;
  onEditCategory?: (id: string, name: string, is_personal: boolean) => Promise<any>;
}`;

settingsTsx = settingsTsx.replace(targetProps, replaceProps);

const targetComp = `export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onChangeRole,
  currentUser,
  categories = [],
  onAddCategory,
  onDeleteCategory,
}) => {`;

const replaceComp = `export const SettingsView: React.FC<SettingsViewProps> = ({
  currentRole,
  onChangeRole,
  currentUser,
  categories = [],
  onAddCategory,
  onDeleteCategory,
  onEditCategory,
}) => {`;

settingsTsx = settingsTsx.replace(targetComp, replaceComp);

const targetPanelCall = `<CategoriesPanel
          categories={categories}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
        />`;

const replacePanelCall = `<CategoriesPanel
          categories={categories}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
          onEditCategory={onEditCategory}
        />`;

settingsTsx = settingsTsx.replace(targetPanelCall, replacePanelCall);

const oldCategoriesPanel = `// ── Categories sub-panel ──────────────────────────────────────────────────────
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
      alert(err.message || 'Erreur lors de l\\'ajout de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!onDeleteCategory) return;
    if (!confirm(\`Supprimer la catégorie "\${name}" ?\`)) return;
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
`;

const newCategoriesPanel = `// ── Categories sub-panel ──────────────────────────────────────────────────────
const CategoriesPanel: React.FC<{
  categories: { id: string; name: string; is_personal?: boolean }[];
  onAddCategory: (name: string, is_personal: boolean) => Promise<any>;
  onDeleteCategory?: (id: string) => Promise<any>;
  onEditCategory?: (id: string, name: string, is_personal: boolean) => Promise<any>;
}> = ({ categories, onAddCategory, onDeleteCategory, onEditCategory }) => {
  const [newCatName, setNewCatName] = useState('');
  const [newCatPersonal, setNewCatPersonal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPersonal, setEditPersonal] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSaving(true);
    try {
      await onAddCategory(newCatName.trim(), newCatPersonal);
      setNewCatName('');
      setNewCatPersonal(false);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\\'ajout de la catégorie');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !onEditCategory) return;
    setSavingEdit(true);
    try {
      await onEditCategory(id, editName.trim(), editPersonal);
      setEditingId(null);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la modification');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!onDeleteCategory) return;
    if (!confirm(\`Supprimer la catégorie "\${name}" ?\`)) return;
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
      <form onSubmit={handleAdd} className="flex flex-col md:flex-row md:items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
        <input
          type="text"
          value={newCatName}
          onChange={e => setNewCatName(e.target.value)}
          placeholder="Nom de la nouvelle catégorie..."
          className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
          <input
            type="checkbox"
            checked={newCatPersonal}
            onChange={(e) => setNewCatPersonal(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
          Dépense personnelle ?
        </label>
        <button
          type="submit"
          disabled={saving || !newCatName.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors w-full md:w-auto"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-3.5 h-3.5" />
          )}
          {saving ? 'Ajout...' : 'Ajouter'}
        </button>
      </form>

      {/* List */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {categories.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Aucune catégorie. Ajoutez-en une ci-dessus.</p>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="flex flex-col bg-slate-50 dark:bg-slate-800 rounded-lg group border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              
              {editingId === cat.id ? (
                <div className="p-3 flex flex-col md:flex-row gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPersonal}
                      onChange={(e) => setEditPersonal(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                    />
                    Personnelle
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(cat.id)}
                      disabled={savingEdit || !editName.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center justify-center min-w-[70px]"
                    >
                      {savingEdit ? 'En cours...' : 'Sauver'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      disabled={savingEdit}
                      className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={\`w-2 h-2 rounded-full \${cat.is_personal ? 'bg-indigo-500' : 'bg-emerald-500'}\`}></div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                    {cat.is_personal && (
                      <span className="text-[9px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-bold border border-indigo-100 dark:border-indigo-800/50">
                        PERSONNELLE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                    {onEditCategory && (
                      <button
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditName(cat.name);
                          setEditPersonal(!!cat.is_personal);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-500 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-sm"
                        title="Modifier"
                      >
                        <SettingsIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteCategory && (
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-rose-400 hover:text-rose-600 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-sm"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
`;

const settingsIconImport = `  Smartphone, Laptop, Compass, Key, Tag, Plus, Trash2`;
const settingsIconReplace = `  Smartphone, Laptop, Compass, Key, Tag, Plus, Trash2, Settings as SettingsIcon`;

settingsTsx = settingsTsx.replace(settingsIconImport, settingsIconReplace);
settingsTsx = settingsTsx.replace(oldCategoriesPanel, newCategoriesPanel);

fs.writeFileSync('src/components/SettingsView.tsx', settingsTsx);
console.log('Fixed SettingsView.tsx');
