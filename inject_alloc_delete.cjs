const fs = require('fs');

let content = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

// 1. Add the column header for Actions if isApprover
content = content.replace(
  /<th className="p-4 font-semibold">Justificatif<\/th>[\s]*<\/tr>/,
  '<th className="p-4 font-semibold">Justificatif</th>\n                    {isApprover && <th className="p-4 font-semibold text-center">Actions</th>}\n                  </tr>'
);

// 2. Add the td for Actions in the allocations map
content = content.replace(
  /(\(a\.receipt_url \|\| null\)\}[\s\S]*?<Eye className="w-3\.5 h-3\.5" \/> Reç?u[\s\S]*?<\/button>\s*\)\s*:\s*\(\s*<span className="text-slate-400 italic">Aucun<\/span>\s*\)\s*}\s*<\/div>\s*<\/td>)/,
  `$1\n                        {isApprover && (
                          <td className="p-4 text-center">
                            <button 
                              onClick={async () => { setDeletingId(a.id); try { await onDeleteAllocation(a.id); } finally { setDeletingId(null); } }} disabled={deletingId === a.id}
                              className="p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded transition-colors"
                              title="Supprimer ce versement"
                            >
                              {deletingId === a.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        )}`
);

// 3. Fix the colSpan if empty
content = content.replace(
  /colSpan=\{6\} className="p-8 text-center text-slate-400">[\s]*Aucune allocation/,
  'colSpan={isApprover ? 7 : 6} className="p-8 text-center text-slate-400">\n                        Aucune allocation'
);

fs.writeFileSync('src/components/ExpensesView.tsx', content, 'utf8');
console.log('Done!');
