const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

// Inject the file viewer section into the Details Page
const injectionTarget = `                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg space-y-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 text-[10px]">Étages / Appartements</span>
                    <p className="font-bold font-mono">{p.number_of_floors} / {p.number_of_apartments}</p>
                  </div>
                </div>
              </div>`;

const injectedCode = `                <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg space-y-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400 text-[10px]">Étages / Appartements</span>
                    <p className="font-bold font-mono">{p.number_of_floors} / {p.number_of_apartments}</p>
                  </div>
                </div>
              </div>
              
              {/* Display technical files if any */}
              {p.technical_files && p.technical_files.length > 0 && (
                <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <h4 className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Fichiers Techniques</h4>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {p.technical_files.map(file => (
                      <a 
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
                      </a>
                    ))}
                  </div>
                </div>
              )}`;

// Need to handle different character encodings in the regex matching because the terminal showed it differently, but in code it should be UTF-8.
content = content.replace(
  /(\s*<div className="bg-slate-50 dark:bg-slate-800\/50 p-2\.5 rounded-lg space-y-1 flex items-center gap-2">\s*<Layers className="w-4 h-4 text-slate-400" \/>\s*<div>\s*<span className="text-slate-400 text-\[10px\]">Étages \/ Appartements<\/span>\s*<p className="font-bold font-mono">\{p\.number_of_floors\} \/ \{p\.number_of_apartments\}<\/p>\s*<\/div>\s*<\/div>\s*<\/div>)/,
  injectedCode
);

fs.writeFileSync('src/components/ProjectsView.tsx', content, 'utf8');
console.log('Done injecting file viewer');
