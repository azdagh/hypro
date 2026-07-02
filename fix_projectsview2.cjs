const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

// ── 1. Add ArrowUpRight to lucide imports ──────────────────────────────────
content = content.replace(
  'Plus, Edit, Eye, Trash2, Calendar, MapPin, Building, \n  Layers, ChevronLeft, Wallet, CheckSquare, Info, RefreshCw, UploadCloud, FileText, X',
  'Plus, Edit, Eye, Trash2, Calendar, MapPin, Building, \n  Layers, ChevronLeft, Wallet, CheckSquare, Info, RefreshCw, UploadCloud, FileText, X, ArrowUpRight'
);

// ── 2. Add previewUrl state after deletingFileId ──────────────────────────
content = content.replace(
  '  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);\r\n',
  '  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);\r\n  const [previewUrl, setPreviewUrl] = useState<string | null>(null);\r\n'
);

// ── 3. Fix upload loading by wrapping FileReader in a Promise ─────────────
const oldHandler = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {\r\n    const file = e.target.files?.[0];\r\n    if (!file) return;\r\n\r\n    if (file.type !== 'application/pdf') {\r\n      setUploadError('Veuillez sélectionner un fichier PDF.');\r\n      return;\r\n    }\r\n\r\n    setIsUploadingFile(true);\r\n    setUploadError(null);\r\n\r\n    try {\r\n      const reader = new FileReader();\r\n      reader.readAsDataURL(file);\r\n      reader.onload = async () => {\r\n        const base64 = reader.result as string;\r\n        \r\n        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;\r\n        const secret = import.meta.env.VITE_GOOGLE_SCRIPT_SECRET;\r\n        \r\n        if (!scriptUrl) {\r\n          throw new Error("Google Apps Script URL non configuré. Vérifiez .env.local");\r\n        }\r\n\r\n        const response = await fetch(scriptUrl, {\r\n          method: 'POST',\r\n          headers: {\r\n            'Content-Type': 'text/plain;charset=utf-8' // avoids CORS preflight\r\n          },\r\n          body: JSON.stringify({\r\n            file: base64,\r\n            fileName: file.name,\r\n            mimeType: file.type || 'application/pdf',\r\n            uploadType: 'project_technical_file',\r\n            secret: secret || ''\r\n          })\r\n        });\r\n\r\n        const uploadData = await response.json();\r\n        if (!uploadData.success) {\r\n           throw new Error(uploadData.error || "Echec de l'upload vers Google Drive");\r\n        }\r\n\r\n        setTechnicalFiles(prev => [...prev, {\r\n          id: uploadData.fileId,\r\n          name: file.name,\r\n          url: uploadData.webViewLink\r\n        }]);\r\n      };\r\n      reader.onerror = () => {\r\n        throw new Error('Erreur de lecture du fichier');\r\n      };\r\n    } catch (err: any) {\r\n      setUploadError(err.message || 'Erreur lors du téléchargement');\r\n    } finally {\r\n      setIsUploadingFile(false);\r\n      // clear the input\r\n      e.target.value = '';\r\n    }\r\n  };`;

const newHandler = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {\r\n    const file = e.target.files?.[0];\r\n    if (!file) return;\r\n    if (file.type !== 'application/pdf') {\r\n      setUploadError('Veuillez sélectionner un fichier PDF.');\r\n      return;\r\n    }\r\n    setIsUploadingFile(true);\r\n    setUploadError(null);\r\n    try {\r\n      await new Promise<void>((resolve, reject) => {\r\n        const reader = new FileReader();\r\n        reader.readAsDataURL(file);\r\n        reader.onload = async () => {\r\n          try {\r\n            const base64 = reader.result as string;\r\n            const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;\r\n            const secret = import.meta.env.VITE_GOOGLE_SCRIPT_SECRET;\r\n            if (!scriptUrl) throw new Error('Google Apps Script URL non configuré.');\r\n            const response = await fetch(scriptUrl, {\r\n              method: 'POST',\r\n              headers: { 'Content-Type': 'text/plain;charset=utf-8' },\r\n              body: JSON.stringify({\r\n                file: base64,\r\n                fileName: file.name,\r\n                mimeType: file.type || 'application/pdf',\r\n                uploadType: 'project_technical_file',\r\n                secret: secret || ''\r\n              })\r\n            });\r\n            const uploadData = await response.json();\r\n            if (!uploadData.success) throw new Error(uploadData.error || "Echec de l'upload vers Google Drive");\r\n            setTechnicalFiles(prev => [...prev, { id: uploadData.fileId, name: file.name, url: uploadData.webViewLink }]);\r\n            resolve();\r\n          } catch (err) { reject(err); }\r\n        };\r\n        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));\r\n      });\r\n    } catch (err: any) {\r\n      setUploadError(err.message || 'Erreur lors du téléchargement');\r\n    } finally {\r\n      setIsUploadingFile(false);\r\n      e.target.value = '';\r\n    }\r\n  };`;

if (content.includes(oldHandler)) {
  content = content.replace(oldHandler, newHandler);
  console.log('✓ Fixed upload handler');
} else {
  console.log('✗ Could not find upload handler - checking normalized...');
  // Try with LF only (no \r)
  const normalized = content.replace(/\r\n/g, '\n');
  const oldNorm = oldHandler.replace(/\r\n/g, '\n');
  if (normalized.includes(oldNorm)) {
    const newNorm = newHandler.replace(/\r\n/g, '\n');
    content = normalized.replace(oldNorm, newNorm);
    console.log('✓ Fixed upload handler (normalized)');
  } else {
    console.log('✗ Still not found');
  }
}

// ── 4. Replace target="_blank" file links in Details page with preview buttons ──
// Details page: <a key={...} href={...} target="_blank" ...>
content = content.replace(
  /(<a\s*\n?\s*key=\{file\.id\}\s*\n?\s*href=\{file\.url\}\s*\n?\s*target="_blank"\s*\n?\s*rel="noopener noreferrer"\s*\n?\s*className="flex items-center gap-2 p-2 border border-slate-100 dark:border-slate-700\/50 bg-slate-50\/50 dark:bg-slate-800\/20 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg group transition-colors"\s*\n?\s*>)/gs,
  (match) => match
    .replace(/<a /, '<button type="button" onClick={() => setPreviewUrl(file.url)} ')
    .replace(/href=\{file\.url\}\s*\n?\s*/, '')
    .replace(/target="_blank"\s*\n?\s*/, '')
    .replace(/rel="noopener noreferrer"\s*\n?\s*/, '')
);
content = content.replace(
  /(\s*<\/a>\s*\n(\s*)\)\}\s*\n(\s*)<\/div>\s*\n(\s*)<\/div>\s*\n(\s*)\)\}\s*\n(\s*)<\/div>)/,
  (m) => m.replace('</a>', '</button>')
);
console.log('✓ Replaced details page links');

// ── 5. Replace target="_blank" in form file list ──────────────────────────
content = content.replace(
  '<a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 overflow-hidden hover:opacity-80 flex-1">',
  '<button type="button" onClick={() => setPreviewUrl(file.url)} className="flex items-center gap-2 overflow-hidden hover:opacity-80 flex-1 text-left">'
);
// Close tag replacement for the form list link
content = content.replace(
  /(<\/a>)\s*\n(\s*<button\s*\n\s*type="button"\s*\n\s*onClick=\{\(\) => handleDeleteFile)/,
  '</button>\n$2'
);
console.log('✓ Replaced form list links');

// ── 6. Add preview modal before the closing of the main return ────────────
const closingTag = `    </div>\n  );\n};`;
const withModal = `      {/* Full-screen Technical File Preview Modal */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 z-[999]"
          id="tech-file-preview-overlay"
        >
          <div className="w-full max-w-5xl flex justify-between items-center mb-3 px-1">
            <span className="text-white/70 text-xs sm:text-sm font-medium">Aperçu du Fichier Technique</span>
            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-white hover:text-emerald-400 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" /> <span className="hidden sm:inline">Ouvrir</span>
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); setPreviewUrl(null); }}
                className="bg-white/10 hover:bg-rose-500 text-white p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div
            className="w-full max-w-5xl h-[85vh] bg-slate-100 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            id="tech-file-preview-container"
          >
            <iframe
              src={(() => {
                const url = previewUrl || '';
                const m1 = url.match(/\\/file\\/d\\/([^/]+)/);
                if (m1) return \`https://drive.google.com/file/d/\${m1[1]}/preview\`;
                const m2 = url.match(/[?&]id=([^&]+)/);
                if (m2) return \`https://drive.google.com/file/d/\${m2[1]}/preview\`;
                return url.replace(/\\/view(\\?.*)?$/, '/preview');
              })()}
              className="w-full h-full border-0"
              allow="autoplay"
              title="Technical File Preview"
            />
          </div>
        </div>
      )}

    </div>
  );
};`;

if (content.includes(closingTag)) {
  content = content.replace(closingTag, withModal);
  console.log('✓ Added preview modal');
} else {
  console.log('✗ Could not find closing tag for modal insertion');
}

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('\nAll done! Check the diff with: git diff');
