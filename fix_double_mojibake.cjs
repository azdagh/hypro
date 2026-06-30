const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  const fixes = [
    [/ÃƒÂ©/g, 'é'],
    [/ÃƒÂ¨/g, 'è'],
    [/ÃƒÂ /g, 'à'],
    [/ÃƒÂ§/g, 'ç'],
    [/ÃƒÂª/g, 'ê'],
    [/ÃƒÂ«/g, 'ë'],
    [/ÃƒÂ®/g, 'î'],
    [/ÃƒÂ¯/g, 'ï'],
    [/ÃƒÂ´/g, 'ô'],
    [/ÃƒÂ¹/g, 'ù'],
    [/ÃƒÂ»/g, 'û'],
    [/ÃƒÂ¼/g, 'ü'],
    [/ÃƒÂ¢/g, 'â'],
    [/Ãƒâ€°/g, 'É'],
    [/ÃƒË†/g, 'È'],
    [/Ãƒâ‚¬/g, 'À'],
    [/Ãƒâ€¡/g, 'Ç'],
    [/Ã‚Â°/g, '°'],
    [/Ã¢â‚¬â„¢/g, "'"],
    [/Ã¢â‚¬â€œ/g, '–'],
    [/Ã¢â‚¬â€/g, '—'],
    [/Ã¢â€šÂ¬/g, '€'],
    
    // Check for another layer of escaping that the user specifically mentioned:
    // "affichÃƒÂ©" -> "affiché"
    [/affichÃƒÂ©/g, 'affiché'],
    [/dÃƒÂ©pense/g, 'dépense'],
    
    // Some single layer mojibake again just in case:
    [/Ã©/g, 'é'],
    [/Ã¨/g, 'è'],
    [/Ã /g, 'à'],
    [/Ã§/g, 'ç'],
    [/Ã‰/g, 'É'],
    [/Â°/g, '°'],
  ];

  for (const [pattern, replacement] of fixes) {
    content = content.replace(pattern, replacement);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed:', filePath);
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
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.json')) {
      fixFile(fullPath);
    }
  }
}

processDirectory('src');
console.log('Done fixing typos.');
