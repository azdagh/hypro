import React, { useState, useRef } from 'react';
import { 
  Plus, Camera, Sparkles, Check, X, Filter, FileText, 
  AlertTriangle, Clock, RefreshCw, Eye, ArrowUpRight, DollarSign, Trash2
} from 'lucide-react';
import { Expense, Project, ExpenseCategory, Allocation } from '../types';
import { formatCurrencyDZD, useTranslation } from '../i18n';
import { secureFetch } from '../lib/api';
import { getSupabaseClient } from '../lib/supabase';

interface ExpensesViewProps {
  expenses: Expense[];
  projects: Project[];
  categories: ExpenseCategory[];
  allocations: Allocation[];
  profiles: any[];
  onSubmitExpense: (expense: Omit<Expense, 'id' | 'submitted_at' | 'updated_at'>) => Promise<any>;
  onSubmitAllocation: (allocation: Omit<Allocation, 'id' | 'created_at'>) => Promise<any>;
  onUpdateExpenseStatus: (id: string, status: 'Approved' | 'Rejected', reason?: string) => Promise<any>;
  onDeleteExpense: (id: string) => Promise<any>;
  onDeleteAllocation: (id: string) => Promise<any>;
  userRole: string;
  userId: string;
  isOnline: boolean;
  enqueueOffline: (action: string, payload: any) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  projects,
  categories,
  allocations,
  profiles,
  onSubmitExpense,
  onSubmitAllocation,
  onUpdateExpenseStatus,
  onDeleteExpense,
  onDeleteAllocation,
  userRole,
  userId,
  isOnline,
  enqueueOffline
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // View state
  const [activeSubTab, setActiveSubTab] = useState<'expenses' | 'allocations'>('expenses');
  const [filterProject, setFilterProject] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAcheteur, setFilterAcheteur] = useState<string>('ALL');
  
  // Modals / Dialog state
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isAllocFormOpen, setIsAllocFormOpen] = useState(false);
  const [rejectionExpenseId, setRejectionExpenseId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(false);

  // Selected receipt preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // New Expense form states
  const [expProject, setExpProject] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expReceiptFileId, setExpReceiptFileId] = useState('');
  const [expReceiptUrl, setExpReceiptUrl] = useState('');
  const [localImageForScan, setLocalImageForScan] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // New Allocation form states
  const [allocProject, setAllocProject] = useState('');
  const [allocAmount, setAllocAmount] = useState('');
  const [allocTo, setAllocTo] = useState('');
  const [allocNotes, setAllocNotes] = useState('');
  const [allocReceiptFileId, setAllocReceiptFileId] = useState('');
  const [allocReceiptUrl, setAllocReceiptUrl] = useState('');

  const isApprover = ['Super Admin', 'Financial Director', 'Accountant'].includes(userRole);
  const canDelete = ['Super Admin', 'Financial Director', 'Accountant', 'Site Manager'].includes(userRole);
  const isManagerOrEmployee = ['Site Manager', 'Employee', 'Super Admin'].includes(userRole);

  // Canvas photo compression (JPEG, 70% Quality, Max Width 1600px)
  const compressPhoto = (base64Str: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxW = 1600;

        if (width > maxW) {
          height = Math.round((height * maxW) / width);
          width = maxW;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Output at 70% quality JPEG as requested
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error("Erreur de traitement d'image"));
    });
  };

  // Image/File Upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setIsScanning(true);
    setScanStatus('idle');
    setUploadedFileName(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onerror = () => {
        setScanStatus('error');
        setIsScanning(false);
        setIsUploading(false);
      };
      reader.onload = async () => {
        try {
          const originalBase64 = reader.result as string;
          setUploadError(null);

          // 1. Prepare file for upload
          const isImage = file.type.startsWith('image/');
          let base64ForUpload = originalBase64;
          let uploadFilename = file.name;
          let finalMimeType = file.type || 'application/octet-stream';

          if (isImage) {
            base64ForUpload = await compressPhoto(originalBase64);
            uploadFilename = file.name.replace(/\.[^.]+$/, '') + '.jpg';
            finalMimeType = 'image/jpeg';
            setLocalImageForScan(base64ForUpload);
          } else {
            setLocalImageForScan('');
          }

          // 2. Upload photo/file to Google Drive via Apps Script
          const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
          const secret = import.meta.env.VITE_GOOGLE_SCRIPT_SECRET;
          
          if (!scriptUrl) {
            throw new Error("Google Apps Script URL non configurÃ©. VÃ©rifiez .env.local");
          }

          const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8' // avoids CORS preflight
            },
            body: JSON.stringify({
              file: base64ForUpload,
              fileName: uploadFilename,
              mimeType: finalMimeType,
              uploadType: isAllocFormOpen ? 'transfer' : 'expense',
              secret: secret || ''
            })
          });

          const uploadData = await response.json();
          if (!uploadData.success) {
             throw new Error(uploadData.error || "Echec de l'upload vers Google Drive");
          }
          
          const receiptUrl = uploadData.webViewLink;

          // Save uploaded references for both forms
          setExpReceiptUrl(receiptUrl);
          setExpReceiptFileId(uploadData.fileId);
          setAllocReceiptUrl(receiptUrl);
          setAllocReceiptFileId(uploadData.fileId);
          if (!isImage) setUploadedFileName(file.name);

        } catch (err: any) {
          console.error(err);
          setScanStatus('error');
          setUploadError(err.message || "Erreur lors de l'upload vers Google Drive.");
        } finally {
          setIsScanning(false);
          setIsUploading(false);
        }
      };
    } catch (err) {
      console.error(err);
      setScanStatus('error');
      setIsScanning(false);
      setIsUploading(false);
    }
  };

  // Trigger Gemini AI scanning manually
  const handleAutoScan = async () => {
    if (!localImageForScan || !isOnline) return;
    setIsScanning(true);
    setScanStatus('idle');
    try {
      const geminiRes = await secureFetch('/api/gemini/scan-receipt', {
        method: 'POST',
        body: JSON.stringify({ imageBase64: localImageForScan })
      });
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        if (geminiData.amount_dzd) setExpAmount(geminiData.amount_dzd.toString());
        if (geminiData.description) setExpDescription(geminiData.description);
        if (geminiData.category_id) setExpCategory(geminiData.category_id);
        setScanStatus('success');
      } else {
        setScanStatus('error');
      }
    } catch (err) {
      setScanStatus('error');
    } finally {
      setIsScanning(false);
    }
  };

  // Duplicate submission protection (Checks identical project, category and amount in last 2 minutes)
  const isDuplicateSubmission = (projId: string, catId: string, amount: number): boolean => {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
    return expenses.some(e => 
      e.project_id === projId && 
      e.category_id === catId && 
      e.amount_dzd === amount && 
      new Date(e.submitted_at).getTime() > twoMinutesAgo
    );
  };

  // Submit Expense
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(expAmount);

    if (isDuplicateSubmission(expProject, expCategory, amountVal)) {
      setDuplicateAlert(true);
      setTimeout(() => setDuplicateAlert(false), 5000);
      return;
    }

    const payload = {
      project_id: expProject,
      category_id: expCategory,
      submitted_by: userId,
      amount_dzd: amountVal,
      description: expDescription,
      receipt_file_id: expReceiptFileId,
      receipt_url: expReceiptUrl,
      status: 'Pending' as const,
      rejection_reason: ''
    };

    if (!isOnline) {
      // Save in queue offline
      enqueueOffline('CREATE_EXPENSE', payload);
      alert(' ERP en Mode Hors Ligne : Votre dÃ©pense a Ã©tÃ© mise en attente et sera transmise dÃ¨s le rÃ©tablissement de la connexion.');
      setIsExpenseFormOpen(false);
      return;
    }

    setIsSubmittingForm(true);
    try {
      await onSubmitExpense(payload);
      setIsExpenseFormOpen(false);
      // Reset
      setExpProject('');
      setExpCategory('');
      setExpAmount('');
      setExpDescription('');
      setExpReceiptFileId('');
      setExpReceiptUrl('');
      setLocalImageForScan('');
      setScanStatus('idle');
      setUploadError(null);
      setUploadedFileName(null);
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors de la soumission');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Submit Allocation
  const handleAllocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      project_id: allocProject,
      amount_dzd: Number(allocAmount),
      allocated_by: userId,
      allocated_to: allocTo,
      notes: allocNotes,
      receipt_file_id: allocReceiptFileId,
      receipt_url: allocReceiptUrl
    };

    if (!isOnline) {
      enqueueOffline('CREATE_ALLOCATION', payload);
      alert(' ERP en Mode Hors Ligne : Versement sauvegardÃ© localement.');
      setIsAllocFormOpen(false);
      return;
    }

    setIsSubmittingForm(true);
    try {
      await onSubmitAllocation(payload);
      setIsAllocFormOpen(false);
      setAllocProject('');
      setAllocAmount('');
      setAllocTo('');
      setAllocNotes('');
      setAllocReceiptFileId('');
      setAllocReceiptUrl('');
      setUploadedFileName(null);
    } catch (err: any) {
      alert(err.message || 'Erreur d\'allocation');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Approve / Reject Handlers
  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected') {
      setRejectionExpenseId(id);
      setRejectionReason('');
      return;
    }

    try {
      await onUpdateExpenseStatus(id, 'Approved');
    } catch (err: any) {
      alert(err.message || 'Erreur d\'approbation');
    }
  };

  const handleRejectionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionExpenseId) return;

    try {
      await onUpdateExpenseStatus(rejectionExpenseId, 'Rejected', rejectionReason);
      setRejectionExpenseId(null);
    } catch (err: any) {
      alert(err.message || 'Erreur de rejet');
    }
  };

  // Filter logic
  const filteredExpenses = expenses.filter(e => {
    const matchesProj = filterProject === 'ALL' || e.project_id === filterProject;
    const matchesStatus = filterStatus === 'ALL' || e.status === filterStatus;
    const matchesAcheteur = filterAcheteur === 'ALL' || e.submitted_by === filterAcheteur;
    return matchesProj && matchesStatus && matchesAcheteur;
  }).sort((a,b) => b.submitted_at.localeCompare(a.submitted_at));

  const filteredAllocations = allocations.filter(a => {
    const matchesProj = filterProject === 'ALL' || a.project_id === filterProject;
    const matchesAcheteur = filterAcheteur === 'ALL' || a.allocated_to === filterAcheteur;
    return matchesProj && matchesAcheteur;
  }).sort((a,b) => b.created_at.localeCompare(a.created_at));

  // Compute Solde
  let soldeAcheteur = null;
  if (filterAcheteur !== 'ALL') {
    const totalAlloc = allocations
      .filter(a => a.allocated_to === filterAcheteur && (filterProject === 'ALL' || a.project_id === filterProject))
      .reduce((sum, a) => sum + Number(a.amount_dzd), 0);
    const totalExp = expenses
      .filter(e => e.submitted_by === filterAcheteur && e.status !== 'Rejected' && (filterProject === 'ALL' || e.project_id === filterProject))
      .reduce((sum, e) => sum + Number(e.amount_dzd), 0);
    soldeAcheteur = totalAlloc - totalExp;
  }

  return (
    <div className="space-y-6" id="expenses-and-pettycash-panel">
      {/* Sub Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2" id="expenses-header">
        <div className="flex gap-4">
          <button 
            onClick={() => setActiveSubTab('expenses')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === 'expenses' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            DÃ©penses & Petty Cash ({expenses.length})
          </button>
          <button 
            onClick={() => setActiveSubTab('allocations')}
            className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === 'allocations' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Versements de Fonds ({allocations.length})
          </button>
        </div>

        <div className="flex gap-2">
          {activeSubTab === 'expenses' && isManagerOrEmployee && (
            <button 
              onClick={() => setIsExpenseFormOpen(true)}
              className="inline-flex items-center justify-center bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
              id="btn-trigger-expense-form"
            >
              <Plus className="w-4 h-4 mr-1.5" /> DÃ©clarer DÃ©pense
            </button>
          )}
          {activeSubTab === 'allocations' && isApprover && (
            <button 
              onClick={() => setIsAllocFormOpen(true)}
              className="inline-flex items-center justify-center bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
              id="btn-trigger-alloc-form"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Nouveau Versement
            </button>
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between" id="expenses-filters-bar">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5" />
          <span>Filtres Actifs :</span>
        </div>
        <div className="flex flex-wrap gap-3 w-full md:w-auto text-xs" id="expenses-filters-inputs">
          {/* Project select */}
          <select 
            value={filterProject} 
            onChange={e => setFilterProject(e.target.value)}
            className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2 min-w-[150px]"
          >
            <option value="ALL">Tous les Projets</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
            ))}
          </select>

          {/* Status select (only for expenses sub tab) */}
          {activeSubTab === 'expenses' && (
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2 min-w-[150px]"
            >
              <option value="ALL">Tous les Statuts</option>
              <option value="Pending">En attente (Pending)</option>
              <option value="Approved">ApprouvÃ© (Approved)</option>
              <option value="Rejected">RejetÃ© (Rejected)</option>
            </select>
          )}
          
          {/* Acheteur / Beneficiaire select */}
          {(isApprover) && (
            <select 
              value={filterAcheteur} 
              onChange={e => setFilterAcheteur(e.target.value)}
              className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2 min-w-[150px]"
            >
              <option value="ALL">Tous les Acheteurs</option>
              {profiles?.filter(p => p.role !== 'Super Admin').map(p => (
                <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
              ))}
            </select>
          )}
        </div>
        
        {/* Solde Display */}
        {filterAcheteur !== 'ALL' && soldeAcheteur !== null && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
            <DollarSign className="w-4 h-4" />
            <span className="font-bold text-sm">Solde : {formatCurrencyDZD(soldeAcheteur)}</span>
          </div>
        )}
      </div>

      {/* Tables display */}
      {activeSubTab === 'expenses' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs" id="expenses-table-container">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Projet & CatÃ©gorie</th>
                  <th className="p-4 font-semibold">Soumis par & Date</th>
                  <th className="p-4 font-semibold">Description</th>
                  <th className="p-4 font-semibold text-right">Montant</th>
                  <th className="p-4 font-semibold">Justificatif</th>
                  <th className="p-4 font-semibold">Statut</th>
                  {isApprover && <th className="p-4 font-semibold text-center">Approbations</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenses.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20" id={`expense-row-${e.id}`}>
                    {/* Project & Category */}
                    <td className="p-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 block">{(e as any).projects?.name || projects.find(p => p.id === e.project_id)?.name || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 font-mono block">{(e as any).expense_categories?.name || categories.find(c => c.id === e.category_id)?.name || 'â€”'}</span>
                    </td>
                    {/* Submitter & Date */}
                    <td className="p-4">
                      <span className="font-medium text-slate-700 dark:text-slate-300 block">
                        {(e as any).profiles?.full_name || profiles?.find(p => p.id === e.submitted_by)?.full_name || e.submitted_by_name || 'N/A'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">{new Date(e.submitted_at).toLocaleDateString()}</span>
                    </td>
                    {/* Description */}
                    <td className="p-4 max-w-[220px]">
                      <p className="truncate font-medium text-slate-700 dark:text-slate-300" title={e.description}>{e.description}</p>
                      {e.rejection_reason && (
                        <p className="text-[10px] text-rose-600 font-medium">Rejet: {e.rejection_reason}</p>
                      )}
                    </td>
                    {/* Amount */}
                    <td className="p-4 text-right">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-50">{formatCurrencyDZD(e.amount_dzd)}</span>
                    </td>
                    {/* Receipt link */}
                    <td className="p-4">
                      {e.receipt_url ? (
                        <button 
                          onClick={() => setPreviewImageUrl(e.receipt_url || null)}
                          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" /> Voir ReÃ§u
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">Aucun</span>
                      )}
                    </td>
                    {/* Status badge */}
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold inline-flex items-center gap-1 ${
                        e.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' :
                        e.status === 'Rejected' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20' :
                        'bg-amber-50 text-amber-700 dark:bg-amber-950/20'
                      }`}>
                        {e.status === 'Approved' && <Check className="w-3 h-3" />}
                        {e.status === 'Rejected' && <X className="w-3 h-3" />}
                        {e.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {e.status}
                      </span>
                    </td>
                    {/* Approvals */}
                    {isApprover && (
                      <td className="p-4 text-center">
                        {e.status === 'Pending' ? (
                          <div className="flex gap-1 justify-center">
                            <button 
                              onClick={() => handleApproval(e.id, 'Approved')}
                              className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                              title="Approuver la dÃ©pense"
                              id={`btn-approve-exp-${e.id}`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleApproval(e.id, 'Rejected')}
                              className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                              title="Rejeter la dÃ©pense"
                              id={`btn-reject-exp-${e.id}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-slate-400 font-mono text-[10px]">VerrouillÃ©</span>
                            <button 
                              onClick={() => onDeleteExpense(e.id)}
                              className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                              title="Supprimer la dÃ©pense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={isApprover ? 7 : 6} className="p-8 text-center text-slate-400">
                      Aucune dÃ©pense ne correspond aux filtres actifs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      ) : (
        // Allocations Table
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs" id="allocations-table-container">
          <div className="overflow-x-auto">
            <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="p-4 font-semibold">Projet Destinataire</th>
                  <th className="p-4 font-semibold">Date & Heure</th>
                  <th className="p-4 font-semibold">AllouÃ© par & BÃ©nÃ©ficiaire</th>
                  <th className="p-4 font-semibold">Notes / Objet</th>
                  <th className="p-4 font-semibold text-right">Montant</th>
                  <th className="p-4 font-semibold">Justificatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAllocations.map(a => {
                  const proj = projects.find(p => p.id === a.project_id);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20" id={`alloc-row-${a.id}`}>
                      <td className="p-4 font-semibold">
                        {proj ? proj.name : 'Projet SupprimÃ©'}
                        <span className="text-[10px] text-slate-400 font-mono block">{proj ? proj.code : ''}</span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">
                        {new Date(a.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-700 dark:text-slate-300 block">De: {a.allocated_by_name}</span>
                        <span className="text-[10px] text-slate-400 block">Pour: {profiles?.find(p => p.id === a.allocated_to)?.full_name || a.allocated_to}</span>
                      </td>
                      <td className="p-4 max-w-[250px] truncate" title={a.notes}>
                        {a.notes || <span className="text-slate-400 italic">Sans notes</span>}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-slate-50">
                        {formatCurrencyDZD(a.amount_dzd)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-between">
                          {a.receipt_url ? (
                            <button 
                              onClick={() => setPreviewImageUrl(a.receipt_url || null)}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-semibold"
                            >
                              <Eye className="w-3.5 h-3.5" /> ReÃ§u
                            </button>
                          ) : (
                            <span className="text-slate-400 italic">Aucun</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAllocations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Aucune allocation enregistrÃ©e.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
</div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionExpenseId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="rejection-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-xl" id="rejection-form-container">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" /> Motiver le Rejet du ReÃ§u
            </h3>
            <form onSubmit={handleRejectionConfirm} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Raison de rejet (sera notifiÃ© au chef de chantier) *</label>
                <textarea 
                  value={rejectionReason} 
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={3} 
                  placeholder="e.g. Justificatif flou, montant incorrect..." 
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setRejectionExpenseId(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-semibold"
                >
                  {t('reject')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense submission form Modal */}
      {isExpenseFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="expense-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-6" id="expense-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">DÃ©clarer DÃ©pense de Chantier (Petty Cash)</h3>
              <button onClick={() => setIsExpenseFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">âœ•</button>
            </div>

            {duplicateAlert && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex items-start gap-2.5 text-xs text-amber-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{t('duplicateProtection')}</p>
              </div>
            )}

            <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">SÃ©lectionner Projet *</label>
                  <select 
                    value={expProject} 
                    onChange={e => setExpProject(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required
                  >
                    <option value="">-- Choisir --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">CatÃ©gorie de DÃ©pense *</label>
                  <select 
                    value={expCategory} 
                    onChange={e => setExpCategory(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required
                  >
                    <option value="">-- Choisir --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Justification Upload Card with Camera capture="environment" */}
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-slate-50 dark:bg-slate-950/20 text-center space-y-3">
                <div className="flex flex-col items-center">
                  {localImageForScan ? (
                    <div className="relative w-full max-w-[200px] mb-2 mx-auto">
                      <img src={localImageForScan} alt="Preview" className="w-full h-auto rounded-lg receipt-preview-thumb" />
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="font-medium text-slate-700 dark:text-slate-300">NumÃ©riser ReÃ§u de Chantier</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[320px]">
                        Capturez directement via la camÃ©ra de votre smartphone (Compression automatique 70% pour limiter le trafic Naftal/chantiers).
                      </p>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handleFileChange} 
                    ref={fileInputRef}
                    className="hidden" 
                  />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-100 rounded-lg py-2 px-4 font-semibold text-slate-700 dark:text-slate-200"
                    disabled={isUploading}
                  >
                    {isUploading ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Camera className="w-3.5 h-3.5 mr-1.5" />}
                    {localImageForScan ? 'Changer Photo' : uploadedFileName ? 'Changer Fichier' : 'Prendre Photo / Charger'}
                  </button>


                </div>

                {/* Scan Status banner */}
                {isScanning && !isUploading && (
                  <div className="text-slate-500 inline-flex items-center gap-1.5 text-[10px]">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                    <span>Lancement de l'Analyse d'Image par IA (Gemini)...</span>
                  </div>
                )}
                {isUploading && (
                  <div className="text-slate-500 inline-flex items-center gap-1.5 text-[10px]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>Upload en cours vers Google Drive...</span>
                  </div>
                )}
                {scanStatus === 'success' && (
                  <div className="text-emerald-600 inline-flex items-center gap-1 text-[10px] bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded">
                    <Check className="w-3.5 h-3.5" />
                    <span>IA: ReÃ§u scannÃ© avec succÃ¨s ! Montant & dÃ©tails renseignÃ©s.</span>
                  </div>
                )}
                {uploadError && (
                  <div className="text-rose-600 inline-flex items-center gap-1 text-[10px] bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 rounded">
                    <X className="w-3.5 h-3.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}
                {uploadedFileName && !isUploading && (
                  <p className="text-[10px] text-emerald-600 font-mono truncate">âœ” Fichier uploadÃ©: {uploadedFileName}</p>
                )}
                {expReceiptUrl && !isScanning && !uploadedFileName && (
                  <p className="text-[10px] text-emerald-600 font-mono truncate">âœ” LiÃ© Ã  Drive: {expReceiptFileId}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Montant (DZD) *</label>
                  <input 
                    type="number" 
                    value={expAmount} 
                    onChange={e => setExpAmount(e.target.value)} 
                    placeholder="Montant du reÃ§u" 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono font-bold" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Description / Preuve d'achat *</label>
                  <input 
                    type="text" 
                    value={expDescription} 
                    onChange={e => setExpDescription(e.target.value)} 
                    placeholder="e.g. Achat gasoil pour grue nÂ°2" 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required 
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsExpenseFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors"
                  disabled={isSubmittingForm}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-semibold inline-flex items-center gap-2"
                  disabled={isSubmittingForm || isUploading}
                >
                  {isSubmittingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  {t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation form Modal */}
      {isAllocFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="alloc-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-xl shadow-xl p-6 space-y-6" id="alloc-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">Effectuer Versement / Allocation de Caisse</h3>
              <button onClick={() => setIsAllocFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">âœ•</button>
            </div>

            <form onSubmit={handleAllocSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">BÃ©nÃ©ficiaire Principal (Compte Utilisateur) *</label>
                  <select 
                    value={allocTo} 
                    onChange={e => setAllocTo(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required 
                  >
                    <option value="">-- SÃ©lectionner un compte --</option>
                    {profiles?.filter(p => p.role !== 'Super Admin').map(p => (
                      <option key={p.id} value={p.id}>{p.full_name} ({p.role})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Projet Destinataire (Optionnel)</label>
                  <select 
                    value={allocProject} 
                    onChange={e => setAllocProject(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                  >
                    <option value="">-- Choisir --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Montant AllouÃ© (DZD) *</label>
                  <input 
                    type="number" 
                    value={allocAmount} 
                    onChange={e => setAllocAmount(e.target.value)} 
                    placeholder="Montant du transfert" 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono font-bold" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Justificatif Transfert / Bordereau</label>
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2" 
                  />
                  {isUploading && (
                    <div className="text-slate-500 inline-flex items-center gap-1.5 text-[10px] mt-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-500" />
                      <span>Upload en cours...</span>
                    </div>
                  )}
                  {uploadedFileName && !isUploading && (
                    <p className="text-[10px] text-emerald-600 mt-1">âœ” {uploadedFileName}</p>
                  )}
                  {allocReceiptUrl && !isUploading && !uploadedFileName && (
                    <p className="text-[10px] text-emerald-600 mt-1">âœ” Photo liÃ©e Ã  Drive</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Notes d'accompagnement / Motif</label>
                <textarea 
                  value={allocNotes} 
                  onChange={e => setAllocNotes(e.target.value)}
                  rows={2} 
                  placeholder="Notes importantes sur cette injection de fonds de roulement..." 
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsAllocFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors"
                  disabled={isSubmittingForm}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-semibold inline-flex items-center gap-2"
                  disabled={isSubmittingForm || isUploading}
                >
                  {isSubmittingForm && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Confirmer Versement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-screen Receipt Preview Modal overlay */}
      {previewImageUrl && (
        <div 
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 z-[999] animate-fade-in"
          id="receipt-preview-overlay"
        >
          {/* Top Actions Bar */}
          <div className="w-full max-w-5xl flex justify-between items-center mb-3 px-1">
            <span className="text-white/70 text-xs sm:text-sm font-medium">AperÃ§u du Document</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <a 
                href={previewImageUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-white hover:text-emerald-400 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" /> <span className="hidden sm:inline">Ouvrir</span>
              </a>
              <button 
                onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(null); }}
                className="bg-white/10 hover:bg-rose-500 text-white p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="w-full max-w-5xl h-[85vh] bg-slate-100 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex-shrink-0" onClick={(e) => e.stopPropagation()} id="receipt-preview-container">
            <iframe 
              src={(() => {
                // Convert Google Drive view link to embeddable preview link
                const url = previewImageUrl || '';
                // Handle /file/d/ID/view pattern
                const fileIdMatch = url.match(/\/file\/d\/([^/]+)/);
                if (fileIdMatch) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
                // Handle open?id=ID pattern
                const openIdMatch = url.match(/[?&]id=([^&]+)/);
                if (openIdMatch) return `https://drive.google.com/file/d/${openIdMatch[1]}/preview`;
                // Fallback: try replacing /view with /preview
                return url.replace(/\/view(\?.*)?$/, '/preview');
              })()}
              className="w-full h-full border-0"
              allow="autoplay"
              title="Receipt Preview"
            />
          </div>
        </div>
      )}

      {/* Global Loading Overlay - shown when saving/submitting data */}
      {isSubmittingForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4">
            <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Enregistrement en cours...</p>
            <p className="text-xs text-slate-400">Veuillez patienter</p>
          </div>
        </div>
      )}
    </div>
  );
};



