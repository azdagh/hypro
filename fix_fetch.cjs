const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

// Add import
content = content.replace(
  /import { formatCurrencyDZD, formatLocalDate, useTranslation } from '\.\.\/i18n';/,
  "import { formatCurrencyDZD, formatLocalDate, useTranslation } from '../i18n';\nimport { secureFetch } from '../lib/api';"
);

// Replace fetch with secureFetch
content = content.replace(
  /const response = await fetch\('\/api\/upload'/g,
  "const response = await secureFetch('/api/upload'"
);

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('Fixed fetch to secureFetch');
