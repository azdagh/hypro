import React from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
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

  // Cash flow forecast: build 6-month curve using historical + projected data
  const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const now = new Date();
  const avgMonthlySpend = monthlySpendingData.length > 0
    ? monthlySpendingData.reduce((s, d) => s + d.amount, 0) / monthlySpendingData.length
    : 0;

  const cashFlowForecastData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1);
    const key = MONTH_NAMES[d.getMonth()];
    const hist = monthlySpendingMap[key] ?? (monthlySpendingMap[MONTH_NAMES[d.getMonth()]] ?? null);
    const isHistory = i < 3;
    const actual = hist ?? (isHistory ? avgMonthlySpend * (0.7 + i * 0.1) : null);
    const projected = Math.round((avgMonthlySpend || 500) * (1.05 + i * 0.07));
    return {
      name: key,
      actual: isHistory ? Math.round(actual ?? 0) : null,
      forecast: projected
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

  // Expenses distribution for PieChart
  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  const projectExpensesShare = projects.map(p => {
    const amt = expenses.filter(e => e.project_id === p.id && e.status === 'Approved').reduce((sum, e) => sum + e.amount_dzd, 0);
    return {
      name: p.code || p.name,
      value: amt
    };
  }).filter(v => v.value > 0);

  // Fallback demo data when no expenses exist yet
  const pieData = projectExpensesShare.length > 0
    ? projectExpensesShare
    : [{ name: 'Aucune dépense', value: 1 }];

  const hasData = projectExpensesShare.length > 0;

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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col" style={{height: '420px'}} id="chart-project-budget-utilization">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" /> {t('budgetUtilization')} per Project
            </h3>
            <span className="text-xs font-mono text-slate-400">Values in DZD</span>
          </div>
          <div className="flex-1 min-h-0 overflow-hidden" id="project-utilization-bar-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={projectUtilizationData} 
                margin={{ top: 10, right: 20, left: 10, bottom: 40 }}
                barCategoryGap="30%"
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="code" 
                  fontSize={11} 
                  stroke="#94a3b8" 
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                />
                <YAxis 
                  fontSize={11} 
                  stroke="#94a3b8" 
                  width={70}
                  tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString()} 
                />
                <Tooltip 
                  cursor={{fill: 'rgba(148,163,184,0.1)'}}
                  formatter={(value: any, name: string) => [formatCurrencyDZD(value), name]}
                  labelFormatter={(label) => {
                    const proj = projectUtilizationData.find(p => p.code === label);
                    return proj ? proj.name : label;
                  }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#f8fafc', fontSize: '11px' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="budget" name="Budget Initial" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="allocations" name="Allocations Injectées" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="expenses" name="Dépenses Approuvées" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Share of Expenses per project (Pie Chart) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col" style={{height: '420px'}} id="chart-project-expenses-share">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
            <PieChartIcon className="w-4 h-4 text-slate-500" /> Répartition des Dépenses
          </h3>
          <div className="flex-1 min-h-0 relative" id="expenses-share-pie-container">
            <svg style={{ height: 0, width: 0, position: 'absolute' }}>
              <defs>
                <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.15" />
                </filter>
              </defs>
            </svg>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  label={false}
                  labelLine={false}
                  stroke="none"
                  cornerRadius={6}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      style={{ filter: `drop-shadow(0px 4px 8px ${COLORS[index % COLORS.length]}40)` }}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    hasData ? formatCurrencyDZD(value) : 'Aucune dépense',
                    name
                  ]} 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }} 
                  itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={60} 
                  iconSize={10} 
                  wrapperStyle={{ fontSize: '11px', lineHeight: '20px' }}
                  formatter={(value: string) => <span style={{color: '#94a3b8'}}>{value}</span>}
                />
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
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowForecastData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
                <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v.toString()} />
                <Tooltip
                  formatter={(value: any, name: any) => [formatCurrencyDZD(value), name]}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#f8fafc' }}
                />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                <Line
                  type="monotone"
                  dataKey="actual"
                  name="Dépenses Réelles"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#6366f1' }}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Trajectoire Prévisionnelle"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={{ r: 3, fill: '#10b981' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
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
