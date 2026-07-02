import React, { useState } from 'react';
import { 
  Plus, Box, Settings, AlertCircle, CheckCircle, 
  Wrench, FileText, Search, PackageOpen, Trash2, RefreshCw 
} from 'lucide-react';
import { StockItem, Equipment, Project } from '../types';
import { formatLocalDate, useTranslation } from '../i18n';

interface InventoryViewProps {
  stockItems: StockItem[];
  equipment: Equipment[];
  projects: Project[];
  onAddStockItem: (item: Omit<StockItem, 'id'>) => Promise<any>;
  onAddEquipment: (eq: Omit<Equipment, 'id'>) => Promise<any>;
  onUpdateEquipmentStatus: (id: string, status: Equipment['status']) => Promise<any>;
  onDeleteStockItem?: (id: string) => Promise<any>;
  onDeleteEquipment?: (id: string) => Promise<any>;
  userRole: string;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stockItems,
  equipment,
  projects,
  onAddStockItem,
  onAddEquipment,
  onUpdateEquipmentStatus,
  onDeleteStockItem,
  onDeleteEquipment,
  userRole
}) => {
  const { t, lang } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'stocks' | 'equipment'>('stocks');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string>('ALL');

  // Form toggles
  const [isStockFormOpen, setIsStockFormOpen] = useState(false);
  const [isEquipFormOpen, setIsEquipFormOpen] = useState(false);

  // New Stock Form
  const [stProject, setStProject] = useState('');
  const [stName, setStName] = useState('');
  const [stQty, setStQty] = useState('');
  const [stUnit, setStUnit] = useState('');
  const [stMinAlert, setStMinAlert] = useState('');

  // New Equipment Form
  const [eqProject, setEqProject] = useState('');
  const [eqName, setEqName] = useState('');
  const [eqSerial, setEqSerial] = useState('');
  const [eqStatus, setEqStatus] = useState<Equipment['status']>('Active');

  const [loading, setLoading] = useState(false);

  const canManage = ['Super Admin', 'Site Manager', 'Purchasing Agent'].includes(userRole);
  const canDelete = ['Super Admin', 'Financial Director', 'Accountant', 'Site Manager'].includes(userRole);

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddStockItem({
        project_id: stProject,
        item_name: stName,
        quantity: Number(stQty),
        unit: stUnit,
        min_alert_threshold: Number(stMinAlert)
      });
      setIsStockFormOpen(false);
      setStProject(''); setStName(''); setStQty(''); setStUnit(''); setStMinAlert('');
    } catch (err: any) {
      alert(err.message || 'Erreur stock');
    } finally {
      setLoading(false);
    }
  };

  const handleEquipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddEquipment({
        project_id: eqProject,
        name: eqName,
        serial_number: eqSerial || undefined,
        status: eqStatus,
        last_maintenance_date: new Date().toISOString().split('T')[0]
      });
      setIsEquipFormOpen(false);
      setEqProject(''); setEqName(''); setEqSerial(''); setEqStatus('Active');
    } catch (err: any) {
      alert(err.message || 'Erreur équipement');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMaintenance = async (id: string, current: Equipment['status']) => {
    const next: Equipment['status'] = current === 'Active' ? 'Under Maintenance' : 'Active';
    try {
      await onUpdateEquipmentStatus(id, next);
    } catch (err: any) {
      alert('Erreur changement de statut');
    }
  };

  const handleDelete = async (action: (() => Promise<any>) | undefined, label: string, id: string) => {
    if (!action) return;
    if (!window.confirm(`Supprimer ${label} ?`)) return;
    setDeletingId(id);
    try {
      await action();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  // Filter
  const filteredStocks = stockItems.filter(s => filterProject === 'ALL' || s.project_id === filterProject);
  const filteredEquip = equipment.filter(e => filterProject === 'ALL' || e.project_id === filterProject);

  return (
    <div className="space-y-6" id="inventory-panel-container">
      {/* Sub tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2" id="inventory-header">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveSubTab('stocks')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === 'stocks' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Stocks de Matériaux ({filteredStocks.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('equipment')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === 'equipment' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Équipements & Grues ({filteredEquip.length})
          </button>
        </div>

        <div className="flex gap-2">
          {activeSubTab === 'stocks' && canManage && (
            <button 
              onClick={() => setIsStockFormOpen(true)}
              className="bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-800"
            >
              Ajouter au Stock Site
            </button>
          )}
          {activeSubTab === 'equipment' && canManage && (
            <button 
              onClick={() => setIsEquipFormOpen(true)}
              className="bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-800"
            >
              Ajouter un Équipement
            </button>
          )}
        </div>
      </div>

      {/* Filter select */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex gap-4 items-center justify-between" id="inventory-filters">
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" /> Filtrer par chantier de construction :
        </span>
        <select 
          value={filterProject} 
          onChange={e => setFilterProject(e.target.value)}
          className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs rounded-lg p-2 min-w-[200px]"
        >
          <option value="ALL">Tous les Chantiers</option>
          {projects.filter(p => p.code !== 'GEN-00').map(p => (
            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
          ))}
        </select>
      </div>

      {/* Main Stock Item display */}
      {activeSubTab === 'stocks' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="stocks-items-grid">
          {filteredStocks.map(s => {
            const proj = projects.find(p => p.id === s.project_id);
            const isLowStock = s.quantity <= (s.min_alert_threshold ?? 10);
            return (
              <div 
                key={s.id} 
                className={`bg-white dark:bg-slate-900 border ${isLowStock ? 'border-amber-300 dark:border-amber-950 bg-amber-50/10' : 'border-slate-200 dark:border-slate-800'} rounded-xl p-5 flex flex-col justify-between space-y-4`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg text-slate-500">
                      <Box className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isLowStock && (
                        <span className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Alerte Seuil Bas
                        </span>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(() => onDeleteStockItem?.(s.id), 'ce matériau', s.id)}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded"
                          title="Supprimer le matériau"
                          disabled={deletingId === s.id}
                        >
                          {deletingId === s.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.item_name}</h3>
                    <p className="text-[11px] text-slate-400 font-mono">Chantier: {proj ? proj.code : 'Général'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  <div className="space-y-0.5">
                    <span className="text-slate-400 text-[10px] block uppercase">Quantité Active</span>
                    <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-200">{s.quantity} {s.unit}</span>
                  </div>
                  <div className="text-right text-[10px] text-slate-400">
                    Seuil Limite: <span className="font-mono font-semibold">{(s.min_alert_threshold ?? 10)} {s.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredStocks.length === 0 && (
            <div className="col-span-full bg-slate-50 dark:bg-slate-900/40 p-12 text-center rounded-xl text-slate-400 border border-slate-200 text-xs">
              <PackageOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Aucun matériau répertorié sur ce chantier.
            </div>
          )}
        </div>
      ) : (
        // Equipment Display Table
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs" id="equip-table-panel">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Chantier</th>
                  <th className="p-4 font-semibold">Désignation Équipement</th>
                  <th className="p-4 font-semibold">N° de Série (Plaque)</th>
                  <th className="p-4 font-semibold">Dernière Maintenance</th>
                  <th className="p-4 font-semibold">Statut</th>
                  {(canManage || canDelete) && <th className="p-4 font-semibold text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEquip.map(e => {
                  const proj = projects.find(p => p.id === e.project_id);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-semibold">
                        {proj ? proj.name : 'N/A'}
                        <span className="text-[10px] text-slate-400 font-mono block">{proj ? proj.code : ''}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-900 dark:text-slate-100">{e.name}</td>
                      <td className="p-4 font-mono text-slate-500">{e.serial_number || 'Néant'}</td>
                      <td className="p-4 text-slate-500">{formatLocalDate(e.last_maintenance_date, lang)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                          e.status === 'Active' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                          e.status === 'Under Maintenance' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20' :
                          'bg-rose-50 text-rose-700 dark:bg-rose-950/20'
                        }`}>
                          {e.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <Wrench className="w-3 h-3" />}
                          {e.status}
                        </span>
                      </td>
                      {(canManage || canDelete) && (
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {canManage && (
                              <button 
                                onClick={() => handleToggleMaintenance(e.id, e.status)}
                                className="inline-flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-800 px-3 py-1 rounded hover:bg-slate-50 font-semibold"
                              >
                                <Wrench className="w-3 h-3" /> Alterner Statut
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(() => onDeleteEquipment?.(e.id), 'cet équipement', e.id)}
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded"
                                title="Supprimer l'équipement"
                                disabled={deletingId === e.id}
                              >
                                {deletingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredEquip.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">Aucun engin répertorié sur ce chantier.</td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      {/* Forms Modal dialogs */}

      {/* Stock Add Modal */}
      {isStockFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="stock-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-xl p-6 space-y-6" id="stock-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Logistique : Approvisionner Stock Chantier</h3>
              <button onClick={() => setIsStockFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">✕</button>
            </div>

            <form onSubmit={handleStockSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Chantier Concerné *</label>
                <select value={stProject} onChange={e => setStProject(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required>
                  <option value="">-- Choisir --</option>
                  {projects.filter(p => p.code !== 'GEN-00').map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Désignation du Matériau *</label>
                <input type="text" value={stName} onChange={e => setStName(e.target.value)} placeholder="e.g. Rond à béton FeE500 ø12" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Quantité Initiale *</label>
                  <input type="number" value={stQty} onChange={e => setStQty(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono" required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Unité de mesure *</label>
                  <input type="text" value={stUnit} onChange={e => setStUnit(e.target.value)} placeholder="Sacs, m³, Tonnes" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Seuil de réapprovisionnement critique *</label>
                <input type="number" value={stMinAlert} onChange={e => setStMinAlert(e.target.value)} placeholder="e.g. Alerte si inférieur à 10" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono" required />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsStockFormOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-300">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Loguer Entrée Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Add Modal */}
      {isEquipFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="equip-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-xl p-6 space-y-6" id="equip-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Parc Engins: Enregistrer Équipement</h3>
              <button onClick={() => setIsEquipFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">✕</button>
            </div>

            <form onSubmit={handleEquipSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Chantier d'affectation *</label>
                <select value={eqProject} onChange={e => setEqProject(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required>
                  <option value="">-- Choisir --</option>
                  {projects.filter(p => p.code !== 'GEN-00').map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Désignation du Matériel / Engin *</label>
                <input type="text" value={eqName} onChange={e => setEqName(e.target.value)} placeholder="e.g. Grue Potain MD 310" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Numéro de Série / Immatriculation</label>
                  <input type="text" value={eqSerial} onChange={e => setEqSerial(e.target.value)} placeholder="MD310-987" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Statut Initial *</label>
                  <select value={eqStatus} onChange={e => setEqStatus(e.target.value as any)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5">
                    <option value="Active">Actif / Disponible</option>
                    <option value="Under Maintenance">En Maintenance</option>
                    <option value="Inactive">Hors Service</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsEquipFormOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-300">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Ajouter Engin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
