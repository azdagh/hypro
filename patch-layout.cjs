const fs = require('fs');
const path = require('path');

// 1. Fix Modal Z-Index issue by removing animate-fade-in from View root containers
const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find the first instance of 'className="... animate-fade-in"' and remove 'animate-fade-in'
  // Or simply replace all ' animate-fade-in"' with '"' ONLY if it's the main container (e.g. id="...-panel")
  // Actually, let's just remove animate-fade-in from divs that have an id ending in -panel, -container, -root, -page
  content = content.replace(/className="([^"]*)animate-fade-in([^"]*)"([^>]+id="[^"]*(?:panel|container|root|page)")/g, 'className="$1$2"$3');
  
  // Also clean up any extra spaces left behind
  content = content.replace(/className="([^"]+)\s+"/g, 'className="$1"');
  content = content.replace(/className="\s+([^"]+)"/g, 'className="$1"');
  content = content.replace(/className="space-y-6\s+"/g, 'className="space-y-6"');
  
  fs.writeFileSync(filePath, content);
}

// 2. Fix App.tsx mobile sidebar width
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace('z-[100] w-64', 'z-[100] w-[80vw] md:w-64');
fs.writeFileSync('src/App.tsx', appContent);

console.log("Layout fixes applied");
