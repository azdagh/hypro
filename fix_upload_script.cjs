const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

const targetUpload = `        const response = await secureFetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64, 
            filename: file.name
          })
        });`;

const newUpload = `        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
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
        });`;

content = content.replace(targetUpload, newUpload);

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('Fixed Google Apps Script upload in ProjectsView.tsx');
