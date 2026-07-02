const fs = require('fs');
let c = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

c = c.replace(/\{projects\.length\}/g, "{projects.filter(p => p.code !== 'GEN-00').length}");
c = c.replace(/projects\.map\(p => \{/g, "projects.filter(p => p.code !== 'GEN-00').map(p => {");

fs.writeFileSync('src/components/ProjectsView.tsx', c);
console.log('Done filtering GEN-00 from ProjectsView.tsx');
