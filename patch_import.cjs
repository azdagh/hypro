const fs = require('fs');
let a = fs.readFileSync('src/App.tsx', 'utf8');

a = a.replace(
  `import { AdministrationView } from './components/AdministrationView';`,
  `import { AdministrationView } from './components/AdministrationView';\nimport { MasterAdminPanel } from './components/MasterAdminPanel';`
);

fs.writeFileSync('src/App.tsx', a);
console.log('Added MasterAdminPanel import');
