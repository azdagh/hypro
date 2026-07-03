const fs = require('fs');

function fixProcurementView() {
  let content = fs.readFileSync('src/components/ProcurementView.tsx', 'utf8');

  // Replace actioningId with approvingId and rejectingId
  if (!content.includes('const [approvingId')) {
    content = content.replace('const [actioningId, setActioningId] = useState<string | null>(null);', 
      'const [approvingId, setApprovingId] = useState<string | null>(null);\n  const [rejectingId, setRejectingId] = useState<string | null>(null);');
  }

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

fixProcurementView();
console.log('Fixed ProcurementView loading states');
