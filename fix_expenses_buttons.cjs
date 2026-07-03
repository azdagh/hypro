const fs = require('fs');

let content = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

content = content.replace(
  /<button\s*\n\s*onClick=\{\(\) => handleApproval\(e\.id, 'Approved'\)\}\s*\n\s*className="[^"]+"\s*\n\s*title="[^"]+"\s*\n\s*id={`btn-approve-exp-\$\{e\.id\}`}\s*\n\s*>\s*\n\s*<Check className="w-3\.5 h-3\.5" \/>\s*\n\s*<\/button>/g,
  `<button 
                              onClick={() => handleApproval(e.id, 'Approved')}
                              className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                              title="Approuver la dépense"
                              id={\`btn-approve-exp-\${e.id}\`}
                              disabled={approvingId === e.id || rejectingId === e.id}
                            >
                              {approvingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>`
);

content = content.replace(
  /<button\s*\n\s*onClick=\{\(\) => handleApproval\(e\.id, 'Rejected'\)\}\s*\n\s*className="[^"]+"\s*\n\s*title="[^"]+"\s*\n\s*id={`btn-reject-exp-\$\{e\.id\}`}\s*\n\s*>\s*\n\s*<X className="w-3\.5 h-3\.5" \/>\s*\n\s*<\/button>/g,
  `<button 
                              onClick={() => handleApproval(e.id, 'Rejected')}
                              className="p-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded transition-colors"
                              title="Rejeter la dépense"
                              id={\`btn-reject-exp-\${e.id}\`}
                              disabled={approvingId === e.id || rejectingId === e.id}
                            >
                              {rejectingId === e.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            </button>`
);

fs.writeFileSync('src/components/ExpensesView.tsx', content, 'utf8');
console.log('Fixed buttons');
