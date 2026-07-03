const fs = require('fs');

let content = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

// 1. Add states
if (!content.includes('approvingId')) {
  content = content.replace(
    'const [duplicateAlert, setDuplicateAlert] = useState(false);',
    'const [duplicateAlert, setDuplicateAlert] = useState(false);\n  const [approvingId, setApprovingId] = useState<string | null>(null);\n  const [rejectingId, setRejectingId] = useState<string | null>(null);'
  );
}

// 2. Update handleApproval
const oldHandleApproval = `  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
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

const newHandleApproval = `  const handleApproval = async (id: string, status: 'Approved' | 'Rejected') => {
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

content = content.replace(oldHandleApproval, newHandleApproval);
content = content.replace(oldHandleApproval.replace(/\r\n/g, '\n'), newHandleApproval);

// 3. Update handleRejectionConfirm
const oldHandleRejection = `  const handleRejectionConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionExpenseId) return;

    try {
      await onUpdateExpenseStatus(rejectionExpenseId, 'Rejected', rejectionReason);
      setRejectionExpenseId(null);
    } catch (err: any) {
      alert(err.message || 'Erreur de rejet');
    }
  };`;

const newHandleRejection = `  const handleRejectionConfirm = async (e: React.FormEvent) => {
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

content = content.replace(oldHandleRejection, newHandleRejection);
content = content.replace(oldHandleRejection.replace(/\r\n/g, '\n'), newHandleRejection);

// 4. Update the buttons in the map
content = content.replace(
  /<button \s*onClick=\{\(\) => handleApproval\(e\.id, 'Approved'\)\}\s*className="(.*?)"\s*title="(.*?)"\s*id="(.*?)"\s*>\s*<Check className="w-3\.5 h-3\.5" \/>\s*<\/button>/g,
  `<button onClick={() => handleApproval(e.id, 'Approved')} className="$1" title="$2" id="$3" disabled={approvingId === e.id || rejectingId === e.id}> {approvingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} </button>`
);

content = content.replace(
  /<button \s*onClick=\{\(\) => handleApproval\(e\.id, 'Rejected'\)\}\s*className="(.*?)"\s*title="(.*?)"\s*id="(.*?)"\s*>\s*<X className="w-3\.5 h-3\.5" \/>\s*<\/button>/g,
  `<button onClick={() => handleApproval(e.id, 'Rejected')} className="$1" title="$2" id="$3" disabled={approvingId === e.id || rejectingId === e.id}> {rejectingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />} </button>`
);

// Add RefreshCw to imports if needed
if (!content.includes('RefreshCw')) {
  content = content.replace(/Check,/g, 'Check, RefreshCw,');
}

fs.writeFileSync('src/components/ExpensesView.tsx', content, 'utf8');
console.log('Fixed loading states in ExpensesView.tsx');
