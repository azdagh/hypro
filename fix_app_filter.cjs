const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const OLD_FILTER = `                  // 3. Filtered Projects
                  const filteredProjects = projects.filter(p => {
                    if (isFdOrAccountantOrAdmin) return true;
                    const hasAllocations = filteredAllocations.some(a => a.project_id === p.id);
                    const hasExpenses = filteredExpenses.some(e => e.project_id === p.id);
                    const isAssigned = myAssignments.some(a => a.project_id === p.id);
                    return hasAllocations || hasExpenses || isAssigned;
                  });`;

const NEW_FILTER = `                  // 3. Filtered Projects
                  const filteredProjects = projects.filter(p => {
                    // Tous les utilisateurs (y compris Site Manager) doivent pouvoir voir tous les projets 
                    // pour pouvoir sAlectionner un projet lors de la crAation de dAenses, achats, etc.
                    return true;
                  });`;

if (c.includes(OLD_FILTER)) {
  c = c.replace(OLD_FILTER, NEW_FILTER);
  fs.writeFileSync('src/App.tsx', c);
  console.log('Successfully updated filteredProjects in App.tsx');
} else {
  console.log('Could not find exact OLD_FILTER block. Attempting line by line replace...');
  // Fallback
  let lines = c.split('\n');
  let start = lines.findIndex(l => l.includes('// 3. Filtered Projects'));
  if (start !== -1) {
    let end = start;
    while (!lines[end].includes('});') && end < start + 15) {
      end++;
    }
    lines.splice(start, end - start + 1, 
      '                  // 3. Filtered Projects',
      '                  const filteredProjects = projects.filter(p => {',
      '                    return true;',
      '                  });'
    );
    fs.writeFileSync('src/App.tsx', lines.join('\n'));
    console.log('Successfully updated using fallback method.');
  } else {
    console.error('Could not find // 3. Filtered Projects at all.');
  }
}
