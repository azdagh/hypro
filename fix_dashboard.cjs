const fs = require('fs');

let content = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');

// Fix mojibake
content = content.replace(/Allocations InjectAces/g, 'Allocations Injectées');
content = content.replace(/DAcpenses ApprouvAces/g, 'Dépenses Approuvées');
content = content.replace(/RAcpartition des DAcpenses/g, 'Répartition des Dépenses');
content = content.replace(/Fds de roulement injectAcs/g, 'Fds de roulement injectés');
content = content.replace(/Aucune dAcpense/g, 'Aucune dépense');

// Add minPointSize to Bars
content = content.replace(
  /<Bar dataKey="budget" name="Budget Initial" fill="#cbd5e1" radius=\{\[4, 4, 0, 0\]\} maxBarSize=\{60\} \/>/g,
  '<Bar dataKey="budget" name="Budget Initial" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={60} minPointSize={2} />'
);
content = content.replace(
  /<Bar dataKey="allocations" name="Allocations Injectées" fill="#10b981" radius=\{\[4, 4, 0, 0\]\} maxBarSize=\{60\} \/>/g,
  '<Bar dataKey="allocations" name="Allocations Injectées" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} minPointSize={2} />'
);
content = content.replace(
  /<Bar dataKey="expenses" name="Dépenses Approuvées" fill="#6366f1" radius=\{\[4, 4, 0, 0\]\} maxBarSize=\{60\} \/>/g,
  '<Bar dataKey="expenses" name="Dépenses Approuvées" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60} minPointSize={2} />'
);

fs.writeFileSync('src/components/DashboardView.tsx', content, 'utf8');
console.log('Fixed DashboardView.tsx');
