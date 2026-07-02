const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

content = content.replace(
  /const response = await secureFetch\('\/api\/upload', {[\s\S]*?body: JSON\.stringify\(\{[\s\S]*?imageBase64: base64,[\s\S]*?filename: file\.name[\s\S]*?\}\)[\s\S]*?\}\);/,
  `const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
        const secret = import.meta.env.VITE_GOOGLE_SCRIPT_SECRET;
        
        if (!scriptUrl) {
          throw new Error("Google Apps Script URL non configuré. Vérifiez .env.local");
        }

        const response = await fetch(scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8' // avoids CORS preflight
          },
          body: JSON.stringify({
            file: base64,
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            uploadType: 'project_technical_file',
            secret: secret || ''
          })
        });`
);

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('Successfully replaced fetch logic with Regex.');
