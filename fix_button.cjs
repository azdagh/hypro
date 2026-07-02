const fs = require('fs');
let c = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

c = c.replace(
  'className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold disabled:opacity-50 inline-flex items-center gap-2"',
  'className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-semibold disabled:opacity-50 inline-flex items-center gap-2"'
);

fs.writeFileSync('src/components/ProjectsView.tsx', c);
