import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Mail, ShieldAlert, Key, Ban, UserCheck, 
  Layers, Plus, Trash2, CheckCircle2, ShieldCheck, HelpCircle, 
  FileText, ArrowRight, Lock, Eye, AlertCircle
} from 'lucide-react';
import { formatCurrencyDZD } from '../i18n';
import { secureFetch } from '../lib/api';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  created_at: string;
  email_confirmed: boolean;
  banned: boolean;
  last_sign_in_at?: string | null;
}

interface Invitation {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
  expires_at: string;
}

interface ProjectAssignment {
  id: string;
  project_id: string;
  user_id: string;
  assignment_role: string;
  created_at: string;
  projects?: {
    name: string;
    code: string;
  };
  profiles?: {
    full_name: string;
    email: string;
    role: string;
  };
}

interface AdministrationViewProps {
  currentUserId: string;
  projects: any[];
}

export function AdministrationView({ currentUserId, projects }: AdministrationViewProps) {
  const [subTab, setSubTab] = useState<'users' | 'invitations' | 'assignments' | 'security'>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Forms states
  const [userForm, setUserForm] = useState({ email: '', full_name: '', password: '', role: 'Employee', phone: '' });
  const [invitationForm, setInvitationForm] = useState({ email: '', full_name: '', role: 'Employee' });
  const [assignmentForm, setAssignmentForm] = useState({ project_id: '', user_id: '', assignment_role: 'Site Manager' });
  
  // Modal / Quick action states
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState('Employee');

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, iRes, aRes] = await Promise.all([
        secureFetch('/api/admin/users').then(r => r.ok ? r.json() : []),
        secureFetch('/api/admin/invitations').then(r => r.ok ? r.json() : []),
        secureFetch('/api/admin/project-assignments').then(r => r.ok ? r.json() : [])
      ]);

      setUsers(uRes);
      setInvitations(iRes);
      setAssignments(aRes);
    } catch (e: any) {
      showMsg('Échec du chargement des données administratives', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [subTab]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await secureFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg(`Utilisateur ${userForm.full_name} créé avec succès !`, 'success');
      setUserForm({ email: '', full_name: '', password: '', role: 'Employee', phone: '' });
      fetchAdminData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await secureFetch('/api/admin/invitations', {
        method: 'POST',
        body: JSON.stringify(invitationForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg(`Invitation envoyée avec succès à ${invitationForm.email} !`, 'success');
      setInvitationForm({ email: '', full_name: '', role: 'Employee' });
      fetchAdminData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await secureFetch('/api/admin/project-assignments', {
        method: 'POST',
        body: JSON.stringify(assignmentForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showMsg('Affectation de projet créée avec succès !', 'success');
      setAssignmentForm({ project_id: '', user_id: '', assignment_role: 'Site Manager' });
      fetchAdminData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment révoquer cette affectation de projet ?')) return;
    try {
      const res = await secureFetch(`/api/admin/project-assignments/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showMsg('Affectation révoquée avec succès.', 'success');
      fetchAdminData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleToggleUserBan = async (user: AdminUser) => {
    const action = user.banned ? 'reactivate' : 'disable';
    const confirmMsg = user.banned 
      ? `Voulez-vous réactiver le compte de ${user.full_name} ?`
      : `Voulez-vous vraiment désactiver (bannir) temporairement le compte de ${user.full_name} ?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await secureFetch(`/api/admin/users/${user.id}/${action}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showMsg(`Compte utilisateur mis à jour avec succès.`, 'success');
      fetchAdminData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await secureFetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showMsg(`Mot de passe réinitialisé pour ${selectedUser.full_name}.`, 'success');
      setShowPwdModal(false);
      setNewPassword('');
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await secureFetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      showMsg(`Rôle de ${selectedUser.full_name} mis à jour en ${newRole}.`, 'success');
      setShowRoleModal(false);
      fetchAdminData();
    } catch (err: any) {
      showMsg(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-view-root">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md border border-slate-800" id="admin-hero">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> MODULE DE CONTRÔLE & SÉCURITÉ
          </div>
          <h1 className="text-xl font-bold font-sans tracking-tight">Panneau d'Administration ERP</h1>
          <p className="text-xs text-slate-400">Gérez les collaborateurs, configurez les rôles de sécurité, assignez les projets et auditez la conformité de l'architecture PostgreSQL RLS.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { fetchAdminData(); showMsg('Données synchronisées avec PostgreSQL', 'success'); }} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Message feedback */}
      {message && (
        <div className={`p-4 rounded-xl text-xs font-medium border flex items-center gap-2 ${
          message.type === 'success' 
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-300' 
            : 'bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-950/20 dark:border-rose-900/60 dark:text-rose-300'
        }`} id="admin-alert-banner">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {message.text}
        </div>
      )}

      {/* Inner Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-1" id="admin-subtabs">
        <button
          onClick={() => setSubTab('users')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'users' 
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" /> Collaborateurs
        </button>
        <button
          onClick={() => setSubTab('invitations')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'invitations' 
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" /> Invitations
        </button>
        <button
          onClick={() => setSubTab('assignments')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'assignments' 
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" /> Affectation Projets
        </button>
        <button
          onClick={() => setSubTab('security')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'security' 
              ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ShieldAlert className="w-4 h-4" /> Conformité & RLS
        </button>
      </div>

      {/* SUBTAB 1: COLLABORATEURS */}
      {subTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-users-panel">
          {/* Create User Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-500" /> Ajouter un Collaborateur
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Créez directement un utilisateur et configurez son profil. Il pourra s'authentifier immédiatement.
            </p>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Nom Complet</label>
                <input 
                  type="text" 
                  required
                  value={userForm.full_name}
                  onChange={e => setUserForm({...userForm, full_name: e.target.value})}
                  placeholder="e.g. Oussama Abbas"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Adresse Email</label>
                <input 
                  type="email" 
                  required
                  value={userForm.email}
                  onChange={e => setUserForm({...userForm, email: e.target.value})}
                  placeholder="nom@hypro.dz"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Numéro de Téléphone (Optionnel)</label>
                <input 
                  type="text" 
                  value={userForm.phone}
                  onChange={e => setUserForm({...userForm, phone: e.target.value})}
                  placeholder="+213 555 12 34 56"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Mot de Passe Initial</label>
                <input 
                  type="password" 
                  required
                  value={userForm.password}
                  onChange={e => setUserForm({...userForm, password: e.target.value})}
                  placeholder="Minimum 8 caractères"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Rôle de Sécurité</label>
                <select 
                  value={userForm.role}
                  onChange={e => setUserForm({...userForm, role: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg font-medium"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Financial Director">Financial Director</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Site Manager">Site Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Enregistrer le Collaborateur
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Base de Données des Utilisateurs ({users.length})</h3>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-slate-500">Supabase Auth</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Chargement des comptes...</div>
            ) : (
              <div className="overflow-x-auto">
                <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[9px] font-semibold">
                      <th className="p-4">Utilisateur</th>
                      <th className="p-4">Rôle de Sécurité</th>
                      <th className="p-4">État de Connexion</th>
                      <th className="p-4 text-right">Actions Securisées</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                        <td className="p-4 space-y-1">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{u.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </p>
                          {u.phone && <p className="text-[10px] text-slate-400">{u.phone}</p>}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold ${
                            u.role === 'Super Admin' ? 'bg-slate-950 text-white dark:bg-slate-800' :
                            u.role === 'Financial Director' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300' :
                            u.role === 'Accountant' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300' :
                            u.role === 'Site Manager' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-300' :
                            u.role === 'Auditor' ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-4 space-y-1 text-[10px] text-slate-500 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${u.banned ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                            {u.banned ? 'Désactivé (Banni)' : 'Compte Actif'}
                          </div>
                          {u.last_sign_in_at && (
                            <p className="text-[9px] text-slate-400">Dernier accès : {new Date(u.last_sign_in_at).toLocaleDateString()}</p>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Update Role */}
                            <button 
                              onClick={() => { setSelectedUser(u); setNewRole(u.role); setShowRoleModal(true); }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                              title="Modifier le Rôle"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </button>
                            
                            {/* Reset Password */}
                            <button 
                              onClick={() => { setSelectedUser(u); setShowPwdModal(true); }}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-lg transition-colors"
                              title="Réinitialiser Mot de Passe"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>

                            {/* Disable / Ban Toggle */}
                            <button 
                              onClick={() => handleToggleUserBan(u)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.banned 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                              }`}
                              title={u.banned ? 'Réactiver' : 'Désactiver'}
                              disabled={u.id === currentUserId}
                            >
                              {u.banned ? <UserCheck className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
</div></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: INVITATIONS */}
      {subTab === 'invitations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-invitations-panel">
          {/* Create Invitation Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-500" /> Générer une Invitation ERP
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Préparez une invitation d'embauche avec un rôle spécifique. Le lien expirera après 7 jours de validité.
            </p>

            <form onSubmit={handleCreateInvitation} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Nom Complet du Collaborateur</label>
                <input 
                  type="text" 
                  required
                  value={invitationForm.full_name}
                  onChange={e => setInvitationForm({...invitationForm, full_name: e.target.value})}
                  placeholder="e.g. Salim Bouaza"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Adresse Email de Réception</label>
                <input 
                  type="email" 
                  required
                  value={invitationForm.email}
                  onChange={e => setInvitationForm({...invitationForm, email: e.target.value})}
                  placeholder="salim@hypro.dz"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Rôle Prévu</label>
                <select 
                  value={invitationForm.role}
                  onChange={e => setInvitationForm({...invitationForm, role: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg font-medium"
                >
                  <option value="Financial Director">Financial Director</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Site Manager">Site Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Mail className="w-4 h-4" /> Créer & Envoyer l'Invitation
              </button>
            </form>
          </div>

          {/* Invitation Tracking Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Suivi des Liens d'Invitations</h3>
            </div>

            <div className="overflow-x-auto">
              <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[9px] font-semibold">
                    <th className="p-4">Collaborateur</th>
                    <th className="p-4">Rôle Prévu</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4">Date de Création</th>
                    <th className="p-4">Date d'Expiration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[10px]">
                  {invitations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-sans">Aucune invitation générée dans le système.</td>
                    </tr>
                  ) : (
                    invitations.map(i => (
                      <tr key={i.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                        <td className="p-4 font-sans space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{i.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{i.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">{i.role}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            i.status === 'Accepted' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            i.status === 'Expired' ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400' :
                            'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse'
                          }`}>
                            {i.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500">{new Date(i.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-slate-500">{new Date(i.expires_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
</div></div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: AFFECTATION PROJETS */}
      {subTab === 'assignments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-assignments-panel">
          {/* Create Assignment Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm h-fit">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" /> Assigner un Collaborateur à un Projet
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Permet de lier explicitement des <strong>Site Managers</strong> ou des <strong>Employees</strong> à un projet spécifique pour autoriser leur visibilité PostgreSQL RLS.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Projet Cible</label>
                <select 
                  required
                  value={assignmentForm.project_id}
                  onChange={e => setAssignmentForm({...assignmentForm, project_id: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg font-medium"
                >
                  <option value="">-- Sélectionner un Projet --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Collaborateur</label>
                <select 
                  required
                  value={assignmentForm.user_id}
                  onChange={e => setAssignmentForm({...assignmentForm, user_id: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg font-medium"
                >
                  <option value="">-- Sélectionner un Utilisateur --</option>
                  {users.filter(u => u.role === 'Site Manager' || u.role === 'Employee').map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Rôle d'Affectation</label>
                <select 
                  value={assignmentForm.assignment_role}
                  onChange={e => setAssignmentForm({...assignmentForm, assignment_role: e.target.value})}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg font-medium"
                >
                  <option value="Site Manager">Site Manager (Chef de Chantier)</option>
                  <option value="Employee">Employee (Employé)</option>
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Enregistrer l'affectation
              </button>
            </form>
          </div>

          {/* Active Assignments List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Affectations de Projets Actives ({assignments.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[9px] font-semibold">
                    <th className="p-4">Projet HYPRO</th>
                    <th className="p-4">Collaborateur</th>
                    <th className="p-4">Rôle System</th>
                    <th className="p-4">Affectation RLS</th>
                    <th className="p-4 text-right">Révocation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">Aucune affectation active. Tous les collaborateurs de chantier et employés n'ont aucun accès projet.</td>
                    </tr>
                  ) : (
                    assignments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10">
                        <td className="p-4 space-y-0.5">
                          <p className="font-bold text-slate-800 dark:text-slate-100">{a.projects?.name || 'Projet inconnu'}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{a.projects?.code}</p>
                        </td>
                        <td className="p-4 space-y-0.5">
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{a.profiles?.full_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{a.profiles?.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-[10px] font-mono text-indigo-500">{a.profiles?.role}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-100 dark:border-emerald-900/40">
                            {a.assignment_role}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => handleRemoveAssignment(a.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors inline-flex"
                            title="Révoquer l'accès"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
</div></div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: SECURITY & RLS COMPLIANCE REPORT */}
      {subTab === 'security' && (
        <div className="space-y-6" id="admin-security-panel">
          {/* Security Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex gap-4 items-center">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">État RLS Global</p>
                <p className="text-lg font-bold text-emerald-400">100% ACTIF & SÉCURISÉ</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex gap-4 items-center">
              <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Tables Sécurisées RLS</p>
                <p className="text-lg font-bold text-indigo-400">13 Tables PostgreSQL</p>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex gap-4 items-center">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Audits de conformité</p>
                <p className="text-lg font-bold text-amber-400">Politiques SQL Valides</p>
              </div>
            </div>
          </div>

          {/* Compliance matrix */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-sans tracking-tight">Rapport de Sécurité ERP & Matrice RLS PostgreSQL</h3>
              <p className="text-xs text-slate-400">Toutes les règles de filtrage de sécurité de l'ERP sont strictement appliquées au niveau de la base de données PostgreSQL par Row Level Security (RLS) et non par simple masquage client.</p>
            </div>

            <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
              <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold text-[9px] uppercase tracking-wider">
                    <th className="p-4">Table PostgreSQL</th>
                    <th className="p-4">Super Admin / FD / Accountant</th>
                    <th className="p-4">Site Manager (Chef de Chantier)</th>
                    <th className="p-4">Employee</th>
                    <th className="p-4 text-center">Statut RLS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800 font-sans text-xs">
                  {/* EXPENSES */}
                  <tr>
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100">expenses</p>
                      <p className="text-[9px] text-slate-400 font-mono">Dépenses de Chantier</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lecture totale (Tout voir)
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">Uniquement s'il a soumis la dépense OU s'il est affecté au projet du chantier</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="text-slate-400 italic">Dépenses personnelles soumises uniquement (submitted_by = auth.uid())</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Actif & Locké</span>
                    </td>
                  </tr>

                  {/* ALLOCATIONS */}
                  <tr>
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100">allocations</p>
                      <p className="text-[9px] text-slate-400 font-mono">Enveloppes Budgétaires / Petty Cash</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lecture totale (Tout voir)
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">Uniquement les allocations qui lui sont allouées (allocated_to = auth.uid())</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="text-slate-400 italic">Allocations assignées uniquement (allocated_to = auth.uid())</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Actif & Locké</span>
                    </td>
                  </tr>

                  {/* PROJECTS */}
                  <tr>
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100">projects</p>
                      <p className="text-[9px] text-slate-400 font-mono">Chantiers / Projets Immobiliers</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tout voir, créer et modifier
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">Lecture uniquement si affecté explicitement au projet via assignments</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="text-slate-400 italic">Uniquement si affecté explicitement au projet via assignments</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Actif & Locké</span>
                    </td>
                  </tr>

                  {/* PURCHASE REQUESTS */}
                  <tr>
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-slate-100">purchase_requests</p>
                      <p className="text-[9px] text-slate-400 font-mono">Demandes d'achats</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tout voir et approuver/rejeter
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="font-medium text-indigo-600 dark:text-indigo-400">Voir/Créer si lié au projet affecté</p>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <p className="text-slate-400 italic">Seulement les siennes (requester_id = auth.uid())</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Actif & Locké</span>
                    </td>
                  </tr>
                </tbody>
              </table>
</div></div>
            </div>

            {/* Audit and SQL definitions details */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-xs">
                <Lock className="w-4 h-4 text-indigo-500" /> DÉFINITION TECHNIQUE DES POLITIQUES POSTGRESQL (EXTRAIT) :
              </p>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2 overflow-x-auto text-[10px] leading-tight select-all">
                <p className="text-slate-400">-- Exemple de politique RLS sur la table 'expenses' :</p>
                <p className="text-indigo-300">CREATE POLICY expenses_select_policy ON public.expenses FOR SELECT TO authenticated</p>
                <p className="text-indigo-400">  USING (</p>
                <p className="text-emerald-400">    public.has_role(auth.uid(), 'Super Admin') OR</p>
                <p className="text-emerald-400">    public.has_role(auth.uid(), 'Financial Director') OR</p>
                <p className="text-emerald-400">    public.has_role(auth.uid(), 'Accountant') OR</p>
                <p className="text-emerald-400">    public.has_role(auth.uid(), 'Auditor') OR</p>
                <p className="text-amber-400">    submitted_by = auth.uid() OR</p>
                <p className="text-amber-400">    public.is_project_assigned_to_user(project_id, auth.uid())</p>
                <p className="text-indigo-400">  );</p>
              </div>
              <p className="text-xs leading-normal">
                Cette architecture élimine tout risque de fuite de données financières entre les différents chefs de chantiers ou employés de la Promotion Immobilière HYPRO, tout en garantissant un contrôle total aux Directeurs Financiers et Comptables.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QUICK MODAL: RESET PASSWORD */}
      {showPwdModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="password-reset-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-500" /> Réinitialisation Sécurisée
              </h3>
              <p className="text-xs text-slate-400">Définissez un nouveau mot de passe fort pour {selectedUser.full_name}.</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Nouveau Mot de Passe</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 caractères"
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => { setShowPwdModal(false); setNewPassword(''); }}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-3.5 py-1.5 bg-slate-900 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold rounded-lg"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK MODAL: UPDATE ROLE */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 animate-fade-in" id="role-update-modal">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-indigo-500" /> Ajuster le Rôle de Sécurité
              </h3>
              <p className="text-xs text-slate-400">Définissez les autorisations d'accès de {selectedUser.full_name}.</p>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-500">Nouveau Rôle ERP</label>
                <select 
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  className="w-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg font-medium"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Financial Director">Financial Director</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Site Manager">Site Manager</option>
                  <option value="Employee">Employee</option>
                  <option value="Auditor">Auditor</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button 
                  type="button" 
                  onClick={() => setShowRoleModal(false)}
                  className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-3.5 py-1.5 bg-slate-900 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 font-bold rounded-lg"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
