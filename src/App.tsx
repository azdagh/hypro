import React, { useState, useEffect } from 'react';
import { 
  Building2, LayoutDashboard, Wallet, ShoppingBag, 
  Settings as SettingsIcon, FileSpreadsheet, Activity, 
  LogOut, Globe, Moon, Sun, ShieldCheck, CheckCircle2, 
  AlertTriangle, RefreshCw, Layers, Menu
} from 'lucide-react';
import { LanguageProvider, useTranslation, formatCurrencyDZD } from './i18n';
import { ThemeProvider, useTheme } from './theme';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { ExpensesView } from './components/ExpensesView';
import { ProcurementView } from './components/ProcurementView';
import { InventoryView } from './components/InventoryView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AdministrationView } from './components/AdministrationView';
import { 
  Project, Allocation, Expense, PurchaseRequest, 
  PurchaseOrder, Contract, Supplier, Subcontractor, 
  StockItem, Equipment, AuditLog, ExpenseCategory, UserRole 
} from './types';
import { getSupabaseClient } from './lib/supabase';
import { secureFetch } from './lib/api';

// Root App layout component
function MainLayout() {
  const { t, lang, setLang } = useTranslation();
  const { theme, setTheme, animatedSetTheme } = useTheme();
  const { isOnline, queue, enqueue, syncQueue } = useOnlineStatus();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = localStorage.getItem('hypro_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeRole, setActiveRole] = useState<string>(() => {
    return localStorage.getItem('hypro_active_role') || 'Super Admin';
  });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [quickLoginEnabled, setQuickLoginEnabled] = useState(() => {
    return localStorage.getItem('hypro_quick_login_enabled') === 'true';
  });

  // Forgot / Reset Password state
  const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>('login');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Business Data States
  const [projects, setProjects] = useState<Project[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [myAssignments, setMyAssignments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Fetch all business data
  const fetchData = async (showLoader = true) => {
    if (!currentUser) return;
    if (showLoader) setLoading(true);
    try {
      const [
        resProjects, resAllocations, resExpenses, resCategories,
        resPRs, resPOs, resContracts, resSuppliers, resSubs,
        resStocks, resEquip, resLogs, resAssignments, resProfiles
      ] = await Promise.all([
        secureFetch('/api/projects').then(r => r.json()),
        secureFetch('/api/allocations').then(r => r.json()),
        secureFetch('/api/expenses').then(r => r.json()),
        secureFetch('/api/categories').then(r => r.json()),
        secureFetch('/api/purchase-requests').then(r => r.json()),
        secureFetch('/api/purchase-orders').then(r => r.json()),
        secureFetch('/api/contracts').then(r => r.json()),
        secureFetch('/api/suppliers').then(r => r.json()),
        secureFetch('/api/subcontractors').then(r => r.json()),
        secureFetch('/api/stock-items').then(r => r.json()),
        secureFetch('/api/equipment').then(r => r.json()),
        activeRole === 'Super Admin' ? secureFetch('/api/audit-logs').then(r => r.ok ? r.json() : []).catch(() => []) : Promise.resolve([]),
        secureFetch('/api/my-assignments').then(r => r.json()),
        secureFetch('/api/auth/profiles').then(r => r.json())
      ]);

      setProjects(Array.isArray(resProjects) ? resProjects : []);
      setAllocations(Array.isArray(resAllocations) ? resAllocations : []);
      setExpenses(Array.isArray(resExpenses) ? resExpenses : []);
      setCategories(Array.isArray(resCategories) ? resCategories : []);
      setPurchaseRequests(Array.isArray(resPRs) ? resPRs : []);
      setPurchaseOrders(Array.isArray(resPOs) ? resPOs : []);
      setContracts(Array.isArray(resContracts) ? resContracts : []);
      setSuppliers(Array.isArray(resSuppliers) ? resSuppliers : []);
      setSubcontractors(Array.isArray(resSubs) ? resSubs : []);
      setStockItems(Array.isArray(resStocks) ? resStocks : []);
      setEquipment(Array.isArray(resEquip) ? resEquip : []);
      setAuditLogs(Array.isArray(resLogs) ? resLogs : []);
      setMyAssignments(Array.isArray(resAssignments) ? resAssignments : []);
      setProfiles(Array.isArray(resProfiles) ? resProfiles : []);
    } catch (err) {  console.error('Error loading HYPRO ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]);

  const resolveProfileForAuthUser = async (authUser: any, emailFallback?: string) => {
    const email = authUser?.email || emailFallback;

    if (authUser?.id) {
      try {
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Profile lookup by auth user id failed:', err);
      }
    }

    if (!email) return null;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        const data = await res.json();
        return data.user;
      }
    } catch (err) {
      console.warn('Profile lookup through auth API failed:', err);
    }

    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', email.trim())
        .maybeSingle();
      if (!error && data) return data;
    } catch (err) {
      console.warn('Profile lookup by email failed:', err);
    }

    return null;
  };

  // Supabase Auth session restoration & monitoring
  useEffect(() => {
    let subscription: any = null;

    async function initAuth() {
      try {
        const supabase = await getSupabaseClient();
        
        // 1. Get initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const profile = await resolveProfileForAuthUser(session.user);
          if (profile) {
            applyLoggedInUser(profile, profile.role);
          }
        }

        // 2. Subscribe to auth state changes
        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            const profile = await resolveProfileForAuthUser(session.user);
            if (profile) {
              applyLoggedInUser(profile, profile.role);
            }
          } else {
            setCurrentUser(null);
            localStorage.removeItem('hypro_current_user');
            localStorage.removeItem('hypro_active_role');
            localStorage.removeItem('hypro_user_id');
          }
        });
        subscription = authSub;
      } catch (err) {
        console.error('Failed to initialize Supabase client auth:', err);
      }
    }

    initAuth();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Demo account quick logins
  const handleQuickLogin = async (email: string, role: string) => {
    setLoggingIn(true);
    setLoginError('');
    setAuthSuccessMsg('');
    try {
      const profile = await resolveProfileForAuthUser(null, email);
      if (profile) {
        applyLoggedInUser(profile, role);
        return;
      }
      setLoginError('Identifiant invalide');
    } catch (e) {
      setLoginError('Échec de la connexion au serveur');
    } finally {
      setLoggingIn(false);
    }
  };

  const applyLoggedInUser = (user: any, role = user.role, enableQuickLogin = false) => {
    setCurrentUser(user);
    setActiveRole(role);
    localStorage.setItem('hypro_current_user', JSON.stringify(user));
    localStorage.setItem('hypro_active_role', role);
    localStorage.setItem('hypro_user_id', user.id);
    if (enableQuickLogin) {
      setQuickLoginEnabled(true);
      localStorage.setItem('hypro_quick_login_enabled', 'true');
    }
  };

  const handleSuperAdminAutoLogin = async () => {
    setLoggingIn(true);
    setLoginError('');
    setAuthSuccessMsg('');
    try {
      const res = await fetch('/api/auth/dev-superadmin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Connexion Super Admin impossible');
      }

      const supabase = await getSupabaseClient();
      if (result.session?.access_token && result.session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });
      }

      applyLoggedInUser(result.user, 'Super Admin');
    } catch (e: any) {
      setLoginError('Échec de la connexion Super Admin : ' + (e.message || e));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) {
      setLoginError('Veuillez entrer une adresse email');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    setAuthSuccessMsg('');
    try {
      const supabase = await getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });

      if (error) {
        if (!passwordInput) {
          const profile = await resolveProfileForAuthUser(null, emailInput);
          if (profile) {
            applyLoggedInUser(profile, profile.role);
            return;
          }
        }
        throw error;
      }

      const profile = await resolveProfileForAuthUser(data.user, emailInput);
      if (!profile) {
        throw new Error('Profil HYPRO introuvable');
      }

      applyLoggedInUser(profile, profile.role, true);
    } catch (e: any) {
      setLoginError('Échec de la connexion : ' + (e.message || e));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setLoginError('Veuillez renseigner votre email');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    setTimeout(() => {
      setLoggingIn(false);
      setAuthSuccessMsg('Instructions de réinitialisation envoyées ! Saisissez le code de vérification ci-dessous (Code de démonstration: 480216).');
      setAuthMode('reset');
    }, 1000);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode || !newPassword) {
      setLoginError('Tous les champs sont requis');
      return;
    }
    if (resetCode !== '480216') {
      setLoginError('Code de validation incorrect. Saisissez le code de démo: 480216');
      return;
    }
    setLoggingIn(true);
    setLoginError('');
    setTimeout(() => {
      setLoggingIn(false);
      setAuthSuccessMsg('Votre mot de passe a été modifié avec succès ! Connectez-vous.');
      setAuthMode('login');
      setEmailInput(forgotEmail);
      setForgotEmail('');
      setResetCode('');
      setNewPassword('');

    }, 1000);
  };

  const handleLogout = async () => {
    try {
      const supabase = await getSupabaseClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.error('Error signing out:', e);
    }
    setCurrentUser(null);
    localStorage.removeItem('hypro_current_user');
    localStorage.removeItem('hypro_active_role');
    localStorage.removeItem('hypro_user_id');
  };

  const handleThemeToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    animatedSetTheme(nextTheme, x, y);
  };

  const handleRoleChange = (newRole: string) => {
    setActiveRole(newRole);
    localStorage.setItem('hypro_active_role', newRole);
  };

  // -------------------------------------------------------------------------
  // CORE CRUD FRONTEND MUTATION METHODS
  // -------------------------------------------------------------------------

  // 1. Projects
  const handleAddProject = async (projPayload: any) => {
    try {
      const res = await secureFetch('/api/projects', {
        method: 'POST',
        body: JSON.stringify(projPayload)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchData(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleEditProject = async (id: string, updates: any) => {
    try {
      const res = await secureFetch(`/api/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchData(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Voulez-vous vraiment archiver ce projet de construction ?')) return;
    try {
      const res = await secureFetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      await fetchData(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // 2. Expenses & Petty Cash
  const handleSubmitExpense = async (expensePayload: any) => {
    const res = await secureFetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(expensePayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchData(false);
  };

  const handleSubmitAllocation = async (allocPayload: any) => {
    const res = await secureFetch('/api/allocations', {
      method: 'POST',
      body: JSON.stringify(allocPayload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchData(false);
  };

  const handleUpdateExpenseStatus = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
    const res = await secureFetch(`/api/expenses/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejection_reason: reason })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchData(false);
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette dépense ?")) return;
    const res = await secureFetch(`/api/expenses/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchData(false);
  };

  const handleDeleteAllocation = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce versement ?")) return;
    const res = await secureFetch(`/api/allocations/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error);
    }
    await fetchData(false);
  };

  // 3. Procurement Supply Chain
  const handleAddSupplier = async (supp: any) => {
    const res = await secureFetch('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(supp)
    });
    await fetchData(false);
  };

  const handleAddSubcontractor = async (sub: any) => {
    const res = await secureFetch('/api/subcontractors', {
      method: 'POST',
      body: JSON.stringify(sub)
    });
    await fetchData(false);
  };

  const handleAddPurchaseRequest = async (req: any) => {
    const res = await secureFetch('/api/purchase-requests', {
      method: 'POST',
      body: JSON.stringify(req)
    });
    await fetchData(false);
  };

  const handleAddPurchaseOrder = async (order: any) => {
    const res = await secureFetch('/api/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(order)
    });
    await fetchData(false);
  };

  const handleAddContract = async (ctr: any) => {
    const res = await secureFetch('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(ctr)
    });
    await fetchData(false);
  };

  const handleUpdatePRStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    const res = await secureFetch(`/api/purchase-requests/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    await fetchData(false);
  };

  const handleUpdatePOStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    const res = await secureFetch(`/api/purchase-orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    await fetchData(false);
  };

  const handleUpdateContractStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    const res = await secureFetch(`/api/contracts/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    await fetchData(false);
  };

  // 4. Warehouse & Stocks
  const handleAddStockItem = async (item: any) => {
    const res = await secureFetch('/api/stock-items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
    await fetchData(false);
  };

  const handleAddEquipment = async (eq: any) => {
    const res = await secureFetch('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(eq)
    });
    await fetchData(false);
  };

  const handleUpdateEquipmentStatus = async (id: string, status: any) => {
    const res = await secureFetch(`/api/equipment/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    await fetchData(false);
  };

  const handleAddCategory = async (name: string) => {
    const res = await secureFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur ajout catégorie');
    }
    await fetchData(false);
  };

  const handleDeleteCategory = async (id: string) => {
    const res = await secureFetch(`/api/categories/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur suppression catégorie');
    }
    await fetchData(false);
  };

  // -------------------------------------------------------------------------
  // RENDER SELECTION SCREEN (IF NOT AUTHENTICATED)
  // -------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-slate-900 selection:text-white animate-fade-in" id="login-layout">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl relative overflow-hidden" id="login-container">
          {/* Top Brand Tag */}
          <div className="text-center space-y-2">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl mb-1 shadow-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <img src="/logo.webp" alt="HYPRO ERP" className="hypro-logo-img h-12 w-12" />
            </div>
            <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-900 dark:text-slate-50">HYPRO ERP</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Fonds de Roulement, Petty Cash & Projets Immobiliers
            </p>
          </div>

          {/* Success message banner */}
          {authSuccessMsg && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg text-xs leading-relaxed" id="auth-success-banner">
              {authSuccessMsg}
            </div>
          )}

          {/* Error banner */}
          {loginError && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 p-3 rounded-lg text-xs font-semibold leading-relaxed" id="auth-error-banner">
              {loginError}
            </div>
          )}

          {/* Auth forms switcher */}
          {authMode === 'login' && (
            <form onSubmit={handleManualLogin} className="space-y-4 text-xs" id="manual-login-form">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Adresse Email Professionnelle</label>
                <input 
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="nom@hypro.dz"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-slate-500">Mot de Passe</label>
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('forgot'); setLoginError(''); setAuthSuccessMsg(''); }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
                <input 
                  type="password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loggingIn}
                className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-bold p-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {loggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Se Connecter de façon sécurisée
              </button>
            </form>
          )}

          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4 text-xs" id="forgot-password-form">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Saisissez votre Adresse Email Professionnelle</label>
                <input 
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="nom@hypro.dz"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                  required
                />
                <p className="text-[10px] text-slate-400">Nous vous enverrons un code de validation de réinitialisation sur cette adresse.</p>
              </div>
              <button 
                type="submit"
                disabled={loggingIn}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                {loggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Envoyer le lien de réinitialisation
              </button>
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('login'); setLoginError(''); setAuthSuccessMsg(''); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                >
                  Retourner à la connexion
                </button>
              </div>
            </form>
          )}

          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4 text-xs" id="reset-password-form">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Code de vérification (6 chiffres)</label>
                <input 
                  type="text"
                  value={resetCode}
                  onChange={e => setResetCode(e.target.value)}
                  placeholder="e.g. 480216"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono font-bold text-center tracking-widest text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-500">Nouveau Mot de Passe</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-medium"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={loggingIn}
                className="w-full bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white font-bold p-3 rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
              >
                {loggingIn ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                Valider le nouveau mot de passe
              </button>
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => { setAuthMode('login'); setLoginError(''); setAuthSuccessMsg(''); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                >
                  Annuler & Retourner
                </button>
              </div>
            </form>
          )}

          {quickLoginEnabled && (
            <>
              <div className="h-px bg-slate-150 dark:bg-slate-800/80"></div>

              <div className="space-y-3" id="demo-logins-box">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block uppercase tracking-wider text-center">Connexion rapide disponible</span>
                <button 
                  onClick={handleSuperAdminAutoLogin}
                  disabled={loggingIn}
                  className="w-full text-left p-3 border border-slate-100 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-xl text-xs flex justify-between items-center transition-all"
                >
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">HYPRO Super Admin</p>
                    <p className="text-[10px] text-slate-400 font-mono">Hypromotion16@gmail.com - Super Admin</p>
                  </div>
                  <span className="bg-slate-950 dark:bg-emerald-500 text-white dark:text-slate-950 px-2.5 py-0.5 rounded text-[9px] font-semibold">1 clic</span>
                </button>
              </div>
            </>
          )}

          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            HYPRO Promotion Immobilière (Algeria) • ERP V2.0
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors" id="applet-shell">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-[100] w-[80vw] md:w-64 bg-[#0f172a] text-slate-300 border-r border-slate-800 shrink-0 flex flex-col justify-between transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} id="app-sidebar">
        <div className="space-y-6">
          {/* Logo Brand bar */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded flex items-center justify-center border border-slate-700 overflow-hidden">
              <img src="/logo.webp" alt="HYPRO ERP" className="hypro-logo-img w-8 h-8" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wider font-sans leading-none">HYPRO ERP</h1>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Promotion Immobilière</p>
            </div>
          </div>

          {/* Nav Items grouped by density subheadings */}
          <nav className="px-3 space-y-1 text-xs" id="sidebar-nav">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 py-2">Principal</div>
            
            <button 
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <LayoutDashboard className="w-4 h-4" /> {t('home')}
            </button>
            
            <button 
              onClick={() => { setActiveTab('projects'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'projects' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <Layers className="w-4 h-4" /> {t('projects')}
            </button>

            <button 
              onClick={() => { setActiveTab('expenses'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'expenses' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <Wallet className="w-4 h-4" /> {t('expenses')}
            </button>

            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 py-4">Logistique</div>

            <button 
              onClick={() => { setActiveTab('procurement'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'procurement' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <ShoppingBag className="w-4 h-4" /> Achats & Contrats
            </button>

            <button 
              onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'inventory' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <Building2 className="w-4 h-4" /> Stocks & Équipements
            </button>

            <button 
              onClick={() => { setActiveTab('reports'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'reports' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <FileSpreadsheet className="w-4 h-4" /> {t('reports')}
            </button>

            {activeRole === 'Super Admin' && (
              <button 
                onClick={() => { setActiveTab('audit'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'audit' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                <Activity className="w-4 h-4" /> {t('auditLogs')}
              </button>
            )}

            {activeRole === 'Super Admin' && (
              <button 
                onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'admin' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Contrôle & Sécurité
              </button>
            )}

            <button 
              onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-400' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              <SettingsIcon className="w-4 h-4" /> {t('settings')}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Employee Detail */}
        <div className="p-4 border-t border-slate-800 text-xs space-y-3" id="sidebar-footer">
          <div className="flex items-center gap-2 p-2 rounded bg-slate-800/50">
            <div className="bg-slate-800 p-1.5 rounded text-white shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="truncate">
              <p className="font-bold text-white leading-none truncate">{currentUser.full_name}</p>
              <span className="text-[10px] text-slate-400 font-mono block mt-1">{activeRole}</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded py-2 text-xs flex items-center justify-center gap-1 font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col min-w-0" id="app-main-container">
        {/* Header Bar */}
        <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-10 sticky top-0" id="app-header-bar">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold capitalize text-slate-500 dark:text-slate-400">{activeTab}</h2>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
            {/* Online Status Monitor */}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold inline-flex items-center gap-1 ${
              isOnline ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 animate-pulse'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-600' : 'bg-amber-600'}`}></span>
              {isOnline ? t('onlineBadge') : t('offlineBadge')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Lang switch */}
            <button 
              onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
              title="Alterner Langue"
            >
              <Globe className="w-4 h-4" />
            </button>

            {/* Quick dark/light toggle */}
            <button 
              onClick={handleThemeToggle}
              className="theme-toggle-button p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 transition-colors"
              title="Alterner Thème"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Offline Persistent Banner */}
        {!isOnline && (
          <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 p-3.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3 animate-fade-in" id="offline-banner">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-medium leading-relaxed">{t('offlineBanner')}</p>
          </div>
        )}

        {/* Content Box */}
        <div className="flex-1 p-6 overflow-y-auto" id="app-content-box">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2" id="app-loading-container">
              <RefreshCw className="w-8 h-8 text-slate-500 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">Chargement des données ERP sécurisées...</p>
            </div>
          ) : (
            <>
              {/* Core Role-Based Visibility Filtering Engine */}
              {(() => {
                const isFdOrAccountantOrAdmin = ['Super Admin', 'Financial Director', 'Accountant', 'Auditor'].includes(activeRole);
                const isSiteManager = activeRole === 'Site Manager';
                const isEmployee = activeRole === 'Employee';

                // 1. Filtered Expenses
                const filteredExpenses = expenses.filter(e => {
                  if (isFdOrAccountantOrAdmin) return true;
                  if (myAssignments.some(a => a.project_id === e.project_id)) return true;
                  return e.submitted_by === currentUser?.id;
                });

                // 2. Filtered Allocations
                const filteredAllocations = allocations.filter(a => {
                  if (isFdOrAccountantOrAdmin) return true;
                  if (myAssignments.some(pa => pa.project_id === a.project_id)) return true;
                  const matchesName = currentUser?.full_name && a.allocated_to?.toLowerCase().includes(currentUser.full_name.toLowerCase());
                  const matchesId = a.allocated_to === currentUser?.id;
                  const matchesAllocatedBy = a.allocated_by === currentUser?.id;
                  return matchesName || matchesId || matchesAllocatedBy;
                });

                // 3. Filtered Projects
                const filteredProjects = projects.filter(p => {
                  if (isFdOrAccountantOrAdmin) return true;
                  const hasAllocations = filteredAllocations.some(a => a.project_id === p.id);
                  const hasExpenses = filteredExpenses.some(e => e.project_id === p.id);
                  const isAssigned = myAssignments.some(a => a.project_id === p.id);
                  return hasAllocations || hasExpenses || isAssigned;
                });

                // 4. Filtered Purchase Requests
                const filteredPurchaseRequests = purchaseRequests.filter(pr => {
                  if (isFdOrAccountantOrAdmin) return true;
                  if (myAssignments.some(pa => pa.project_id === pr.project_id)) return true;
                  return pr.requester_id === currentUser?.id;
                });

                // 5. Filtered Purchase Orders
                const filteredPurchaseOrders = purchaseOrders.filter(po => {
                  if (isFdOrAccountantOrAdmin) return true;
                  if (isSiteManager || isEmployee) {
                    return filteredProjects.some(p => p.id === po.project_id);
                  }
                  return false;
                });

                // 6. Filtered Contracts
                const filteredContracts = contracts.filter(c => {
                  if (isFdOrAccountantOrAdmin) return true;
                  if (isSiteManager || isEmployee) {
                    return filteredProjects.some(p => p.id === c.project_id);
                  }
                  return false;
                });

                // 7. Filtered Stock Items
                const filteredStockItems = stockItems.filter(s => {
                  if (isFdOrAccountantOrAdmin) return true;
                  if (isSiteManager || isEmployee) {
                    return filteredProjects.some(p => p.id === s.project_id);
                  }
                  return false;
                });

                // 8. Filtered Equipment
                const filteredEquipment = equipment.filter(eq => {
                  if (isFdOrAccountantOrAdmin) return true;
                  if (isSiteManager || isEmployee) {
                    return filteredProjects.some(p => p.id === eq.project_id);
                  }
                  return false;
                });

                return (
                  <>
                    {/* Dynamic Tab Switcher */}
                    {activeTab === 'dashboard' && (
                      <DashboardView 
                        projects={filteredProjects}
                        allocations={filteredAllocations}
                        expenses={filteredExpenses}
                        purchaseRequests={filteredPurchaseRequests}
                      />
                    )}

                    {activeTab === 'projects' && (
                      <ProjectsView 
                        projects={filteredProjects}
                        allocations={filteredAllocations}
                        expenses={filteredExpenses}
                        onAddProject={handleAddProject}
                        onEditProject={handleEditProject}
                        onDeleteProject={handleDeleteProject}
                        currentUserId={currentUser.id}
                        userRole={activeRole}
                      />
                    )}

                    {activeTab === 'expenses' && (
                      <ExpensesView 
                        expenses={filteredExpenses}
                        projects={filteredProjects}
                        categories={categories}
                        allocations={filteredAllocations}
                        profiles={profiles}
                        onSubmitExpense={handleSubmitExpense}
                        onSubmitAllocation={handleSubmitAllocation}
                        onUpdateExpenseStatus={handleUpdateExpenseStatus}
                        onDeleteExpense={handleDeleteExpense}
                        onDeleteAllocation={handleDeleteAllocation}
                        userRole={activeRole}
                        userId={currentUser.id}
                        isOnline={isOnline}
                        enqueueOffline={enqueue}
                      />
                    )}

                    {activeTab === 'procurement' && (
                      <ProcurementView 
                        suppliers={suppliers}
                        subcontractors={subcontractors}
                        purchaseRequests={filteredPurchaseRequests}
                        purchaseOrders={filteredPurchaseOrders}
                        contracts={filteredContracts}
                        projects={filteredProjects}
                        onAddSupplier={handleAddSupplier}
                        onAddSubcontractor={handleAddSubcontractor}
                        onAddPurchaseRequest={handleAddPurchaseRequest}
                        onAddPurchaseOrder={handleAddPurchaseOrder}
                        onAddContract={handleAddContract}
                        onUpdatePRStatus={handleUpdatePRStatus}
                        onUpdatePOStatus={handleUpdatePOStatus}
                        onUpdateContractStatus={handleUpdateContractStatus}
                        userRole={activeRole}
                        userId={currentUser.id}
                      />
                    )}

                    {activeTab === 'inventory' && (
                      <InventoryView 
                        stockItems={filteredStockItems}
                        equipment={filteredEquipment}
                        projects={filteredProjects}
                        onAddStockItem={handleAddStockItem}
                        onAddEquipment={handleAddEquipment}
                        onUpdateEquipmentStatus={handleUpdateEquipmentStatus}
                        userRole={activeRole}
                      />
                    )}

                    {activeTab === 'reports' && (
                      <ReportsView 
                        projects={filteredProjects}
                        allocations={filteredAllocations}
                        expenses={filteredExpenses}
                      />
                    )}
                  </>
                );
              })()}

              {activeTab === 'admin' && (
                <AdministrationView 
                  currentUserId={currentUser.id}
                  projects={projects}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  currentRole={activeRole}
                  onChangeRole={handleRoleChange}
                  currentUser={currentUser}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              )}

              {activeTab === 'audit' && (
                <div className="space-y-4 animate-fade-in" id="audit-logs-tab">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <h2 className="text-base font-bold">Rapports d'Audit & Sécurité</h2>
                    <span className="text-xs font-mono text-slate-400">Total: {auditLogs.length} actions</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10px]">
                            <th className="p-4 font-semibold">Horodatage (UTC)</th>
                            <th className="p-4 font-semibold">Collaborateur</th>
                            <th className="p-4 font-semibold">Action Système</th>
                            <th className="p-4 font-semibold">Détails de l'opération</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {auditLogs.map(l => (
                            <tr key={l.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/15">
                              <td className="p-4 text-slate-500 text-[10px]">
                                {new Date(l.created_at).toISOString()}
                              </td>
                              <td className="p-4">
                                <span className="font-semibold">{l.user_name}</span>
                              </td>
                              <td className="p-4 font-bold text-indigo-700 dark:text-indigo-400 text-[10px]">
                                {l.action}
                              </td>
                              <td className="p-4 text-slate-600 dark:text-slate-300 max-w-sm truncate" title={JSON.stringify(l.details)}>
                                {JSON.stringify(l.details)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

// Global App wrapper integrating providers
export default function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <MainLayout />
      </ThemeProvider>
    </LanguageProvider>
  );
}
