const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  const fixes = [
    [/â€”/g, '—'],
    [/âœ•/g, '✕'],
    [/âœ”/g, '✔'],
    [/âœ“/g, '✓'],
    [/âœ—/g, '✗'],
    [/â€¢/g, '•'],
    [/Â/g, ''], // Sometimes Â is left over before spaces or non-breaking spaces
  ];

  for (const [pattern, replacement] of fixes) {
    content = content.replace(pattern, replacement);
  }

  // A targeted fix for any remaining Â followed by space:
  content = content.replace(/Â /g, ' ');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed symbols:', filePath);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        processDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fixFile(fullPath);
    }
  }
}

processDirectory('src');
