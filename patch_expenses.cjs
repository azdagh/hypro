const fs = require('fs');

let expensesTsx = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

const targetLogic = `  // Compute isPersonalCategory for expense form
  const selectedCat = categories.find(c => c.id === expCategory);
  const isPersonalCategory = selectedCat && (selectedCat.name.includes('Frais Administratifs') || selectedCat.name.includes('Bureau'));`;

const replaceLogic = `  // Compute isPersonalCategory for expense form
  const selectedCat = categories.find(c => c.id === expCategory);
  // Check if it's explicitly marked as personal in DB, or fallback to name check for legacy
  const isPersonalCategory = selectedCat && (selectedCat.is_personal || selectedCat.name.includes('Frais Administratifs') || selectedCat.name.includes('Bureau') || selectedCat.name.includes('Personal'));`;

const targetSubmit = `    let finalProject = expProject;
    const cat = categories.find(c => c.id === expCategory);
    if (cat && (cat.name.includes('Frais Administratifs') || cat.name.includes('Bureau'))) {
      const defaultProject = projects.find(p => p.code === 'GEN-00');
      if (defaultProject) {
        finalProject = defaultProject.id;
      }
    }`;

const replaceSubmit = `    let finalProject = expProject;
    const cat = categories.find(c => c.id === expCategory);
    if (cat && (cat.is_personal || cat.name.includes('Frais Administratifs') || cat.name.includes('Bureau') || cat.name.includes('Personal'))) {
      const defaultProject = projects.find(p => p.code === 'GEN-00');
      if (defaultProject) {
        finalProject = defaultProject.id;
      }
    }`;

expensesTsx = expensesTsx.replace(targetLogic, replaceLogic);
expensesTsx = expensesTsx.replace(targetSubmit, replaceSubmit);

fs.writeFileSync('src/components/ExpensesView.tsx', expensesTsx);
console.log('Fixed ExpensesView.tsx');
