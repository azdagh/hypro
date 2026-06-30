import React, { useState } from 'react';
import { 
  Plus, Users, FileCheck, ShoppingCart, Landmark, ArrowRight, 
  Check, X, FileText, AlertTriangle, Briefcase, Trash2, RefreshCw
} from 'lucide-react';
import { 
  Supplier, Subcontractor, PurchaseRequest, PurchaseOrder, Contract, Project 
} from '../types';
import { formatCurrencyDZD, useTranslation } from '../i18n';

interface ProcurementViewProps {
  suppliers: Supplier[];
  subcontractors: Subcontractor[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  contracts: Contract[];
  projects: Project[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<any>;
  onAddSubcontractor: (subcontractor: Omit<Subcontractor, 'id'>) => Promise<any>;
  onAddPurchaseRequest: (request: Omit<PurchaseRequest, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onAddPurchaseOrder: (order: Omit<PurchaseOrder, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onAddContract: (contract: Omit<Contract, 'id' | 'created_at' | 'updated_at'>) => Promise<any>;
  onUpdatePRStatus: (id: string, status: 'Approved' | 'Rejected') => Promise<any>;
  onUpdatePOStatus?: (id: string, status: 'Approved' | 'Rejected') => Promise<any>;
  onUpdateContractStatus?: (id: string, status: 'Approved' | 'Rejected') => Promise<any>;
  onDeletePurchaseRequest?: (id: string) => Promise<any>;
  onDeletePurchaseOrder?: (id: string) => Promise<any>;
  onDeleteContract?: (id: string) => Promise<any>;
  onDeleteSupplier?: (id: string) => Promise<any>;
  onDeleteSubcontractor?: (id: string) => Promise<any>;
  userRole: string;
  userId: string;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  suppliers,
  subcontractors,
  purchaseRequests,
  purchaseOrders,
  contracts,
  projects,
  onAddSupplier,
  onAddSubcontractor,
  onAddPurchaseRequest,
  onAddPurchaseOrder,
  onAddContract,
  onUpdatePRStatus,
  onUpdatePOStatus,
  onUpdateContractStatus,
  onDeletePurchaseRequest,
  onDeletePurchaseOrder,
  onDeleteContract,
  onDeleteSupplier,
  onDeleteSubcontractor,
  userRole,
  userId
}) => {
  const { t } = useTranslation();

  // Active sub tab
  const [procTab, setProcTab] = useState<'requests' | 'orders' | 'contracts' | 'partners'>('requests');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Form states
  const [isPrFormOpen, setIsPrFormOpen] = useState(false);
  const [isPoFormOpen, setIsPoFormOpen] = useState(false);
  const [isContractFormOpen, setIsContractFormOpen] = useState(false);
  const [isPartnerFormOpen, setIsPartnerFormOpen] = useState(false);

  // Partner selection type
  const [partnerType, setPartnerType] = useState<'supplier' | 'subcontractor'>('supplier');

  // New Supplier / Subcontractor Form
  const [partName, setPartName] = useState('');
  const [partContact, setPartContact] = useState('');
  const [partPhone, setPartPhone] = useState('');
  const [partEmail, setPartEmail] = useState('');
  const [partAddress, setPartAddress] = useState('');
  const [partActivity, setPartActivity] = useState(''); // activity field

  // New Purchase Request Form
  const [prProject, setPrProject] = useState('');
  const [prItemDescription, setPrItemDescription] = useState('');
  const [prQty, setPrQty] = useState('');
  const [prUnit, setPrUnit] = useState('');
  const [prEstimatedAmount, setPrEstimatedAmount] = useState('');
  const [prSuggestedSupplier, setPrSuggestedSupplier] = useState('');

  // New Purchase Order Form (Generating from an approved PR or manual)
  const [poProject, setPoProject] = useState('');
  const [poPrId, setPoPrId] = useState('');
  const [poSupplier, setPoSupplier] = useState('');
  const [poTotalAmount, setPoTotalAmount] = useState('');
  const [poDeliveryDate, setPoDeliveryDate] = useState('');

  // New Contract Form
  const [ctrProject, setCtrProject] = useState('');
  const [ctrSubcontractor, setCtrSubcontractor] = useState('');
  const [ctrScope, setCtrScope] = useState('');
  const [ctrTotalAmount, setCtrTotalAmount] = useState('');
  const [ctrStartDate, setCtrStartDate] = useState('');
  const [ctrEndDate, setCtrEndDate] = useState('');

  const [loading, setLoading] = useState(false);

  const canApprove = ['Super Admin', 'Financial Director', 'Purchasing Agent', 'Accountant'].includes(userRole);
  const canRequest = ['Super Admin', 'Site Manager', 'Purchasing Agent'].includes(userRole);

  // Purchase Filters state
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterPurchaserId, setFilterPurchaserId] = useState('');
  const [filterSupplierId, setFilterSupplierId] = useState('');

  // Extract unique purchasers/requesters from PRs
  const uniquePurchasers = Array.from(new Set(purchaseRequests.map(pr => (pr.requested_by || pr.requester_id || '') as string))).filter(Boolean)
    .map(id => {
      const pr = purchaseRequests.find(p => (p.requested_by === id || p.requester_id === id));
      return { id, name: pr?.requested_by_name || pr?.requester_name || 'Utilisateur ' + (id as string).substring(0, 5) };
    });

  // Apply filters
  const filteredPRs = purchaseRequests.filter(pr => {
    if (filterProjectId && pr.project_id !== filterProjectId) return false;
    if (filterPurchaserId && pr.requester_id !== filterPurchaserId && pr.requested_by !== filterPurchaserId) return false;
    if (filterSupplierId) {
      const supplier = suppliers.find(s => s.id === filterSupplierId);
      if (supplier && !pr.description?.toLowerCase().includes(supplier.company_name.toLowerCase()) && !pr.suggested_supplier_name?.toLowerCase().includes(supplier.company_name.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const filteredPOs = purchaseOrders.filter(po => {
    if (filterProjectId && po.project_id !== filterProjectId) return false;
    if (filterSupplierId && po.supplier_id !== filterSupplierId) return false;
    return true;
  });

  const filteredContractsList = contracts.filter(c => {
    if (filterProjectId && c.project_id !== filterProjectId) return false;
    return true;
  });

  // Handlers
  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (partnerType === 'supplier') {
        await onAddSupplier({
          name: partName,
          contact_name: partContact,
          phone: partPhone,
          email: partEmail,
          address: partAddress,
          activity_area: partActivity
        });
      } else {
        await onAddSubcontractor({
          name: partName,
          contact_name: partContact,
          phone: partPhone,
          email: partEmail,
          address: partAddress,
          specialty: partActivity
        });
      }
      setIsPartnerFormOpen(false);
      // Reset
      setPartName(''); setPartContact(''); setPartPhone(''); setPartEmail(''); setPartAddress(''); setPartActivity('');
    } catch (err: any) {
      alert(err.message || 'Erreur lors de l\'ajout du partenaire');
    } finally {
      setLoading(false);
    }
  };

  const handlePrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddPurchaseRequest({
        project_id: prProject,
        requested_by: userId,
        item_description: prItemDescription,
        quantity: Number(prQty),
        unit: prUnit,
        estimated_amount_dzd: Number(prEstimatedAmount),
        suggested_supplier_name: prSuggestedSupplier,
        status: 'Pending'
      });
      setIsPrFormOpen(false);
      setPrProject(''); setPrItemDescription(''); setPrQty(''); setPrUnit(''); setPrEstimatedAmount(''); setPrSuggestedSupplier('');
    } catch (err: any) {
      alert(err.message || 'Erreur PR');
    } finally {
      setLoading(false);
    }
  };

  const handlePoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddPurchaseOrder({
        project_id: poProject,
        purchase_request_id: poPrId || undefined,
        supplier_id: poSupplier,
        issued_by: userId,
        total_amount_dzd: Number(poTotalAmount),
        status: 'Issued',
        delivery_planned_date: poDeliveryDate
      });
      setIsPoFormOpen(false);
      setPoProject(''); setPoPrId(''); setPoSupplier(''); setPoTotalAmount(''); setPoDeliveryDate('');
    } catch (err: any) {
      alert(err.message || 'Erreur PO');
    } finally {
      setLoading(false);
    }
  };

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddContract({
        project_id: ctrProject,
        subcontractor_id: ctrSubcontractor,
        scope_of_work: ctrScope,
        total_amount_dzd: Number(ctrTotalAmount),
        start_date: ctrStartDate,
        end_date: ctrEndDate,
        status: 'Active'
      });
      setIsContractFormOpen(false);
      setCtrProject(''); setCtrSubcontractor(''); setCtrScope(''); setCtrTotalAmount(''); setCtrStartDate(''); setCtrEndDate('');
    } catch (err: any) {
      alert(err.message || 'Erreur Contrat');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePR = async (id: string, status: 'Approved' | 'Rejected') => {
    setActioningId(id);
    try {
      await onUpdatePRStatus(id, status);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du Traitement de la DA');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="space-y-6" id="procurement-main-panel">
      {/* Sub tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 gap-4">
        <div className="flex flex-wrap gap-4" id="procurement-tabs-bar">
          <button 
            onClick={() => setProcTab('requests')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${procTab === 'requests' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Demandes d'Achat (DA)
          </button>
          <button 
            onClick={() => setProcTab('orders')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${procTab === 'orders' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Bons de Commande (BC)
          </button>
          <button 
            onClick={() => setProcTab('contracts')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${procTab === 'contracts' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Contrats Sous-traitéants
          </button>
          <button 
            onClick={() => setProcTab('partners')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${procTab === 'partners' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Mines de Partenaires
          </button>
        </div>

        <div className="flex gap-2">
          {procTab === 'requests' && canRequest && (
            <button 
              onClick={() => setIsPrFormOpen(true)}
              className="bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-800"
            >
              Créer Demande (DA)
            </button>
          )}
          {procTab === 'orders' && canApprove && (
            <button 
              onClick={() => setIsPoFormOpen(true)}
              className="bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-800"
            >
              Nouveau Bon de Commande
            </button>
          )}
          {procTab === 'contracts' && canApprove && (
            <button 
              onClick={() => setIsContractFormOpen(true)}
              className="bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-800"
            >
              Nouveau Contrat Chantier
            </button>
          )}
          {procTab === 'partners' && canApprove && (
            <button 
              onClick={() => setIsPartnerFormOpen(true)}
              className="bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-800"
            >
              Ajouter Partenaire
            </button>
          )}
        </div>
      </div>

      {/* ----------------- PURCHASE FILTERS (For Accountant, Fin Director, Super Admin) ----------------- */}
      {['Super Admin', 'Financial Director', 'Accountant'].includes(userRole) && (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4" id="procurement-filters-panel">
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Filtrer par Projet</label>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tous les projets</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Filtrer par Demandeur</label>
            <select
              value={filterPurchaserId}
              onChange={(e) => setFilterPurchaserId(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tous les demandeurs</option>
              {uniquePurchasers.map(up => (
                <option key={up.id} value={up.id}>{up.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wide">Filtrer par Fournisseur</label>
            <select
              value={filterSupplierId}
              onChange={(e) => setFilterSupplierId(e.target.value)}
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Tous les fournisseurs</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.company_name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Sub View Displays */}

      {/* 1. Demandes d'Achat Table */}
      {procTab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs" id="da-table-panel">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Projet</th>
                  <th className="p-4 font-semibold">Équipements / Matériaux demandés</th>
                  <th className="p-4 font-semibold text-center">Quantité</th>
                  <th className="p-4 font-semibold text-right">Budget Estimé</th>
                  <th className="p-4 font-semibold">Fournisseur Suggéré</th>
                  <th className="p-4 font-semibold">Émetteur & Date</th>
                  <th className="p-4 font-semibold">Statut</th>
                  {canApprove && <th className="p-4 font-semibold text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPRs.map(pr => {
                  const proj = projects.find(p => p.id === pr.project_id);
                  return (
                    <tr key={pr.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-semibold">
                        {proj ? proj.name : 'N/A'}
                        <span className="text-[10px] text-slate-400 font-mono block">{proj ? proj.code : ''}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-700 dark:text-slate-300">
                        {pr.item_description}
                      </td>
                      <td className="p-4 text-center font-mono font-semibold">
                        {pr.quantity} {pr.unit}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrencyDZD(pr.estimated_amount_dzd)}
                      </td>
                      <td className="p-4 text-slate-500">{pr.suggested_supplier_name || 'Néant'}</td>
                      <td className="p-4">
                        <span className="text-slate-700 block font-medium">{pr.requested_by_name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{new Date(pr.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pr.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                          pr.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                        }`}>
                          {pr.status}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="p-4 text-center">
                          <div className="flex gap-1 justify-center items-center">
                            {pr.status === 'Pending' ? (
                              <>
                                <button 
                                  onClick={() => handleApprovePR(pr.id, 'Approved')}
                                  className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded"
                                  title="Approuver la demande d'achat"
                                  disabled={actioningId === pr.id}
                                >
                                  {actioningId === pr.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button 
                                  onClick={() => handleApprovePR(pr.id, 'Rejected')}
                                  className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded"
                                  title="Rejeter la demande"
                                  disabled={actioningId === pr.id}
                                >
                                  {actioningId === pr.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 font-mono text-[10px]">Traitéé</span>
                            )}
                            {onDeletePurchaseRequest && (
                              <button
                                onClick={() => onDeletePurchaseRequest(pr.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredPRs.length === 0 && (
                  <tr>
                    <td colSpan={canApprove ? 8 : 7} className="p-8 text-center text-slate-400">Aucune demande d'achat correspondante.</td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      {/* 2. Bons de Commande (BC) */}
      {procTab === 'orders' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs" id="bc-table-panel">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Réf BC</th>
                  <th className="p-4 font-semibold">Projet</th>
                  <th className="p-4 font-semibold">Fournisseur Laitier / Matériaux</th>
                  <th className="p-4 font-semibold text-right">Montant Global (DZD)</th>
                  <th className="p-4 font-semibold">Date d'Émission</th>
                  <th className="p-4 font-semibold">Livraison Prévue</th>
                  <th className="p-4 font-semibold">Statut</th>
                  {canApprove && <th className="p-4 font-semibold text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPOs.map(po => {
                  const proj = projects.find(p => p.id === po.project_id);
                  const supp = suppliers.find(s => s.id === po.supplier_id);
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-mono font-bold text-slate-900 dark:text-slate-50">
                        {po.po_number || `BC-${po.id.slice(0, 5).toUpperCase()}`}
                      </td>
                      <td className="p-4 font-semibold">
                        {proj ? proj.name : 'N/A'}
                        <span className="text-[10px] text-slate-400 font-mono block">{proj ? proj.code : ''}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block">{supp ? supp.name : 'Inconnu'}</span>
                        <span className="text-[10px] text-slate-400 block">{supp ? supp.contact_name : ''}</span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-950 dark:text-slate-50">
                        {formatCurrencyDZD(po.total_amount_dzd)}
                      </td>
                      <td className="p-4 text-slate-500">{new Date(po.created_at).toLocaleDateString()}</td>
                      <td className="p-4 text-amber-700 dark:text-amber-400 font-medium">
                        {po.delivery_planned_date ? new Date(po.delivery_planned_date).toLocaleDateString() : 'Néant'}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          po.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                          po.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                        }`}>
                          {po.status === 'Approved' ? '✓ Confirmé' : po.status === 'Rejected' ? '✗ Rejeté' : '⏳ En Attente'}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="p-4">
                          <div className="flex gap-1.5 items-center">
                            {po.status === 'Pending' ? (
                              <>
                                <button
                                  onClick={async () => { if(onUpdatePOStatus) { setActioningId(po.id); try { await onUpdatePOStatus(po.id, 'Approved'); } finally { setActioningId(null); } } }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  disabled={actioningId === po.id}
                                >
                                  {actioningId === po.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Confirmer
                                </button>
                                <button
                                  onClick={async () => { if(onUpdatePOStatus) { setActioningId(po.id); try { await onUpdatePOStatus(po.id, 'Rejected'); } finally { setActioningId(null); } } }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  disabled={actioningId === po.id}
                                >
                                  {actioningId === po.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Rejeter
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Traitéé</span>
                            )}
                            {onDeletePurchaseOrder && (
                              <button
                                onClick={() => onDeletePurchaseOrder(po.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredPOs.length === 0 && (
                  <tr>
                    <td colSpan={canApprove ? 8 : 7} className="p-8 text-center text-slate-400">Aucun bon de commande correspondant.</td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      {/* 3. Contrats Sous-traitéants */}
      {procTab === 'contracts' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs" id="contracts-table-panel">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Réf / Projet</th>
                  <th className="p-4 font-semibold">Sous-traitéant Partenaire</th>
                  <th className="p-4 font-semibold">Champs d'Action (Scope)</th>
                  <th className="p-4 font-semibold text-right">Montant Contractuel</th>
                  <th className="p-4 font-semibold">Date de Début</th>
                  <th className="p-4 font-semibold">Échéance</th>
                  <th className="p-4 font-semibold">Statut</th>
                  {canApprove && <th className="p-4 font-semibold text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredContractsList.map(c => {
                  const proj = projects.find(p => p.id === c.project_id);
                  const sub = subcontractors.find(s => s.id === c.subcontractor_id);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20">
                      <td className="p-4 font-semibold">
                        {proj ? proj.name : 'N/A'}
                        <span className="text-[10px] text-slate-400 font-mono block">{proj ? proj.code : ''}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold block">{sub ? sub.name : 'Inconnu'}</span>
                        <span className="text-[10px] text-slate-400 block">{sub ? sub.specialty : ''}</span>
                      </td>
                      <td className="p-4 max-w-[200px] truncate" title={c.scope_of_work}>
                        {c.scope_of_work}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-950 dark:text-slate-50">
                        {formatCurrencyDZD(c.total_amount_dzd)}
                      </td>
                      <td className="p-4 text-slate-500">{new Date(c.start_date).toLocaleDateString()}</td>
                      <td className="p-4 text-rose-600 dark:text-rose-400 font-medium">
                        {new Date(c.end_date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                          c.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                          'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                        }`}>
                          {c.status === 'Approved' ? '✓ Actif' : c.status === 'Rejected' ? '✗ Annulé' : '⏳ En Attente'}
                        </span>
                      </td>
                      {canApprove && (
                        <td className="p-4">
                          <div className="flex gap-1.5 items-center">
                            {(!c.status || c.status === 'Pending') ? (
                              <>
                                <button
                                  onClick={async () => { if(onUpdateContractStatus) { setActioningId(c.id); try { await onUpdateContractStatus(c.id, 'Approved'); } finally { setActioningId(null); } } }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  disabled={actioningId === c.id}
                                >
                                  {actioningId === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Activer
                                </button>
                                <button
                                  onClick={async () => { if(onUpdateContractStatus) { setActioningId(c.id); try { await onUpdateContractStatus(c.id, 'Rejected'); } finally { setActioningId(null); } } }}
                                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  disabled={actioningId === c.id}
                                >
                                  {actioningId === c.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Annuler
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Traitéé</span>
                            )}
                            {onDeleteContract && (
                              <button
                                onClick={() => onDeleteContract(c.id)}
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
                {filteredContractsList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Aucun contrat de Sous-traitéance correspondant.</td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      {/* 4. Partenaires (Fournisseurs / Sous-traitéants) Lists */}
      {procTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="partners-lists-panel">
          {/* Suppliers Card List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Landmark className="w-4 h-4 text-slate-500" /> Fournisseurs Matériaux ({suppliers.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[450px] overflow-y-auto pr-1">
              {suppliers.map(s => (
                <div key={s.id} className="py-3 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] rounded font-semibold">{s.activity_area}</span>
                      {onDeleteSupplier && (
                        <button onClick={() => onDeleteSupplier(s.id)} className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors" title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-500 space-y-0.5">
                    <p>Contact: {s.contact_name} • Tél: {s.phone}</p>
                    <p className="font-mono">Email: {s.email || 'N/A'}</p>
                    <p className="text-[10px] truncate">Adresse: {s.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subcontractors Card List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Users className="w-4 h-4 text-slate-500" /> Sous-traitéants (Entreprises) ({subcontractors.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[450px] overflow-y-auto pr-1">
              {subcontractors.map(s => (
                <div key={s.id} className="py-3 flex flex-col gap-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[9px] rounded font-semibold">{s.specialty}</span>
                      {onDeleteSubcontractor && (
                        <button onClick={() => onDeleteSubcontractor(s.id)} className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors" title="Supprimer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-500 space-y-0.5">
                    <p>Contact: {s.contact_name} • Tél: {s.phone}</p>
                    <p className="font-mono">Email: {s.email || 'N/A'}</p>
                    <p className="text-[10px] truncate">Adresse: {s.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Procurement Modal Dialog overlays */}

      {/* PR Add Modal */}
      {isPrFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="pr-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-xl p-6 space-y-6" id="pr-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Émettre Demande d'Achat (DA)</h3>
              <button onClick={() => setIsPrFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">✕</button>
            </div>

            <form onSubmit={handlePrSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Chantier d'affectation *</label>
                <select value={prProject} onChange={e => setPrProject(e.target.value)} className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" required>
                  <option value="">-- Choisir --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Matériaux / Équipement Demandé *</label>
                <input type="text" value={prItemDescription} onChange={e => setPrItemDescription(e.target.value)} placeholder="e.g. Ciment Portland CPJ 42.5" className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Quantité *</label>
                  <input type="number" value={prQty} onChange={e => setPrQty(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Unité *</label>
                  <input type="text" value={prUnit} onChange={e => setPrUnit(e.target.value)} placeholder="Sacs, Tonnes, etc." className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Budget Estimé (DZD) *</label>
                  <input type="number" value={prEstimatedAmount} onChange={e => setPrEstimatedAmount(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Fournisseur Suggéré</label>
                  <input type="text" value={prSuggestedSupplier} onChange={e => setPrSuggestedSupplier(e.target.value)} placeholder="Optionnel" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsPrFormOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-300">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Soumettre DA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Add Modal */}
      {isPoFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="po-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-xl p-6 space-y-6" id="po-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Nouveau Bon de Commande (BC)</h3>
              <button onClick={() => setIsPoFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">✕</button>
            </div>

            <form onSubmit={handlePoSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Projet Destinataire *</label>
                <select value={poProject} onChange={e => setPoProject(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required>
                  <option value="">-- Choisir --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Fournisseur d'affectation *</label>
                <select value={poSupplier} onChange={e => setPoSupplier(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required>
                  <option value="">-- Choisir --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Montant Global (DZD) *</label>
                  <input type="number" value={poTotalAmount} onChange={e => setPoTotalAmount(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono font-bold" required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Date de Livraison Souhaitée *</label>
                  <input type="date" value={poDeliveryDate} onChange={e => setPoDeliveryDate(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsPoFormOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-300">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Émettre BC
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subcontracting Contract Add Modal */}
      {isContractFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="contract-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-xl p-6 space-y-6" id="contract-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Créer un Contrat de Sous-traitéance</h3>
              <button onClick={() => setIsContractFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">✕</button>
            </div>

            <form onSubmit={handleContractSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Chantier Concerné *</label>
                <select value={ctrProject} onChange={e => setCtrProject(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required>
                  <option value="">-- Choisir --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Sous-traitéant Adjudicataire *</label>
                <select value={ctrSubcontractor} onChange={e => setCtrSubcontractor(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required>
                  <option value="">-- Choisir --</option>
                  {subcontractors.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.specialty})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Champs d'intervention (Scope of work) *</label>
                <textarea value={ctrScope} onChange={e => setCtrScope(e.target.value)} rows={2} placeholder="e.g. Travaux de maçonnerie, électricité lot B" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Montant Contractuel Initial (DZD) *</label>
                <input type="number" value={ctrTotalAmount} onChange={e => setCtrTotalAmount(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono font-bold" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Date de Début *</label>
                  <input type="date" value={ctrStartDate} onChange={e => setCtrStartDate(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Échéance de Fin *</label>
                  <input type="date" value={ctrEndDate} onChange={e => setCtrEndDate(e.target.value)} className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsContractFormOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-300">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Valider Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Add Modal */}
      {isPartnerFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="partner-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md shadow-xl p-6 space-y-6" id="partner-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Ajouter un Partenaire Commercial</h3>
              <button onClick={() => setIsPartnerFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-xs font-semibold">✕</button>
            </div>

            <form onSubmit={handlePartnerSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500 block">Type de Partenaire *</label>
                <div className="flex gap-4 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input type="radio" checked={partnerType === 'supplier'} onChange={() => setPartnerType('supplier')} /> Fournisseur Matériaux
                  </label>
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input type="radio" checked={partnerType === 'subcontractor'} onChange={() => setPartnerType('subcontractor')} /> Sous-traitéant Gros œ’uvres
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Dénomination Sociale / Nom *</label>
                <input type="text" value={partName} onChange={e => setPartName(e.target.value)} placeholder="e.g. SARL Lafarge Algérie" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Contact Principal *</label>
                  <input type="text" value={partContact} onChange={e => setPartContact(e.target.value)} placeholder="Nom du contact" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Téléphone Mobile *</label>
                  <input type="text" value={partPhone} onChange={e => setPartPhone(e.target.value)} placeholder="0550 00 00 00" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Adresse Email</label>
                  <input type="email" value={partEmail} onChange={e => setPartEmail(e.target.value)} placeholder="contact@entreprise.dz" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Spécialité / Secteur d'activité *</label>
                  <input type="text" value={partActivity} onChange={e => setPartActivity(e.target.value)} placeholder="e.g. Béton, Peinture, Ascenseurs" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Adresse Commerciale *</label>
                <input type="text" value={partAddress} onChange={e => setPartAddress(e.target.value)} placeholder="Siège social, Ville" className="w-full border border-slate-200 bg-white dark:bg-slate-900 rounded-lg p-2.5" required />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsPartnerFormOpen(false)} className="px-4 py-2 border rounded-lg text-slate-600 dark:text-slate-300">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Enregistrer Partenaire
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};



