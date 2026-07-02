const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

// 1. Add ArrowUpRight to imports
content = content.replace(
  /Plus, Edit, Eye, Trash2, Calendar, MapPin, Building,\s*\n\s*Layers, ChevronLeft, Wallet, CheckSquare, Info, RefreshCw, UploadCloud, FileText, X/,
  'Plus, Edit, Eye, Trash2, Calendar, MapPin, Building,\n  Layers, ChevronLeft, Wallet, CheckSquare, Info, RefreshCw, UploadCloud, FileText, X, ArrowUpRight'
);

// 2. Add previewImageUrl state after deletingFileId state
content = content.replace(
  /const \[deletingFileId, setDeletingFileId\] = useState<string \| null>\(null\);/,
  `const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);`
);

// 3. Fix upload loading: move setIsUploadingFile into the reader.onload flow
// The current pattern has finally{setIsUploadingFile(false)} which runs BEFORE onload completes
// We need to restructure using a Promise wrapper

const oldUpload = `    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
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
        });

        const uploadData = await response.json();
        if (!uploadData.success) {
           throw new Error(uploadData.error || "Echec de l'upload vers Google Drive");
        }

        setTechnicalFiles(prev => [...prev, {
          id: uploadData.fileId,
          name: file.name,
          url: uploadData.webViewLink
        }]);
      };
      reader.onerror = () => {
        throw new Error('Erreur de lecture du fichier');
      };
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors du téléchargement');
    } finally {
      setIsUploadingFile(false);
      // clear the input
      e.target.value = '';
    }`;

const newUpload = `    try {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            
            const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
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
            });

            const uploadData = await response.json();
            if (!uploadData.success) {
               throw new Error(uploadData.error || "Echec de l'upload vers Google Drive");
            }

            setTechnicalFiles(prev => [...prev, {
              id: uploadData.fileId,
              name: file.name,
              url: uploadData.webViewLink
            }]);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      });
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors du téléchargement');
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }`;

if (content.includes('reader.onerror = () => {\n        throw new Error')) {
  content = content.replace(oldUpload, newUpload);
  console.log('Fixed upload loading.');
} else {
  console.log('ERROR: Could not find old upload pattern - may already be fixed or spacing differs');
}

// 4. Replace `target="_blank"` file link in the Details view (lines ~346-357)
const oldDetailsLink = `                      <a 
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg group transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate font-mono group-hover:text-emerald-600 transition-colors">
                          {file.name}
                        </span>
                      </a>`;

const newDetailsLink = `                      <button 
                        key={file.id}
                        onClick={() => setPreviewUrl(file.url)}
                        className="flex items-center gap-2 p-2 border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg group transition-colors w-full text-left"
                      >
                        <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate font-mono group-hover:text-emerald-600 transition-colors">
                          {file.name}
                        </span>
                      </button>`;

if (content.includes('target="_blank"')) {
  // Replace both occurrences (details page + form list)
  // Details page link
  content = content.replace(oldDetailsLink, newDetailsLink);
  console.log('Replaced details link');

  // Form list link (target="_blank" remaining)
  content = content.replace(
    /<a href={file\.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 overflow-hidden hover:opacity-80 flex-1">/,
    '<button type="button" onClick={() => setPreviewUrl(file.url)} className="flex items-center gap-2 overflow-hidden hover:opacity-80 flex-1 text-left">'
  );
  content = content.replace(
    /<\/a>\n(\s*)<button\n(\s*)type="button"\n(\s*)onClick={\(\) => handleDeleteFile/,
    '</button>\n$1<button\n$2type="button"\n$3onClick={() => handleDeleteFile'
  );
  console.log('Replaced form list link');
} else {
  console.log('No more target="_blank" to replace');
}

// 5. Add preview modal right before the closing </div> of the main return
// Insert before the final closing div/return
const closingReturn = `    </div>
  );
};`;

const withModal = `      {/* Full-screen File Preview Modal */}
      {previewUrl && (
        <div 
          onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-2 sm:p-4 z-[999] animate-fade-in"
          id="tech-file-preview-overlay"
        >
          {/* Top Actions Bar */}
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
          
          <div className="w-full max-w-5xl h-[85vh] bg-slate-100 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 flex-shrink-0" onClick={(e) => e.stopPropagation()} id="tech-file-preview-container">
            <iframe 
              src={(() => {
                const url = previewUrl || '';
                const fileIdMatch = url.match(/\\/file\\/d\\/([^/]+)/);
                if (fileIdMatch) return \`https://drive.google.com/file/d/\${fileIdMatch[1]}/preview\`;
                const openIdMatch = url.match(/[?&]id=([^&]+)/);
                if (openIdMatch) return \`https://drive.google.com/file/d/\${openIdMatch[1]}/preview\`;
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

content = content.replace(closingReturn, withModal);
console.log('Added preview modal');

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('All done!');
