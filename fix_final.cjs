const fs = require('fs');
let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

// Normalize line endings to \n for reliable replacement
content = content.replace(/\r\n/g, '\n');

// 1. Add ArrowUpRight import
content = content.replace(
  'Plus, Edit, Eye, Trash2, Calendar, MapPin, Building, \n  Layers, ChevronLeft, Wallet, CheckSquare, Info, RefreshCw, UploadCloud, FileText, X',
  'Plus, Edit, Eye, Trash2, Calendar, MapPin, Building, \n  Layers, ChevronLeft, Wallet, CheckSquare, Info, RefreshCw, UploadCloud, FileText, X, ArrowUpRight'
);

// 2. Add previewUrl state after deletingFileId
content = content.replace(
  '  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);\n',
  '  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);\n  const [previewUrl, setPreviewUrl] = useState<string | null>(null);\n'
);

// 3. Fix upload handler: wrap in Promise so finally waits for async onload
const OLD = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Veuillez sélectionner un fichier PDF.');
      return;
    }

    setIsUploadingFile(true);
    setUploadError(null);

    try {
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
    }
  };`;

const NEW = `  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setUploadError('Veuillez sélectionner un fichier PDF.');
      return;
    }
    setIsUploadingFile(true);
    setUploadError(null);
    try {
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const scriptUrl = import.meta.env.VITE_GOOGLE_SCRIPT_URL;
            const secret = import.meta.env.VITE_GOOGLE_SCRIPT_SECRET;
            if (!scriptUrl) throw new Error('Google Apps Script URL non configuré.');
            const response = await fetch(scriptUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'text/plain;charset=utf-8' },
              body: JSON.stringify({
                file: base64,
                fileName: file.name,
                mimeType: file.type || 'application/pdf',
                uploadType: 'project_technical_file',
                secret: secret || ''
              })
            });
            const uploadData = await response.json();
            if (!uploadData.success) throw new Error(uploadData.error || "Echec de l'upload vers Google Drive");
            setTechnicalFiles(prev => [...prev, { id: uploadData.fileId, name: file.name, url: uploadData.webViewLink }]);
            resolve();
          } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      });
    } catch (err: any) {
      setUploadError(err.message || 'Erreur lors du téléchargement');
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };`;

if (content.includes(OLD)) {
  content = content.replace(OLD, NEW);
  console.log('✓ Fixed upload handler');
} else {
  console.log('✗ Upload handler not found');
  process.exit(1);
}

// 4. Replace `target="_blank"` file link in details page (the <a> for tech files)
content = content.replace(
  `                      <a \n                        key={file.id}\n                        href={file.url}\n                        target="_blank"\n                        rel="noopener noreferrer"\n                        className="flex items-center gap-2 p-2 border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg group transition-colors"\n                      >`,
  `                      <button\n                        key={file.id}\n                        type="button"\n                        onClick={() => setPreviewUrl(file.url)}\n                        className="flex items-center gap-2 p-2 border border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg group transition-colors w-full text-left"\n                      >`
);
content = content.replace(
  `                      </a>\n                    ))}\n                  </div>\n                </div>\n              )}\n          </div>`,
  `                      </button>\n                    ))}\n                  </div>\n                </div>\n              )}\n          </div>`
);
console.log('✓ Replaced details page links');

// 5. Replace `target="_blank"` link in form file list
content = content.replace(
  `                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 overflow-hidden hover:opacity-80 flex-1">`,
  `                            <button type="button" onClick={() => setPreviewUrl(file.url)} className="flex items-center gap-2 overflow-hidden hover:opacity-80 flex-1 text-left">`
);
content = content.replace(
  `                            </a>\n                            <button`,
  `                            </button>\n                            <button`
);
console.log('✓ Replaced form list links');

// 6. Add preview modal before </div>\n  );\n};
const CLOSING = `    </div>\n  );\n};`;
const MODAL = `      {/* Full-screen Technical File Preview Modal */}
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

if (content.includes(CLOSING)) {
  content = content.replace(CLOSING, MODAL);
  console.log('✓ Added preview modal');
} else {
  console.log('✗ Closing tag not found - dumping last 200 chars:');
  console.log(JSON.stringify(content.slice(-200)));
}

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('\nDone!');
