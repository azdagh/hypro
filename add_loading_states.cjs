const fs = require('fs');

// 1. InventoryView.tsx
let invContent = fs.readFileSync('src/components/InventoryView.tsx', 'utf8');
// Add spinner to Stock submit
invContent = invContent.replace(
  /<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold" disabled=\{loading\}>Loguer EntrAce Stock<\/button>/g,
  '<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Loguer Entrée Stock</button>'
);
invContent = invContent.replace(
  /<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold" disabled=\{loading\}>Ajouter Engin<\/button>/g,
  '<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Ajouter Engin</button>'
);
// Make sure RefreshCw is imported if missing. Wait, we already injected deletingId in this file, which also uses RefreshCw, so it should be imported.

// 2. ProcurementView.tsx
let proContent = fs.readFileSync('src/components/ProcurementView.tsx', 'utf8');

// Add spinner to submits
proContent = proContent.replace(
  /<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold" disabled=\{loading\}>Soumettre DA<\/button>/g,
  '<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Soumettre DA</button>'
);
proContent = proContent.replace(
  /<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold" disabled=\{loading\}>mettre BC<\/button>/g,
  '<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Émettre BC</button>'
);
proContent = proContent.replace(
  /<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold" disabled=\{loading\}>Valider Contrat<\/button>/g,
  '<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Valider Contrat</button>'
);
proContent = proContent.replace(
  /<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold" disabled=\{loading\}>Enregistrer Partenaire<\/button>/g,
  '<button type="submit" className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg font-semibold flex items-center justify-center gap-2" disabled={loading}>{loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null} Enregistrer Partenaire</button>'
);

// Inject actioningId state
if (!proContent.includes('const [actioningId, setActioningId]')) {
  proContent = proContent.replace(
    /(const \[deletingId, setDeletingId\] = useState<string \| null>\(null\);)/,
    '$1\n  const [actioningId, setActioningId] = useState<string | null>(null);'
  );
}

// Update PR Approve/Reject handlers
proContent = proContent.replace(
  /const handleApprovePR = async \(id: string, status: 'Approved' \| 'Rejected'\) => \{[\s\S]*?try \{[\s]*await onUpdatePRStatus\(id, status\);[\s\S]*?\} catch \(err: any\) \{[\s\S]*?\}[\s\S]*?\};/,
  `const handleApprovePR = async (id: string, status: 'Approved' | 'Rejected') => {
    setActioningId(id);
    try {
      await onUpdatePRStatus(id, status);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du Traitement de la DA');
    } finally {
      setActioningId(null);
    }
  };`
);

// Update PR UI calls
proContent = proContent.replace(
  /onClick=\{\(\) => handleApprovePR\(pr\.id, 'Approved'\)\}([\s\S]*?)<Check className="w-3 h-3" \/> Confirmer/g,
  'onClick={() => handleApprovePR(pr.id, \'Approved\')} disabled={actioningId === pr.id}$1{actioningId === pr.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Confirmer'
);
proContent = proContent.replace(
  /onClick=\{\(\) => handleApprovePR\(pr\.id, 'Rejected'\)\}([\s\S]*?)<X className="w-3 h-3" \/> Rejeter/g,
  'onClick={() => handleApprovePR(pr.id, \'Rejected\')} disabled={actioningId === pr.id}$1{actioningId === pr.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Rejeter'
);

// For PO
proContent = proContent.replace(
  /onClick=\{\(\) => onUpdatePOStatus && onUpdatePOStatus\(po\.id, 'Approved'\)\}([\s\S]*?)<Check className="w-3 h-3" \/> Confirmer/g,
  'onClick={async () => { if(onUpdatePOStatus) { setActioningId(po.id); try { await onUpdatePOStatus(po.id, \'Approved\'); } finally { setActioningId(null); } } }} disabled={actioningId === po.id}$1{actioningId === po.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Confirmer'
);
proContent = proContent.replace(
  /onClick=\{\(\) => onUpdatePOStatus && onUpdatePOStatus\(po\.id, 'Rejected'\)\}([\s\S]*?)<X className="w-3 h-3" \/> Rejeter/g,
  'onClick={async () => { if(onUpdatePOStatus) { setActioningId(po.id); try { await onUpdatePOStatus(po.id, \'Rejected\'); } finally { setActioningId(null); } } }} disabled={actioningId === po.id}$1{actioningId === po.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />} Rejeter'
);

// For Contract
proContent = proContent.replace(
  /onClick=\{\(\) => onUpdateContractStatus && onUpdateContractStatus\(ctr\.id, 'Approved'\)\}([\s\S]*?)<Check className="w-3 h-3" \/> Approuver/g,
  'onClick={async () => { if(onUpdateContractStatus) { setActioningId(ctr.id); try { await onUpdateContractStatus(ctr.id, \'Approved\'); } finally { setActioningId(null); } } }} disabled={actioningId === ctr.id}$1{actioningId === ctr.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approuver'
);

fs.writeFileSync('src/components/InventoryView.tsx', invContent, 'utf8');
fs.writeFileSync('src/components/ProcurementView.tsx', proContent, 'utf8');
console.log('Done patching loadings!');
