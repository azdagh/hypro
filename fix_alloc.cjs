const fs = require('fs');

let content = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

const regex = /const payload = \{\s*project_id: allocProject,\s*amount_dzd: Number\(allocAmount\),\s*allocated_by: userId,\s*allocated_to: allocTo,\s*notes: allocNotes,\s*receipt_file_id: allocReceiptFileId,\s*receipt_url: allocReceiptUrl\s*\};/;

const newPayload = `let projectIdToUse = allocProject;
      if (!projectIdToUse) {
        const defaultProject = projects.find(p => p.code === 'GEN-00' || p.name === 'Non spécifié');
        if (defaultProject) {
          projectIdToUse = defaultProject.id;
        } else {
          alert("Erreur: Le projet par défaut 'Non spécifié' est introuvable. Veuillez sélectionner un projet.");
          return;
        }
      }

      const payload = {
        project_id: projectIdToUse,
        amount_dzd: Number(allocAmount),
        allocated_by: userId,
        allocated_to: allocTo,
        notes: allocNotes,
        receipt_file_id: allocReceiptFileId,
        receipt_url: allocReceiptUrl
      };`;

if (regex.test(content)) {
  content = content.replace(regex, newPayload);
  fs.writeFileSync('src/components/ExpensesView.tsx', content, 'utf8');
  console.log('Successfully updated alloc payload logic!');
} else {
  console.log('Could not match regex. Content near handleAllocSubmit:');
  const index = content.indexOf('const handleAllocSubmit');
  console.log(content.substring(index, index + 300));
}
