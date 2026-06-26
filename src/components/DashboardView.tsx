import React from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, Wallet, ArrowDownRight, AlertCircle, CheckCircle, 
  XCircle, BarChart3, PieChartIcon, Calendar 
} from 'lucide-react';
import { Project, Allocation, Expense, PurchaseRequest } from '../types';
import { formatCurrencyDZD, useTranslation } from '../i18n';

interface DashboardViewProps {
  projects: Project[];
  allocations: Allocation[];
  expenses: Expense[];
  purchaseRequests: PurchaseRequest[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  allocations,
  expenses,
  purchaseRequests
}) => {
  const { t, lang } = useTranslation();

  // Financial calculations
  const totalAllocatedAmount = allocations.reduce((sum, a) => sum + a.amount_dzd, 0);
  
  const approvedExpenses = expenses.filter(e => e.status === 'Approved');
  const totalApprovedExpensesAmount = approvedExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);
  
  const rejectedExpenses = expenses.filter(e => e.status === 'Rejected');
  const totalRejectedExpensesAmount = rejectedExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);
  
  const pendingExpenses = expenses.filter(e => e.status === 'Pending');
  const totalPendingExpensesAmount = pendingExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);

  const availableBalance = totalAllocatedAmount - totalApprovedExpensesAmount;
  
  const pendingRequestsCount = purchaseRequests.filter(pr => pr.status === 'Pending').length + pendingExpenses.length;

  // Monthly spending summary (Group approved expenses by month)
  const monthlySpendingMap: Record<string, number> = {};
  approvedExpenses.forEach(e => {
    const d = new Date(e.submitted_at);
    const monthName = d.toLocaleDateString(lang === 'fr' ? 'fr-DZ' : 'ar-DZ', { month: 'short' });
    monthlySpendingMap[monthName] = (monthlySpendingMap[monthName] || 0) + e.amount_dzd;
  });

  const monthlySpendingData = Object.entries(monthlySpendingMap).map(([month, amount]) => ({
    name: month,
    amount
  })).slice(-6); // last 6 months

  // Cash flow forecast: simulated dynamic trajectory
  const cashFlowForecastData = monthlySpendingData.map((d, index) => {
    const projectedGrowth = 1.15; // works intensify toward autumn
    return {
      name: d.name,
      expenses: d.amount,
      forecast: Math.round(d.amount * projectedGrowth * (1 + index * 0.05))
    };
  });

  // Project utilization data for BarChart
  const projectUtilizationData = projects.map(p => {
    const projAllocations = allocations.filter(a => a.project_id === p.id).reduce((sum, a) => sum + a.amount_dzd, 0);
    const projExpenses = expenses.filter(e => e.project_id === p.id && e.status === 'Approved').reduce((sum, e) => sum + e.amount_dzd, 0);
    return {
      code: p.code,
      name: p.name,
      budget: p.budget,
      allocations: projAllocations,
      expenses: projExpenses,
      utilization: p.budget > 0 ? (projExpenses / p.budget) * 100 : 0
    };
  });

  // Allocation distribution for PieChart
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  const projectAllocationsShare = projects.map(p => {
    const amt = allocations.filter(a => a.project_id === p.id).reduce((sum, a) => sum + a.amount_dzd, 0);
    return {
      name: p.code || p.name,
      value: amt
    };
  }).filter(v => v.value > 0);

  // Fallback demo data when no allocations exist yet
  const pieData = projectAllocationsShare.length > 0
    ? projectAllocationsShare
    : [{ name: 'Aucune allocation', value: 1 }];

  const hasData = projectAllocationsShare.length > 0;

  return (
    <div className="space-y-6" id="dashboard-view-container">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="dashboard-stats-grid">
        {/* Total Allocations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between" id="card-total-allocations">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('totalAllocations')}</p>
            <h3 className="text-xl font-bold font-mono text-slate-900 dark:text-slate-50">{formatCurrencyDZD(totalAllocatedAmount)}</h3>
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Fds de roulement injectés
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-slate-700 dark:text-slate-200">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Approved Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between" id="card-total-expenses">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('totalExpenses')}</p>
            <h3 className="text-xl font-bold font-mono text-amber-700 dark:text-amber-500">{formatCurrencyDZD(totalApprovedExpensesAmount)}</h3>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> Dépenses décaissées
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg text-amber-600">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Available Petty Cash Balance */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between" id="card-available-balance">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('availableBalance')}</p>
            <h3 className={`text-xl font-bold font-mono ${availableBalance >= 0 ? 'text-slate-900 dark:text-slate-50' : 'text-rose-600'}`}>
              {formatCurrencyDZD(availableBalance)}
            </h3>
            <span className="text-xs text-slate-500">
              Trésorerie active chantiers
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-emerald-600">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Pending Approval Requests */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex items-center justify-between" id="card-pending-requests">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('pendingRequests')}</p>
            <h3 className="text-xl font-bold font-mono text-amber-600">{pendingRequestsCount}</h3>
            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> En attente de validation
            </span>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg text-amber-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Rejection / Pending Statistics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="sub-stats-grid">
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-xs text-slate-500">{t('approved')}</p>
            <p className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">{formatCurrencyDZD(totalApprovedExpensesAmount)}</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-500" />
          <div>
            <p className="text-xs text-slate-500">{t('rejected')}</p>
            <p className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">{formatCurrencyDZD(totalRejectedExpensesAmount)}</p>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <div>
            <p className="text-xs text-slate-500">Encours d'Examen (Moy.)</p>
            <p className="text-sm font-semibold font-mono text-slate-800 dark:text-slate-200">{formatCurrencyDZD(totalPendingExpensesAmount)}</p>
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid">
        {/* Project Budgets vs Allocations vs Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col h-[380px]" id="chart-project-budget-utilization">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" /> {t('budgetUtilization')} per Project
            </h3>
            <span className="text-xs font-mono text-slate-400">Values in DZD</span>
          </div>
          <div className="flex-1 min-h-0" id="project-utilization-bar-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectUtilizationData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString()} />
                <Tooltip 
                  cursor={{fill: "transparent"}}
                  formatter={(value: any) => [formatCurrencyDZD(value), '']}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#f8fafc' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="budget" name="Budget Initial" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="allocations" name="Allocations Injectées" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share of Allocations per project (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col h-[380px]" id="chart-project-allocations-share">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
            <PieChartIcon className="w-4 h-4 text-slate-500" /> Répartition des Allocations
          </h3>
          <div className="flex-1 min-h-0 relative flex items-center justify-center" id="allocations-share-pie-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip cursor={{fill: "transparent"}} formatter={(value: any) => hasData ? formatCurrencyDZD(value) : 'Aucune allocation'} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#f8fafc' }} />
                <Legend verticalAlign="bottom" height={36} iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-forecasting-grid">
        {/* Cash Flow Forecast area chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col h-[340px]" id="chart-cashflow-forecast">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" /> {t('cashFlowForecast')} (DZD)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{t('cashFlowExplanation')}</p>
            </div>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex-1 min-h-0" id="cash-flow-forecast-container">
            {monthlySpendingData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowForecastData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                  <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString()} />
                  <Tooltip cursor={{fill: "transparent"}} formatter={(value: any) => formatCurrencyDZD(value)} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#f8fafc' }} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="expenses" name="Dépenses Actuelles" stroke="#0f172a" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                  <Area type="monotone" dataKey="forecast" name="Trajectoire Prévisionnelle" stroke="#10b981" strokeDasharray="5 5" fillOpacity={1} fill="url(#colorFore)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                Enregistrez des dépenses approuvées pour visualiser l'analyse prédictive.
              </div>
            )}
          </div>
        </div>

        {/* Project Health Indicators (Donut-like List) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between" id="chart-project-health-indicators">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-slate-500" /> {t('financialHealth')}
            </h3>
            
            <div className="space-y-4" id="project-health-items-list">
              {projectUtilizationData.map(p => {
                let healthColor = 'bg-emerald-500 text-emerald-800 dark:text-emerald-300';
                let barColor = 'bg-emerald-600';
                let label = t('greenHealth');

                if (p.utilization > 85) {
                  healthColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
                  barColor = 'bg-rose-600';
                  label = t('redHealth');
                } else if (p.utilization > 60) {
                  healthColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
                  barColor = 'bg-amber-500';
                  label = t('orangeHealth');
                }

                return (
                  <div key={p.code} className="space-y-1.5" id={`project-health-item-${p.code}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${healthColor}`}>{label}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Utilisé: {p.utilization.toFixed(1)}%</span>
                      <span>Restant: {formatCurrencyDZD(p.budget - p.expenses)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${Math.min(p.utilization, 100)}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-xs text-slate-400">
            Les indicateurs de santé sont mis à jour en temps réel lors de la saisie des décaissements de fonds de roulement.
          </div>
        </div>
      </div>
    </div>
  );
};
