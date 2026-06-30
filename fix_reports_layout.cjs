const fs = require('fs');

let content = fs.readFileSync('src/components/ReportsView.tsx', 'utf8');

const correctTemplate = 'printWindow.document.write(`\n\
      <html>\n\
        <head>\n\
          <title>${generatedReport.title}</title>\n\
          <style>\n\
            @media print { @page { size: portrait; margin: 15mm; } body { padding: 0 !important; } }\n\
            body { font-family: \\\'Helvetica Neue\\\', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; background: #fff; }\n\
            .page-container { max-width: 850px; margin: 0 auto; }\n\
            .header { border-bottom: 3px solid #0f172a; padding-bottom: 24px; margin-bottom: 32px; display: flex; align-items: flex-start; gap: 24px; }\n\
            .brand-logo { width: 80px; height: 80px; object-fit: contain; flex: 0 0 auto; display: ${safeLogo ? \\\'block\\\' : \\\'none\\\'}; }\n\
            .brand-copy { min-width: 0; }\n\
            .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; }\n\
            .title { font-size: 20px; color: #334155; margin-bottom: 8px; }\n\
            .meta { font-size: 12px; color: #64748b; }\n\
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }\n\
            th, td { padding: 16px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; text-align: left; }\n\
            th { font-weight: bold; color: #475569; border-bottom: 2px solid #e2e8f0; }\n\
            .summary-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 40px; display: inline-block; min-width: 300px; }\n\
            .summary-title { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }\n\
            .summary-val { font-size: 24px; font-weight: 800; color: #0f172a; }\n\
          </style>\n\
        </head>\n\
        <body>\n\
          <div class="page-container">\n\
            <div class="header">\n\
              <img class="brand-logo" src="${safeLogo}" alt="Logo" />\n\
              <div class="brand-copy">\n\
                <div class="logo">${safeEnterpriseName || \\\'HYPRO PROMOTION IMMOBILIERE\\\'}</div>\n\
                <div class="title">${generatedReport.title}</div>\n\
                <div class="meta">GÃ©nÃ©rÃ© le : ${generatedReport.timestamp} â€¢ Filtre : ${generatedReport.parameters.project} â€¢ Exercice : ${generatedReport.parameters.year}</div>\n\
              </div>\n\
            </div>\n\
\n\
            <div class="overflow-x-auto w-full">\n\
              <table>\n\
                <thead>\n\
                  ${generatedReport.type === \\\'budget\\\' || generatedReport.type === \\\'annual\\\' ? `\n\
                    <tr>\n\
                      <th>Projet de Construction</th>\n\
                      <th style="text-align: right">Budget Global</th>\n\
                      <th style="text-align: right">Allocations InjectÃ©es</th>\n\
                      <th style="text-align: right">DÃ©penses JustifiÃ©es</th>\n\
                      <th style="text-align: right">Solde Disponible</th>\n\
                    </tr>\n\
                  ` : `\n\
                    <tr>\n\
                      <th>Date</th>\n\
                      <th>Chantier</th>\n\
                      <th>CatÃ©gorie</th>\n\
                      <th>Description</th>\n\
                      <th style="text-align: right">Montant (DZD)</th>\n\
                    </tr>\n\
                  `}\n\
                </thead>\n\
                <tbody>\n\
                  ${tableRowsHtml}\n\
                </tbody>\n\
              </table>\n\
            </div>\n\
\n\
            <div class="summary-box">\n\
              <div class="summary-title">TOTAL DES DÃ‰CAISSEMENTS CONSOLIDÃ‰S</div>\n\
              <div class="summary-val">${generatedReport.totalExpenses.toLocaleString()} DZD</div>\n\
            </div>\n\
          </div>\n\
          \n\
          <script>setTimeout(() => { window.print(); }, 500);</script>\n\
        </body>\n\
      </html>\n\
    `);\n\
    printWindow.document.close();';

// Replace the entire printWindow.document.write block
const regex = /printWindow\.document\.write\([\s\S]*?printWindow\.document\.close\(\);/m;
content = content.replace(regex, correctTemplate);

// Also fix mojibake in ReportsView.tsx if any
content = content.replace(/Allocations InjectÃ©eses/g, 'Allocations InjectÃ©es');
content = content.replace(/DÃ©penses JustifiÃ©eses/g, 'DÃ©penses JustifiÃ©es');
content = content.replace(/GÃƒÂ©nÃƒÂ©rÃƒÂ©/g, 'GÃ©nÃ©rÃ©');

fs.writeFileSync('src/components/ReportsView.tsx', content, 'utf8');
console.log('Fixed ReportsView.tsx');

