const fs = require('fs');

function fixProcurementView() {
  let content = fs.readFileSync('src/components/ProcurementView.tsx', 'utf8');

  // Replace actioningId with approvingId and rejectingId
  content = content.replace('const [actioningId, setActioningId] = useState<string | null>(null);', 
    'const [approvingId, setApprovingId] = useState<string | null>(null);\n  const [rejectingId, setRejectingId] = useState<string | null>(null);');

  // Fix handleApprovePR
  content = content.replace(
    'setActioningId(id);\n    try {',
    "if (status === 'Approved') setApprovingId(id); else setRejectingId(id);\n    try {"
  );
  content = content.replace(
    'setActioningId(null);\n      }',
    "setApprovingId(null); setRejectingId(null);\n      }"
  );

  // Instead of simple string replace, let's just do regex for the inline handlers
  // PO Approve
  content = content.replace(
    /onClick=\{async \(\) => \{ if\(onUpdatePOStatus\) \{ setActioningId\(po\.id\); try \{ await onUpdatePOStatus\(po\.id, 'Approved'\); \} finally \{ setActioningId\(null\); \} \} \}\}/g,
    "onClick={async () => { if(onUpdatePOStatus) { setApprovingId(po.id); try { await onUpdatePOStatus(po.id, 'Approved'); } finally { setApprovingId(null); } } }}"
  );
  // PO Reject
  content = content.replace(
    /onClick=\{async \(\) => \{ if\(onUpdatePOStatus\) \{ setActioningId\(po\.id\); try \{ await onUpdatePOStatus\(po\.id, 'Rejected'\); \} finally \{ setActioningId\(null\); \} \} \}\}/g,
    "onClick={async () => { if(onUpdatePOStatus) { setRejectingId(po.id); try { await onUpdatePOStatus(po.id, 'Rejected'); } finally { setRejectingId(null); } } }}"
  );

  // Contract Approve
  content = content.replace(
    /onClick=\{async \(\) => \{ if\(onUpdateContractStatus\) \{ setActioningId\(c\.id\); try \{ await onUpdateContractStatus\(c\.id, 'Approved'\); \} finally \{ setActioningId\(null\); \} \} \}\}/g,
    "onClick={async () => { if(onUpdateContractStatus) { setApprovingId(c.id); try { await onUpdateContractStatus(c.id, 'Approved'); } finally { setApprovingId(null); } } }}"
  );
  // Contract Reject
  content = content.replace(
    /onClick=\{async \(\) => \{ if\(onUpdateContractStatus\) \{ setActioningId\(c\.id\); try \{ await onUpdateContractStatus\(c\.id, 'Rejected'\); \} finally \{ setActioningId\(null\); \} \} \}\}/g,
    "onClick={async () => { if(onUpdateContractStatus) { setRejectingId(c.id); try { await onUpdateContractStatus(c.id, 'Rejected'); } finally { setRejectingId(null); } } }}"
  );

  // Fix button disabled state and icons for PR
  content = content.replace(
    /<button \s*onClick=\{\(\) => handleApprovePR\(pr\.id, 'Approved'\)\}\s*className="(.*?)"\s*title="(.*?)"\s*disabled=\{actioningId === pr\.id\}\s*>\s*\{actioningId === pr\.id \? <RefreshCw className="w-3\.5 h-3\.5 animate-spin" \/> : <Check className="w-3\.5 h-3\.5" \/>\}\s*<\/button>/g,
    `<button onClick={() => handleApprovePR(pr.id, 'Approved')} className="$1" title="$2" disabled={approvingId === pr.id || rejectingId === pr.id}> {approvingId === pr.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} </button>`
  );

  content = content.replace(
    /<button \s*onClick=\{\(\) => handleApprovePR\(pr\.id, 'Rejected'\)\}\s*className="(.*?)"\s*title="(.*?)"\s*disabled=\{actioningId === pr\.id\}\s*>\s*\{actioningId === pr\.id \? <RefreshCw className="w-3\.5 h-3\.5 animate-spin" \/> : <X className="w-3\.5 h-3\.5" \/>\}\s*<\/button>/g,
    `<button onClick={() => handleApprovePR(pr.id, 'Rejected')} className="$1" title="$2" disabled={approvingId === pr.id || rejectingId === pr.id}> {rejectingId === pr.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} </button>`
  );

  // Fix PO and Contract buttons
  content = content.replace(/disabled=\{actioningId === po\.id\}/g, "disabled={approvingId === po.id || rejectingId === po.id}");
  content = content.replace(/disabled=\{actioningId === c\.id\}/g, "disabled={approvingId === c.id || rejectingId === c.id}");
  
  // PO check
  content = content.replace(/\{actioningId === po\.id \? <RefreshCw className="w-3 h-3 animate-spin" \/> : <Check/g, "{approvingId === po.id ? <RefreshCw className='w-3 h-3 animate-spin' /> : <Check");
  content = content.replace(/\{actioningId === po\.id \? <RefreshCw className="w-3 h-3 animate-spin" \/> : <X/g, "{rejectingId === po.id ? <RefreshCw className='w-3 h-3 animate-spin' /> : <X");

  // Contract check
  content = content.replace(/\{actioningId === c\.id \? <RefreshCw className="w-3 h-3 animate-spin" \/> : <Check/g, "{approvingId === c.id ? <RefreshCw className='w-3 h-3 animate-spin' /> : <Check");
  content = content.replace(/\{actioningId === c\.id \? <RefreshCw className="w-3 h-3 animate-spin" \/> : <X/g, "{rejectingId === c.id ? <RefreshCw className='w-3 h-3 animate-spin' /> : <X");

  fs.writeFileSync('src/components/ProcurementView.tsx', content, 'utf8');
}

function fixExpensesView() {
  let content = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

  // Add approvingId and rejectingId
  if (!content.includes('const [approvingId')) {
    content = content.replace(
      'const [deletingId, setDeletingId] = useState<string | null>(null);',
      'const [deletingId, setDeletingId] = useState<string | null>(null);\n  const [approvingId, setApprovingId] = useState<string | null>(null);\n  const [rejectingId, setRejectingId] = useState<string | null>(null);'
    );
  }

  // Update handleApproval
  const oldApproval = `  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected') {
      setRejectionExpenseId(id);
      setRejectionReason('');
      return;
    }

    try {
      await onUpdateExpenseStatus(id, 'Approved');
    } catch (err: any) {
      alert(err.message || 'Erreur d\\'approbation');
    }
  };`;

  const newApproval = `  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
    if (status === 'Rejected') {
      setRejectionExpenseId(id);
      setRejectionReason('');
      return;
    }

    setApprovingId(id);
    try {
      await onUpdateExpenseStatus(id, 'Approved');
    } catch (err: any) {
      alert(err.message || 'Erreur d\\'approbation');
    } finally {
      setApprovingId(null);
    }
  };`;

  content = content.replace(oldApproval, newApproval);
  content = content.replace(oldApproval.replace(/\\r\\n/g, '\\n'), newApproval);

  // Rejection confirm
  const oldReject = `  const handleRejectionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionExpenseId) return;

    try {
      await onUpdateExpenseStatus(rejectionExpenseId, 'Rejected', rejectionReason);
      setRejectionExpenseId(null);
    } catch (err: any) {
      alert(err.message || 'Erreur de rejet');
    }
  };`;

  const newReject = `  const handleRejectionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionExpenseId) return;

    setRejectingId(rejectionExpenseId);
    try {
      await onUpdateExpenseStatus(rejectionExpenseId, 'Rejected', rejectionReason);
      setRejectionExpenseId(null);
    } catch (err: any) {
      alert(err.message || 'Erreur de rejet');
    } finally {
      setRejectingId(null);
    }
  };`;

  content = content.replace(oldReject, newReject);
  content = content.replace(oldReject.replace(/\\r\\n/g, '\\n'), newReject);

  // Update Buttons in Expenses UI
  content = content.replace(
    /<button \s*onClick=\{\(\) => handleApproval\(e\.id, 'Approved'\)\}\s*className="(.*?)"\s*title="(.*?)"\s*id="(.*?)"\s*>\s*<Check className="w-3\.5 h-3\.5" \/>\s*<\/button>/g,
    `<button onClick={() => handleApproval(e.id, 'Approved')} className="$1" title="$2" id="$3" disabled={approvingId === e.id || rejectingId === e.id}> {approvingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} </button>`
  );

  content = content.replace(
    /<button \s*onClick=\{\(\) => handleApproval\(e\.id, 'Rejected'\)\}\s*className="(.*?)"\s*title="(.*?)"\s*id="(.*?)"\s*>\s*<X className="w-3\.5 h-3\.5" \/>\s*<\/button>/g,
    `<button onClick={() => handleApproval(e.id, 'Rejected')} className="$1" title="$2" id="$3" disabled={approvingId === e.id || rejectingId === e.id}> {rejectingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} </button>`
  );

  // Make sure to add RefreshCw if not imported
  if (!content.includes('RefreshCw')) {
    content = content.replace(/Check,/g, 'Check, RefreshCw,');
  }

  // Find rejection modal submit button to add spinner for Reject confirm
  content = content.replace(
    /<button \s*type="submit" \s*className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-semibold"\s*>\s*\{t\('reject'\)\}\s*<\/button>/g,
    `<button type="submit" className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-semibold inline-flex items-center gap-2" disabled={rejectingId !== null}> {rejectingId !== null ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />} {t('reject')} </button>`
  );


  fs.writeFileSync('src/components/ExpensesView.tsx', content, 'utf8');
}

fixProcurementView();
fixExpensesView();
console.log('Fixed loading states');
