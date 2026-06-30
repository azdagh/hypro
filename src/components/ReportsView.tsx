import React, { useState } from 'react';
import { FileText, Download, Printer, RefreshCw, Calendar, TrendingUp } from 'lucide-react';
import { Project, Allocation, Expense } from '../types';
import { formatCurrencyDZD, useTranslation } from '../i18n';

interface ReportsViewProps {
  projects: Project[];
  allocations: Allocation[];
  expenses: Expense[];
  categories: any[];
  profiles: any[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  projects,
  allocations,
  expenses,
  categories,
  profiles
}) => {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<'monthly' | 'annual' | 'cashflow' | 'budget'>('monthly');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('06'); // June
  const [enterpriseName, setEnterpriseName] = useState('');
  const [enterpriseLogo, setEnterpriseLogo] = useState<string>('');
  const [reportError, setReportError] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  const handleLogoChange = (file?: File) => {
    setReportError('');
    setEnterpriseLogo('');
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setReportError('Le logo doit être un fichier PNG ou JPG.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setEnterpriseLogo(String(reader.result || ''));
    reader.onerror = () => setReportError('Impossible de lire le fichier logo.');
    reader.readAsDataURL(file);
  };

  const escapeHtml = (value: string) =>
    value.replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char] || char));

  const handleGenerateReport = () => {
    if (!enterpriseName.trim()) {
      setReportError("Le nom de l'entreprise est requis.");
      return;
    }
    if (!enterpriseLogo) {
      setReportError('Le logo PNG ou JPG est requis.');
      return;
    }

    setReportError('');
    setGenerating(true);
    setTimeout(() => {
      // Filter data for report
      const approvedExpenses = expenses.filter(e => e.status === 'Approved');
      
      let filteredExpenses = approvedExpenses;
      if (selectedProject !== 'ALL') {
        filteredExpenses = filteredExpenses.filter(e => e.project_id === selectedProject);
      }
      
      // Filter by Month / Year
      if (reportType === 'monthly') {
        filteredExpenses = filteredExpenses.filter(e => {
          const date = new Date(e.submitted_at);
          const m = (date.getMonth() + 1).toString().padStart(2, '0');
          const y = date.getFullYear().toString();
          return m === selectedMonth && y === selectedYear;
        });
      } else if (reportType === 'annual' || reportType === 'budget') {
        filteredExpenses = filteredExpenses.filter(e => {
          const date = new Date(e.submitted_at);
          return date.getFullYear().toString() === selectedYear;
        });
      }

      // Project totals summary
      const summaryByProject = projects.map(p => {
        const projExp = approvedExpenses.filter(e => e.project_id === p.id);
        const projAlloc = allocations.filter(a => a.project_id === p.id);
        const totalAlloc = projAlloc.reduce((sum, a) => sum + a.amount_dzd, 0);
        const totalExp = projExp.reduce((sum, e) => sum + e.amount_dzd, 0);

        return {
          code: p.code,
          name: p.name,
          budget: p.budget,
          allocated: totalAlloc,
          spent: totalExp,
          remainingBudget: p.budget - totalExp,
          balance: totalAlloc - totalExp
        };
      });

      const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);

      setGeneratedReport({
        title: reportType === 'monthly' ? `Rapport Financier Mensuel - ${selectedMonth}/${selectedYear}` :
               reportType === 'annual' ? `Bilan Comptable Annuel - Exercice ${selectedYear}` :
               reportType === 'cashflow' ? `Analyse de Trésorerie & Flux de Caisse` :
               `Rapport d'Utilisation Budgétaire des Projets`,
        timestamp: new Date().toLocaleString(),
        type: reportType,
        totalExpenses: totalSpent,
        expensesList: filteredExpenses,
        projectSummaries: summaryByProject,
        enterpriseName: enterpriseName.trim(),
        enterpriseLogo,
        parameters: {
          project: selectedProject === 'ALL' ? 'Tous les chantiers' : projects.find(p => p.id === selectedProject)?.name,
          year: selectedYear,
          month: selectedMonth
        }
      });
      setGenerating(false);
    }, 800);
  };

  // Excel CSV file Generation
  const handleExportExcel = () => {
    if (!generatedReport) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `${generatedReport.enterpriseName} - RAPPORT FINANCIER\n`;
    csvContent += `Titre: ${generatedReport.title}\n`;
    csvContent += `Genere le: ${generatedReport.timestamp}\n\n`;

    if (generatedReport.type === 'budget' || generatedReport.type === 'annual') {
      csvContent += "Code Projet,Nom Projet,Budget Global (DZD),Allocations Caisse (DZD),Depenses Justifiees (DZD),Solde Caisse (DZD)\n";
      generatedReport.projectSummaries.forEach((s: any) => {
        csvContent += `"${s.code}","${s.name}",${s.budget},${s.allocated},${s.spent},${s.balance}\n`;
      });
    } else {
      csvContent += "Date,Projet,Categorie,Description,Montant (DZD),Soumis par\n";
      generatedReport.expensesList.forEach((e: any) => {
        const projName = projects.find(p => p.id === e.project_id)?.code || e.project_code || '';
        const catName = (e as any).expense_categories?.name || categories.find(c => c.id === e.category_id)?.name || e.category_name || '';
        const subName = (e as any).profiles?.full_name || profiles.find(p => p.id === e.submitted_by)?.full_name || e.submitted_by_name || '';
        csvContent += `"${new Date(e.submitted_at).toLocaleDateString()}","${projName}","${catName}","${e.description}",${e.amount_dzd},"${subName}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HYPRO_Rapport_${generatedReport.type}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable Window for PDF Layout
  const handleExportPDF = () => {
    if (!generatedReport) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableRowsHtml = '';
    if (generatedReport.type === 'budget' || generatedReport.type === 'annual') {
      generatedReport.projectSummaries.forEach((s: any) => {
        tableRowsHtml += `
          <tr>
            <td><b>${s.code}</b> - ${s.name}</td>
            <td align="right">${s.budget.toLocaleString()} DZD</td>
            <td align="right">${s.allocated.toLocaleString()} DZD</td>
            <td align="right" style="color: #b45309;">${s.spent.toLocaleString()} DZD</td>
            <td align="right" style="font-weight: bold;">${s.balance.toLocaleString()} DZD</td>
          </tr>
        `;
      });
    } else {
      generatedReport.expensesList.forEach((e: any) => {
        const projName = projects.find(p => p.id === e.project_id)?.code || e.project_code || '';
        const catName = (e as any).expense_categories?.name || categories.find(c => c.id === e.category_id)?.name || e.category_name || '';
        tableRowsHtml += `
          <tr>
            <td>${new Date(e.submitted_at).toLocaleDateString()}</td>
            <td>${(e as any).projects?.name || projName}</td>
            <td>${(e as any).expense_categories?.name || catName}</td>
            <td>${e.description}</td>
            <td align="right"><b>${e.amount_dzd.toLocaleString()} DZD</b></td>
          </tr>
        `;
      });
    }

    const safeEnterpriseName = escapeHtml(generatedReport.enterpriseName);
    const safeLogo = generatedReport.enterpriseLogo;

    printWindow.document.write(`
      <html>
        <head>
          <title>${generatedReport.title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
            .header { border-bottom: 3px solid #0f172a; padding-bottom: 24px; margin-bottom: 32px; display: flex; align-items: flex-start; gap: 24px; }
            .brand-logo { width: 80px; height: 80px; object-fit: contain; flex: 0 0 auto; display: ${safeLogo ? 'block' : 'none'}; }
            .brand-copy { min-width: 0; }
            .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; }
            .title { font-size: 20px; color: #334155; margin-bottom: 8px; }
            .meta { font-size: 12px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 16px 12px; font-size: 13px; border-bottom: 1px solid #f1f5f9; text-align: left; }
            th { font-weight: bold; color: #475569; border-bottom: 2px solid #e2e8f0; }
            .summary-box { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-top: 40px; display: inline-block; min-width: 300px; }
            .summary-title { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }
            .summary-val { font-size: 24px; font-weight: 800; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header">
            <img class="brand-logo" src="${safeLogo}" alt="Logo" />
            <div class="brand-copy">
              <div class="logo">${safeEnterpriseName || 'HYPRO PROMOTION IMMOBILIERE'}</div>
              <div class="title">${generatedReport.title}</div>
              <div class="meta">Généré le : ${generatedReport.timestamp} • Filtre : ${generatedReport.parameters.project} • Exercice : ${generatedReport.parameters.year}</div>
            </div>
          </div>

          <div class="overflow-x-auto w-full">
            <table>
              <thead>
                ${generatedReport.type === 'budget' || generatedReport.type === 'annual' ? `
                  <tr>
                    <th>Projet de Construction</th>
                    <th style="text-align: right">Budget Global</th>
                    <th style="text-align: right">Allocations Injectéeses</th>
                    <th style="text-align: right">Dépenses Justifiéeses</th>
                    <th style="text-align: right">Solde Disponible</th>
                  </tr>
                ` : `
                  <tr>
                    <th>Date</th>
                    <th>Chantier</th>
                    <th>Catégorie</th>
                    <th>Description</th>
                    <th style="text-align: right">Montant (DZD)</th>
                  </tr>
                `}
              </thead>
              <tbody>
                ${tableRowsHtml}
              </tbody>
            </table>
          </div>

          <div class="summary-box">
            <div class="summary-title">TOTAL DES DÉCAISSEMENTS CONSOLIDÉS</div>
            <div class="summary-val">${generatedReport.totalExpenses.toLocaleString()} DZD</div>
          </div>
          
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6" id="report-center-container">
      {/* Configuration Box */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="report-center-config">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" /> {t('reportCenter')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 text-xs" id="report-controls-form">
          <div className="space-y-1 lg:col-span-2">
            <label className="font-semibold text-slate-500">Nom de l'entreprise *</label>
            <input
              type="text"
              value={enterpriseName}
              onChange={e => setEnterpriseName(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5"
              placeholder="Nom affiché sur le rapport"
              required
            />
          </div>

          <div className="space-y-1 lg:col-span-2">
            <label className="font-semibold text-slate-500">Logo PNG / JPG *</label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={e => handleLogoChange(e.target.files?.[0])}
              className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2 text-xs"
              required
            />
          </div>

          {/* Report Type Selector */}
          <div className="space-y-1 lg:col-span-2">
            <label className="font-semibold text-slate-500">Nature du Rapport</label>
            <select 
              value={reportType} 
              onChange={e => setReportType(e.target.value as any)}
              className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5"
            >
              <option value="monthly">{t('monthlyReport')}</option>
              <option value="annual">{t('annualReport')}</option>
              <option value="budget">{t('budgetReport')}</option>
              <option value="cashflow">{t('cashFlowReport')}</option>
            </select>
          </div>

          {/* Project filter */}
          <div className="space-y-1 lg:col-span-2">
            <label className="font-semibold text-slate-500">Chantier Concerné</label>
            <select 
              value={selectedProject} 
              onChange={e => setSelectedProject(e.target.value)}
              className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5"
            >
              <option value="ALL">Tous les chantiers (Consolidé)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
              ))}
            </select>
          </div>

          {/* Month / Year selectors */}
          <div className="grid grid-cols-2 gap-2 lg:col-span-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Mois</label>
              <select 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)}
                disabled={reportType !== 'monthly'}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 disabled:opacity-50"
              >
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-slate-500">Exercice</label>
              <select 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
            </div>
          </div>

          {/* Action Trigger button */}
          <div className="flex items-end lg:col-span-2">
            <button 
              onClick={handleGenerateReport}
              className="w-full bg-slate-900 dark:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-200 text-slate-50 dark:text-slate-900 py-2.5 px-4 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
              disabled={generating}
              id="btn-generate-report"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
              {t('generateReport')}
            </button>
          </div>
        </div>
        {reportError && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{reportError}</p>
        )}
      </div>

      {/* Generated Report Display Preview panel */}
      {generatedReport ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs space-y-6" id="report-results-panel">
          {/* Action header bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 gap-4" id="report-results-header">
            <div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold uppercase tracking-wider">Aperçu Réel Avant Téléchargement</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{generatedReport.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Consolidé le {generatedReport.timestamp} • Filtres: {generatedReport.parameters.project}</p>
            </div>

            <div className="flex gap-2 text-xs" id="report-export-buttons">
              <button 
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 rounded-lg font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                id="btn-export-excel"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> {t('exportExcel')}
              </button>
              <button 
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center bg-slate-950 text-white hover:bg-slate-800 px-3.5 py-2 rounded-lg font-semibold transition-colors"
                id="btn-export-pdf"
              >
                <Printer className="w-3.5 h-3.5 mr-1" /> Imprimer / PDF
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="report-summary-metrics">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Décaissements Validés Période</span>
                <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-400">{formatCurrencyDZD(generatedReport.totalExpenses)}</span>
              </div>
              <TrendingUp className="w-8 h-8 text-amber-600/20" />
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Volume de Justificatifs</span>
                <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100">
                  {generatedReport.type === 'budget' || generatedReport.type === 'annual' ? generatedReport.projectSummaries.length : generatedReport.expensesList.length} lignes
                </span>
              </div>
              <Calendar className="w-8 h-8 text-slate-400/25" />
            </div>
          </div>

          {/* Report Data Table Preview */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs" id="report-preview-table-container">
            {generatedReport.type === 'budget' || generatedReport.type === 'annual' ? (
              <div className="overflow-x-auto w-full">
<table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="p-3">Chantier de Construction</th>
                    <th className="p-3 text-right">Budget Global</th>
                    <th className="p-3 text-right">Allocations Injectéeses</th>
                    <th className="p-3 text-right">Dépenses Justifiéeses</th>
                    <th className="p-3 text-right">Solde Caisse</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {generatedReport.projectSummaries.map((s: any) => (
                    <tr key={s.code} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 dark:text-slate-50">{s.name}</span>
                        <span className="text-[10px] text-slate-400 block font-mono">{s.code}</span>
                      </td>
                      <td className="p-3 text-right font-mono">{formatCurrencyDZD(s.budget)}</td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">{formatCurrencyDZD(s.allocated)}</td>
                      <td className="p-3 text-right font-mono text-amber-700 font-medium">{formatCurrencyDZD(s.spent)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">{formatCurrencyDZD(s.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
</div>
            ) : (
              <div className="overflow-x-auto w-full">
<table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase text-[10px]">
                    <th className="p-3">Date</th>
                    <th className="p-3">Chantier</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Description / Objet</th>
                    <th className="p-3 text-right">Montant (DZD)</th>
                    <th className="p-3">Soumis Par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {generatedReport.expensesList.map((e: any) => {
                    const projCode = (e as any).projects?.name || projects.find(p => p.id === e.project_id)?.name || e.project_code || '';
                    const catName = (e as any).expense_categories?.name || categories.find(c => c.id === e.category_id)?.name || e.category_name || '';
                    const subName = (e as any).profiles?.full_name || profiles.find(p => p.id === e.submitted_by)?.full_name || e.submitted_by_name || '';
                    return (
                    <tr key={e.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                      <td className="p-3 text-slate-500 font-mono">{new Date(e.submitted_at).toLocaleDateString()}</td>
                      <td className="p-3 font-semibold">{projCode}</td>
                      <td className="p-3 text-slate-500">{catName}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300 font-medium max-w-[200px] truncate" title={e.description}>{e.description}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-slate-50">{formatCurrencyDZD(e.amount_dzd)}</td>
                      <td className="p-3 font-medium text-slate-600 dark:text-slate-400">{subName}</td>
                    </tr>
                    );
                  })}
                  {generatedReport.expensesList.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400 font-medium">Aucun décaissement justifié trouvé sur cette période.</td>
                    </tr>
                  )}
                </tbody>
              </table>
</div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs" id="report-empty-placeholder">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          Sélectionnez les paramètres et cliquez sur "Générer le Rapport" pour visualiser le grand livre des décaissements et des budgets.
        </div>
      )}
    </div>
  );
};


