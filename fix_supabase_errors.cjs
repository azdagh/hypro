const fs = require('fs');

let content = fs.readFileSync('server/supabase.ts', 'utf8');

const sanitizeFunction = `
function sanitizeError(error) {
  if (error && error.message) {
    error.message = error.message
      .replace(/Ã©/g, 'é')
      .replace(/Ã\\xA0/g, 'à')
      .replace(/Ã /g, 'à')
      .replace(/Ã¨/g, 'è')
      .replace(/Ãª/g, 'ê')
      .replace(/Ã§/g, 'ç')
      .replace(/Ã´/g, 'ô')
      .replace(/Ã®/g, 'î')
      .replace(/Ã»/g, 'û')
      .replace(/Ã¹/g, 'ù')
      .replace(/Ã¢/g, 'â');
  }
  return error;
}
`;

if (!content.includes('function sanitizeError')) {
  // Inject function after the imports
  const importEnd = content.indexOf('\n\n', content.lastIndexOf('import '));
  if (importEnd !== -1) {
    content = content.slice(0, importEnd) + sanitizeFunction + content.slice(importEnd);
  } else {
    content = sanitizeFunction + content;
  }
}

// Replace all `if (error) throw error;`
content = content.replace(/if\s*\(\s*error\s*\)\s*throw\s*error;/g, 'if (error) throw sanitizeError(error);');

fs.writeFileSync('server/supabase.ts', content, 'utf8');
console.log('Sanitized Supabase error throws!');
