const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

// 1. Add imports
content = content.replace(
  /import {([\s\S]*?)RefreshCw([\s\S]*?)} from 'lucide-react';/,
  "import {$1RefreshCw, UploadCloud, FileText, X$2} from 'lucide-react';"
);

// 2. Add states
content = content.replace(
  /const \[status, setStatus\] = useState<Project\['status'\]>\('Planning'\);/,
  `const [status, setStatus] = useState<Project['status']>('Planning');
  const [technicalFiles, setTechnicalFiles] = useState<{ id: string, name: string, url: string }[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            imageBase64: base64, 
            filename: file.name
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
  };

  const handleDeleteFile = (id: string) => {
    setDeletingFileId(id);
    // Simulate API delay for deletion from drive if we had one, but we'll just remove it from state for now.
    // Since we don't have a direct drive delete API exposed in this project, we just remove it from the list.
    setTimeout(() => {
      setTechnicalFiles(prev => prev.filter(f => f.id !== id));
      setDeletingFileId(null);
    }, 500);
  };`
);

// 3. Update resetForm
content = content.replace(
  /setEditingProject\(null\);/,
  `setEditingProject(null);
    setTechnicalFiles([]);
    setUploadError(null);`
);

// 4. Update handleOpenEdit
content = content.replace(
  /setStatus\(p\.status\);/,
  `setStatus(p.status);
    setTechnicalFiles(p.technical_files || []);
    setUploadError(null);`
);

// 5. Update payload
content = content.replace(
  /planned_end_date: plannedEndDate,[\s\n]*status/,
  `planned_end_date: plannedEndDate,
      status,
      technical_files: technicalFiles`
);

// 6. Add UI field
content = content.replace(
  /(\s*<div className="space-y-1 col-span-2">[\s\n]*<label className="font-semibold text-slate-500 text-\[10px\] block">Statut de Chantier<\/label>[\s\n]*<select[\s\S]*?<\/select>[\s\n]*<\/div>)/,
  `$1

                {/* File Upload Field */}
                <div className="space-y-2 col-span-2 md:col-span-4">
                  <label className="font-semibold text-slate-500 text-[10px] block">Fichiers Techniques (PDF)</label>
                  
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <label className="relative cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium transition-all text-slate-600 dark:text-slate-300 w-full sm:w-auto">
                        <input 
                          type="file" 
                          accept=".pdf"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                          disabled={isUploadingFile}
                        />
                        {isUploadingFile ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        {isUploadingFile ? 'Chargement...' : 'Ajouter un PDF'}
                      </label>
                      {uploadError && <span className="text-rose-500 text-[10px] font-semibold">{uploadError}</span>}
                    </div>

                    {technicalFiles.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                        {technicalFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg group">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 overflow-hidden hover:opacity-80 flex-1">
                              <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-200 truncate font-mono">
                                {file.name}
                              </span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded ml-2 flex-shrink-0 disabled:opacity-50"
                              title="Supprimer"
                              disabled={deletingFileId === file.id}
                            >
                              {deletingFileId === file.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>`
);

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('Done modifying ProjectsView.tsx');
