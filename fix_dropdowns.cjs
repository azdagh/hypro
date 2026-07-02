const fs = require('fs');
const glob = require('fs').readdirSync;
const path = require('path');

const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  if (file === 'ProjectsView.tsx') continue; // already handled ProjectsView
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace {projects.map with {projects.filter(p => p.code !== 'GEN-00').map
  if (content.includes('{projects.map(p =>')) {
    content = content.replace(/\{projects\.map\(p =>/g, "{projects.filter(p => p.code !== 'GEN-00').map(p =>");
    changed = true;
  }
  
  if (content.includes('projects.map(p =>')) {
    content = content.replace(/projects\.map\(p =>/g, "projects.filter(p => p.code !== 'GEN-00').map(p =>");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed ' + file);
  }
}
