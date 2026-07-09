import React, { useState } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, Wallet, ArrowDownRight, AlertCircle, CheckCircle, 
  XCircle, BarChart3, PieChartIcon, Calendar, Users, Clock,
  ArrowUpRight, ShieldCheck, Activity, ChevronRight, User
} from 'lucide-react';
import { Project, Allocation, Expense, PurchaseRequest } from '../types';
import { formatCurrencyDZD, useTranslation } from '../i18n';

interface DashboardViewProps {
  projects: Project[];
  allocations: Allocation[];
  expenses: Expense[];
  purchaseRequests: PurchaseRequest[];
  userRole?: string;
  profiles?: any[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  allocations,
  expenses,
  purchaseRequests,
  userRole = '',
  profiles = []
}) => {
  const { t, lang } = useTranslation();
  const isAdmin = ['Super Admin', 'Financial Director', 'Accountant', 'Auditor'].includes(userRole);

  const [activePendingTab, setActivePendingTab] = useState<'expenses' | 'allocations'>('expenses');

  // ── Financial summary ──────────────────────────────────────────
  const totalAllocatedAmount = allocations.reduce((sum, a) => sum + a.amount_dzd, 0);
  const approvedExpenses = expenses.filter(e => e.status === 'Approved');
  const totalApprovedExpensesAmount = approvedExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);
  const rejectedExpenses = expenses.filter(e => e.status === 'Rejected');
  const totalRejectedExpensesAmount = rejectedExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);
  const pendingExpenses = expenses.filter(e => e.status === 'Pending');
  const totalPendingExpensesAmount = pendingExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);
  const availableBalance = totalAllocatedAmount - totalApprovedExpensesAmount;
  const pendingRequestsCount = purchaseRequests.filter(pr => pr.status === 'Pending').length + pendingExpenses.length;

  // ── Per-person breakdown (admin only) ─────────────────────────
  const personBreakdown = React.useMemo(() => {
    if (!isAdmin) return [];
    // Collect unique beneficiaries from allocations
    const personMap: Record<string, { name: string; allocated: number; spent: number; pending: number }> = {};
    allocations.forEach(a => {
      const id = a.allocated_to || 'unknown';
      const name = a.allocated_to_name || profiles.find(p => p.id === id)?.full_name || id;
      if (!personMap[id]) personMap[id] = { name, allocated: 0, spent: 0, pending: 0 };
      personMap[id].allocated += a.amount_dzd;
    });
    expenses.forEach(e => {
      const id = e.submitted_by || 'unknown';
      const name = (e as any).profiles?.full_name || profiles.find(p => p.id === id)?.full_name || id;
      if (!personMap[id]) personMap[id] = { name, allocated: 0, spent: 0, pending: 0 };
      if (e.status === 'Approved') personMap[id].spent += e.amount_dzd;
      if (e.status === 'Pending') personMap[id].pending += e.amount_dzd;
    });
    return Object.entries(personMap)
      .map(([id, data]) => ({ id, ...data, balance: data.allocated - data.spent }))
      .sort((a, b) => b.allocated - a.allocated);
  }, [allocations, expenses, profiles, isAdmin]);

  // ── Monthly spending data ──────────────────────────────────────
  const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const now = new Date();
  const monthlySpendingMap: Record<string, number> = {};
  approvedExpenses.forEach(e => {
    const d = new Date(e.submitted_at);
    const key = MONTH_NAMES[d.getMonth()];
    monthlySpendingMap[key] = (monthlySpendingMap[key] || 0) + e.amount_dzd;
  });
  const monthlySpendingData = Object.entries(monthlySpendingMap).map(([month, amount]) => ({ name: month, amount })).slice(-6);
  const avgMonthlySpend = monthlySpendingData.length > 0
    ? monthlySpendingData.reduce((s, d) => s + d.amount, 0) / monthlySpendingData.length : 0;

  const cashFlowForecastData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 2 + i, 1);
    const key = MONTH_NAMES[d.getMonth()];
    const hist = monthlySpendingMap[key] ?? null;
    const isHistory = i < 3;
    const actual = hist ?? (isHistory ? avgMonthlySpend * (0.7 + i * 0.1) : null);
    const projected = Math.round((avgMonthlySpend || 500) * (1.05 + i * 0.07));
    return { name: key, actual: isHistory ? Math.round(actual ?? 0) : null, forecast: projected };
  });

  // ── Project utilization data ───────────────────────────────────
  const projectUtilizationData = projects.filter(p => p.code !== 'GEN-00').map(p => {
    const projAllocations = allocations.filter(a => a.project_id === p.id).reduce((sum, a) => sum + a.amount_dzd, 0);
    const projExpenses = expenses.filter(e => e.project_id === p.id && e.status === 'Approved').reduce((sum, e) => sum + e.amount_dzd, 0);
    return { code: p.code, name: p.name, budget: p.budget, allocations: projAllocations, expenses: projExpenses, utilization: p.budget > 0 ? (projExpenses / p.budget) * 100 : 0 };
  });

  const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'];
  const projectExpensesShare = projects.filter(p => p.code !== 'GEN-00').map(p => {
    const amt = expenses.filter(e => e.project_id === p.id && e.status === 'Approved').reduce((sum, e) => sum + e.amount_dzd, 0);
    return { name: p.code || p.name, value: amt };
  }).filter(v => v.value > 0);
  const pieData = projectExpensesShare.length > 0 ? projectExpensesShare : [{ name: 'Aucune dépense', value: 1 }];
  const hasData = projectExpensesShare.length > 0;

  // ── Recent 5 pending expenses ──────────────────────────────────
  const recentPending = [...pendingExpenses]
    .sort((a, b) => b.submitted_at.localeCompare(a.submitted_at))
    .slice(0, 6);

  // ── Recent 5 allocations ───────────────────────────────────────
  const recentAllocations = [...allocations]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 6);

  return (
    <div className="space-y-6" id="dashboard-view-container">

      {/* ── KPI Cards Row ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-stats-grid">
        {/* Total Allocations */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 shadow-lg shadow-emerald-500/20 flex flex-col justify-between min-h-[130px]" id="card-total-allocations">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-emerald-100 uppercase tracking-widest">{t('totalAllocations')}</p>
            <div className="bg-white/20 p-2 rounded-lg">
              <Wallet className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white leading-tight">{formatCurrencyDZD(totalAllocatedAmount)}</h3>
            <span className="text-xs text-emerald-100 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" /> Fonds injectés
            </span>
          </div>
        </div>

        {/* Total Approved Expenses */}
        <div className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-2xl p-5 shadow-lg shadow-violet-500/20 flex flex-col justify-between min-h-[130px]" id="card-total-expenses">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-violet-100 uppercase tracking-widest">{t('totalExpenses')}</p>
            <div className="bg-white/20 p-2 rounded-lg">
              <ArrowDownRight className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white leading-tight">{formatCurrencyDZD(totalApprovedExpensesAmount)}</h3>
            <span className="text-xs text-violet-100 flex items-center gap-1 mt-1">
              <CheckCircle className="w-3 h-3" /> Dépenses validées
            </span>
          </div>
        </div>

        {/* Available Balance */}
        <div className={`rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[130px] ${availableBalance >= 0 ? 'bg-gradient-to-br from-slate-700 to-slate-800 shadow-slate-700/20' : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/20'}`} id="card-available-balance">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">{t('availableBalance')}</p>
            <div className="bg-white/10 p-2 rounded-lg">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white leading-tight">{formatCurrencyDZD(availableBalance)}</h3>
            <span className="text-xs text-slate-300 flex items-center gap-1 mt-1">
              <ShieldCheck className="w-3 h-3" /> Trésorerie nette
            </span>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl p-5 shadow-lg shadow-amber-500/20 flex flex-col justify-between min-h-[130px]" id="card-pending-requests">
          <div className="flex items-start justify-between">
            <p className="text-xs font-semibold text-amber-100 uppercase tracking-widest">{t('pendingRequests')}</p>
            <div className="bg-white/20 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold font-mono text-white leading-tight">{pendingRequestsCount}</h3>
            <span className="text-xs text-amber-100 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3" /> En attente de validation
            </span>
          </div>
        </div>
      </div>

      {/* ── Secondary Stats Row ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="sub-stats-grid">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2.5 rounded-lg">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t('approved')}</p>
            <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-100">{formatCurrencyDZD(totalApprovedExpensesAmount)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-lg">
            <XCircle className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{t('rejected')}</p>
            <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-100">{formatCurrencyDZD(totalRejectedExpensesAmount)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded-lg">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">En cours d'examen</p>
            <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-100">{formatCurrencyDZD(totalPendingExpensesAmount)}</p>
          </div>
        </div>
      </div>

      {/* ── Admin: Per-Person Breakdown ────────────────────────── */}
      {isAdmin && personBreakdown.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs" id="admin-person-breakdown">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              Suivi par Bénéficiaire
            </h3>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">{personBreakdown.length} personnes</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {personBreakdown.map(person => {
              const usageRate = person.allocated > 0 ? Math.min((person.spent / person.allocated) * 100, 100) : 0;
              const isOverspent = person.balance < 0;
              return (
                <div key={person.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{person.name}</p>
                      <p className="text-[10px] text-slate-400">Utilisation: {usageRate.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <p className="text-[10px] text-slate-400 mb-0.5">Versé</p>
                      <p className="text-xs font-bold font-mono text-emerald-600">{formatCurrencyDZD(person.allocated)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 mb-0.5">Dépensé</p>
                      <p className="text-xs font-bold font-mono text-violet-600">{formatCurrencyDZD(person.spent)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 mb-0.5">Solde</p>
                      <p className={`text-xs font-bold font-mono ${isOverspent ? 'text-rose-600' : 'text-slate-800 dark:text-slate-100'}`}>{formatCurrencyDZD(person.balance)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${usageRate > 85 ? 'bg-rose-500' : usageRate > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${usageRate}%` }}
                    />
                  </div>
                  {person.pending > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold bg-amber-50 dark:bg-amber-900/10 rounded-lg px-2 py-1">
                      <Clock className="w-3 h-3" />
                      {formatCurrencyDZD(person.pending)} en attente
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Admin: Recent Activity Feed ────────────────────────── */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pending Expenses & Allocations Tabs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs" id="admin-recent-pending">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActivePendingTab('expenses')}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors ${activePendingTab === 'expenses' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Dépenses en attente ({pendingExpenses.length})
              </button>
              <button
                onClick={() => setActivePendingTab('allocations')}
                className={`text-xs font-semibold pb-1 border-b-2 transition-colors ml-4 ${activePendingTab === 'allocations' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                Derniers versements ({recentAllocations.length})
              </button>
            </div>

            {activePendingTab === 'expenses' ? (
              <div className="space-y-2">
                {recentPending.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                    Aucune dépense en attente
                  </div>
                ) : recentPending.map(e => {
                  const submitterName = (e as any).profiles?.full_name || profiles.find(p => p.id === e.submitted_by)?.full_name || e.submitted_by_name || 'Inconnu';
                  const projName = (e as any).projects?.name || projects.find(p => p.id === e.project_id)?.name || '—';
                  return (
                    <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                      <div className="bg-amber-100 dark:bg-amber-900/30 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{submitterName}</p>
                          <span className="text-xs font-bold font-mono text-amber-700 flex-shrink-0">{formatCurrencyDZD(e.amount_dzd)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">{projName} · {e.description || 'Sans description'}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(e.submitted_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {recentAllocations.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">Aucun versement</div>
                ) : recentAllocations.map(a => {
                  const toName = a.allocated_to_name || profiles.find(p => p.id === a.allocated_to)?.full_name || a.allocated_to || 'Inconnu';
                  const fromName = a.allocated_by_name || profiles.find(p => p.id === a.allocated_by)?.full_name || '—';
                  return (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                      <div className="bg-emerald-100 dark:bg-emerald-900/30 p-1.5 rounded-lg flex-shrink-0 mt-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">→ {toName}</p>
                          <span className="text-xs font-bold font-mono text-emerald-700 flex-shrink-0">{formatCurrencyDZD(a.amount_dzd)}</span>
                        </div>
                        <p className="text-[10px] text-slate-500">Par: {fromName} · {a.notes || 'Sans notes'}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(a.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Project Health Indicators */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs" id="chart-project-health-indicators">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-500" /> {t('financialHealth')}
            </h3>
            <div className="space-y-4" id="project-health-items-list">
              {projectUtilizationData.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">Aucun chantier enregistré</div>
              ) : projectUtilizationData.map(p => {
                const barColor = p.utilization > 85 ? 'bg-rose-500' : p.utilization > 60 ? 'bg-amber-500' : 'bg-emerald-500';
                const label = p.utilization > 85 ? 'Critique' : p.utilization > 60 ? 'Attention' : 'OK';
                const labelColor = p.utilization > 85 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300' : p.utilization > 60 ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
                return (
                  <div key={p.code} className="space-y-1.5" id={`project-health-item-${p.code}`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[160px]" title={p.name}>{p.code} – {p.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ml-2 ${labelColor}`}>{label}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>{p.utilization.toFixed(1)}% utilisé</span>
                      <span>Restant: {formatCurrencyDZD(p.budget - p.expenses)}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(p.utilization, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
              Indicateurs mis à jour en temps réel.
            </p>
          </div>
        </div>
      )}

      {/* ── Charts Row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-charts-grid">
        {/* Project Budget vs Expenses bar chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col" style={{ height: '380px' }} id="chart-project-budget-utilization">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" /> Budget par Chantier
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">en DZD</span>
          </div>
          <div className="flex-1 min-h-0" id="project-utilization-bar-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectUtilizationData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="code" fontSize={11} stroke="#94a3b8" interval={0} angle={-20} textAnchor="end" height={50} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis scale="sqrt" fontSize={11} stroke="#94a3b8" width={70} tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()} />
                <Tooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} formatter={(value: any, name: string) => [formatCurrencyDZD(value), name]} labelFormatter={(label) => { const proj = projectUtilizationData.find(p => p.code === label); return proj ? proj.name : label; }} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#f8fafc', fontSize: '11px' }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="budget" name="Budget Initial" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="allocations" name="Allocations Injectées" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={60} />
                <Bar dataKey="expenses" name="Dépenses Approuvées" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie chart: expense distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col" style={{ height: '380px' }} id="chart-project-expenses-share">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
            <PieChartIcon className="w-4 h-4 text-slate-500" /> Répartition Dépenses
          </h3>
          <div className="flex-1 min-h-0 relative" id="expenses-share-pie-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <Pie data={pieData} cx="50%" cy="45%" innerRadius={65} outerRadius={95} paddingAngle={5} dataKey="value" label={false} labelLine={false} stroke="none" cornerRadius={6}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} style={{ filter: `drop-shadow(0px 4px 8px ${COLORS[index % COLORS.length]}40)` }} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: string) => [hasData ? formatCurrencyDZD(value) : 'Aucune dépense', name]} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#f8fafc', fontSize: '11px' }} itemStyle={{ color: '#e2e8f0', fontWeight: 600 }} />
                <Legend verticalAlign="bottom" height={60} iconSize={10} wrapperStyle={{ fontSize: '11px', lineHeight: '20px' }} formatter={(value: string) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Cash Flow Forecast ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col" style={{ height: '320px' }} id="chart-cashflow-forecast">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500" /> {t('cashFlowForecast')}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{t('cashFlowExplanation')}</p>
          </div>
          <Calendar className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 min-h-0" id="cash-flow-forecast-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cashFlowForecastData} margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
              <YAxis fontSize={11} stroke="#94a3b8" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toString()} />
              <Tooltip formatter={(value: any, name: any) => [formatCurrencyDZD(value), name]} contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#f8fafc' }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="actual" name="Dépenses Réelles" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} connectNulls={false} />
              <Line type="monotone" dataKey="forecast" name="Trajectoire Prévisionnelle" stroke="#10b981" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#10b981' }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
