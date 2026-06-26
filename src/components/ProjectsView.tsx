import React, { useState } from 'react';
import { 
  Plus, Edit, Eye, Trash2, Calendar, MapPin, Building, 
  Layers, ChevronLeft, Wallet, CheckSquare, Info 
} from 'lucide-react';
import { Project, Allocation, Expense } from '../types';
import { formatCurrencyDZD, formatLocalDate, useTranslation } from '../i18n';

interface ProjectsViewProps {
  projects: Project[];
  allocations: Allocation[];
  expenses: Expense[];
  onAddProject: (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => void;
  onEditProject: (id: string, updates: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
  currentUserId: string;
  userRole: string;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  allocations,
  expenses,
  onAddProject,
  onEditProject,
  onDeleteProject,
  currentUserId,
  userRole
}) => {
  const { t, lang } = useTranslation();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [totalLandArea, setTotalLandArea] = useState(0);
  const [builtArea, setBuiltArea] = useState(0);
  const [numberofBuildings, setNumberofBuildings] = useState(1);
  const [numberofBlocks, setNumberofBlocks] = useState(1);
  const [numberofFloors, setNumberofFloors] = useState(1);
  const [numberofApartments, setNumberofApartments] = useState(0);
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [plannedEndDate, setPlannedEndDate] = useState('');
  const [status, setStatus] = useState<Project['status']>('Planning');

  const canManage = ['Super Admin', 'Financial Director'].includes(userRole);

  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setLocation('');
    setTotalLandArea(0);
    setBuiltArea(0);
    setNumberofBuildings(1);
    setNumberofBlocks(1);
    setNumberofFloors(1);
    setNumberofApartments(0);
    setBudget(0);
    setStartDate('');
    setPlannedEndDate('');
    setStatus('Planning');
    setEditingProject(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setEditingProject(p);
    setCode(p.code);
    setName(p.name);
    setDescription(p.description || '');
    setLocation(p.location);
    setTotalLandArea(p.total_land_area);
    setBuiltArea(p.built_area);
    setNumberofBuildings(p.number_of_buildings);
    setNumberofBlocks(p.number_of_blocks);
    setNumberofFloors(p.number_of_floors);
    setNumberofApartments(p.number_of_apartments);
    setBudget(p.budget);
    setStartDate(p.start_date);
    setPlannedEndDate(p.planned_end_date);
    setStatus(p.status);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      code,
      name,
      description,
      location,
      total_land_area: Number(totalLandArea),
      built_area: Number(builtArea),
      number_of_buildings: Number(numberofBuildings),
      number_of_blocks: Number(numberofBlocks),
      number_of_floors: Number(numberofFloors),
      number_of_apartments: Number(numberofApartments),
      budget: Number(budget),
      start_date: startDate,
      planned_end_date: plannedEndDate,
      status
    };

    if (editingProject) {
      onEditProject(editingProject.id, payload);
    } else {
      onAddProject(payload);
    }
    setIsFormOpen(false);
    resetForm();
  };

  // If a project is selected for Details Page
  if (selectedProjectId) {
    const p = projects.find(proj => proj.id === selectedProjectId);
    if (!p) {
      setSelectedProjectId(null);
      return null;
    }

    // Filter allocations and expenses for this project
    const projAllocations = allocations.filter(a => a.project_id === p.id);
    const totalAllocated = projAllocations.reduce((sum, a) => sum + a.amount_dzd, 0);

    const projExpenses = expenses.filter(e => e.project_id === p.id && e.status === 'Approved');
    const totalExpApproved = projExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);

    const remainingBudget = p.budget - totalExpApproved;
    const utilization = p.budget > 0 ? (totalExpApproved / p.budget) * 100 : 0;

    let healthColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
    let healthLabel = t('greenHealth');
    if (utilization > 85) {
      healthColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/20';
      healthLabel = t('redHealth');
    } else if (utilization > 60) {
      healthColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
      healthLabel = t('orangeHealth');
    }

    return (
      <div className="space-y-6" id="project-details-page">
        <button 
          onClick={() => setSelectedProjectId(null)}
          className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium transition-colors"
          id="btn-back-to-projects"
        >
          <ChevronLeft className="w-4 h-4" /> Retour aux Projets
        </button>

        {/* Hero Section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4" id="project-hero-panel">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-semibold">{p.code}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${healthColor}`}>{healthLabel}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{p.name}</h2>
            <p className="text-sm text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {p.location}
            </p>
          </div>
          <div className="flex gap-2">
            {canManage && (
              <button 
                onClick={() => handleOpenEdit(p)}
                className="inline-flex items-center justify-center border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
                id={`btn-edit-details-${p.code}`}
              >
                <Edit className="w-3.5 h-3.5 mr-1" /> {t('edit')}
              </button>
            )}
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="project-details-metrics-grid">
          {/* Financial Progress */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="project-financial-progress-card">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">État Budgétaire</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Budget Global:</span>
                <span className="font-mono font-bold">{formatCurrencyDZD(p.budget)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total Allocations:</span>
                <span className="font-mono text-amber-600 font-semibold">{formatCurrencyDZD(totalAllocated)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Dépenses Approuvées:</span>
                <span className="font-mono text-emerald-600 font-semibold">{formatCurrencyDZD(totalExpApproved)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Solde Disponible:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-50">{formatCurrencyDZD(totalAllocated - totalExpApproved)}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Budget Consommé: {utilization.toFixed(1)}%</span>
                <span>Restant: {formatCurrencyDZD(remainingBudget)}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${utilization > 85 ? 'bg-rose-500' : utilization > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Construction Specifications */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="project-specs-card">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Données Techniques</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg space-y-1">
                <span className="text-slate-400 text-[10px]">Superficie Terrain</span>
                <p className="font-bold font-mono">{p.total_land_area} m²</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg space-y-1">
                <span className="text-slate-400 text-[10px]">Superficie Bâtie</span>
                <p className="font-bold font-mono">{p.built_area} m²</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg space-y-1 flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 text-[10px]">Bâtiments / Blocs</span>
                  <p className="font-bold font-mono">{p.number_of_buildings} / {p.number_of_blocks}</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg space-y-1 flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 text-[10px]">Étages / Appartements</span>
                  <p className="font-bold font-mono">{p.number_of_floors} / {p.number_of_apartments}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="project-timeline-card">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut & Échéancier</h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 text-[10px] block">Date de Lancement</span>
                  <span className="font-medium">{formatLocalDate(p.start_date, lang)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-slate-400 text-[10px] block">Fin Prévisionnelle</span>
                  <span className="font-medium text-amber-700 dark:text-amber-500">{formatLocalDate(p.planned_end_date, lang)}</span>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Statut Actuel:</span>
                <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[11px] font-semibold">{p.status}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description panel */}
        {p.description && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-2" id="project-desc-panel">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Description du Projet
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{p.description}</p>
          </div>
        )}

        {/* Project History Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="project-history-lists">
          {/* Allocations made to this project */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="proj-allocations-table">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-slate-500" /> Versements de caisse récents
            </h3>
            <div className="overflow-x-auto">
              <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-2">Date</th>
                    <th className="py-2">Bénéficiaire</th>
                    <th className="py-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projAllocations.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 text-slate-500">{new Date(a.created_at).toLocaleDateString()}</td>
                      <td className="py-2 font-medium">{a.allocated_to}</td>
                      <td className="py-2 text-right font-mono font-bold">{formatCurrencyDZD(a.amount_dzd)}</td>
                    </tr>
                  ))}
                  {projAllocations.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">Aucune allocation enregistrée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
</div>
            </div>
          </div>

          {/* Expenses made to this project */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-xs" id="proj-expenses-table">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-slate-500" /> Dépenses de chantier payées
            </h3>
            <div className="overflow-x-auto">
              <div className="overflow-x-auto w-full">
<table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                    <th className="py-2">Date</th>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {projExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 text-slate-500">{new Date(e.submitted_at).toLocaleDateString()}</td>
                      <td className="py-2 font-medium truncate max-w-[180px]">{e.description}</td>
                      <td className="py-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrencyDZD(e.amount_dzd)}</td>
                    </tr>
                  ))}
                  {projExpenses.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">Aucune dépense approuvée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="projects-list-page">
      {/* Upper header controls */}
      <div className="flex items-center justify-between" id="projects-list-controls">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{t('projects')} ({projects.length})</h2>
        {canManage && (
          <button 
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-xs"
            id="btn-add-new-project"
          >
            <Plus className="w-4 h-4 mr-1.5" /> {t('createProject')}
          </button>
        )}
      </div>

      {/* Grid of Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projects-grid">
        {projects.map(p => {
          const projExpenses = expenses.filter(e => e.project_id === p.id && e.status === 'Approved');
          const totalSpent = projExpenses.reduce((sum, e) => sum + e.amount_dzd, 0);
          const ratio = p.budget > 0 ? (totalSpent / p.budget) * 100 : 0;

          let cardBorder = 'border-slate-200 dark:border-slate-800';
          let healthText = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
          let healthLabel = t('greenHealth');

          if (ratio > 85) {
            cardBorder = 'border-rose-300 dark:border-rose-950';
            healthText = 'text-rose-600 bg-rose-50 dark:bg-rose-950/20';
            healthLabel = t('redHealth');
          } else if (ratio > 60) {
            cardBorder = 'border-amber-300 dark:border-amber-950';
            healthText = 'text-amber-600 bg-amber-50 dark:bg-amber-950/20';
            healthLabel = t('orangeHealth');
          }

          return (
            <div 
              key={p.id} 
              className={`bg-white dark:bg-slate-900 border ${cardBorder} rounded-xl shadow-xs overflow-hidden flex flex-col justify-between transition-shadow hover:shadow-md`}
              id={`project-card-${p.code}`}
            >
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-semibold">{p.code}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-500">{p.status}</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {p.location}
                  </p>
                </div>

                {/* Micro Tech description */}
                <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-slate-50 dark:border-slate-800 text-[10px]">
                  <div>
                    <span className="text-slate-400 block uppercase">Bâtiments</span>
                    <span className="font-semibold">{p.number_of_buildings}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Étages</span>
                    <span className="font-semibold">R+{p.number_of_floors}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase">Appartements</span>
                    <span className="font-semibold">{p.number_of_apartments || 'N/A'}</span>
                  </div>
                </div>

                {/* Budget metrics */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Budget Global:</span>
                    <span className="font-mono font-bold">{formatCurrencyDZD(p.budget)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Décaissements:</span>
                    <span className="font-mono font-semibold">{formatCurrencyDZD(totalSpent)}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Marge d'utilisation</span>
                    <span>{ratio.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${ratio > 85 ? 'bg-rose-500' : ratio > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="bg-slate-50/50 dark:bg-slate-800/30 px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${healthText}`}>{healthLabel}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedProjectId(p.id)}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
                    title={t('viewDetails')}
                    id={`btn-view-${p.code}`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canManage && (
                    <>
                      <button 
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 transition-colors"
                        title={t('edit')}
                        id={`btn-edit-${p.code}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDeleteProject(p.id)}
                        className="p-1.5 border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded text-rose-600 transition-colors"
                        title={t('delete')}
                        id={`btn-delete-${p.code}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Project Form Drawer/Modal Dialog overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="project-form-overlay">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl p-6 space-y-6" id="project-form-container">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                {editingProject ? t('editProject') : t('createProject')}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-semibold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">{t('code')} *</label>
                  <input 
                    type="text" 
                    value={code} 
                    onChange={e => setCode(e.target.value)} 
                    placeholder="e.g. HY-AL-04" 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">Nom du Projet *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Nom officiel" 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-500">{t('description')}</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={2}
                  placeholder="Notes et détails du chantier..." 
                  className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">{t('location')} *</label>
                  <input 
                    type="text" 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    placeholder="e.g. Chéraga, Alger" 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">{t('budget')} (DZD) *</label>
                  <input 
                    type="number" 
                    value={budget} 
                    onChange={e => setBudget(Number(e.target.value))} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5 font-mono font-semibold" 
                    required 
                  />
                </div>
              </div>

              {/* Technical indicators inside bento fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px] block">{t('totalLandArea')}</label>
                  <input 
                    type="number" 
                    value={totalLandArea} 
                    onChange={e => setTotalLandArea(Number(e.target.value))} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1.5 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px] block">{t('builtArea')}</label>
                  <input 
                    type="number" 
                    value={builtArea} 
                    onChange={e => setBuiltArea(Number(e.target.value))} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1.5 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px] block">Bâtiments</label>
                  <input 
                    type="number" 
                    value={numberofBuildings} 
                    onChange={e => setNumberofBuildings(Number(e.target.value))} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1.5 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px] block">Blocs</label>
                  <input 
                    type="number" 
                    value={numberofBlocks} 
                    onChange={e => setNumberofBlocks(Number(e.target.value))} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1.5 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px] block">Étages (R+x)</label>
                  <input 
                    type="number" 
                    value={numberofFloors} 
                    onChange={e => setNumberofFloors(Number(e.target.value))} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1.5 font-mono" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500 text-[10px] block">Appartements</label>
                  <input 
                    type="number" 
                    value={numberofApartments} 
                    onChange={e => setNumberofApartments(Number(e.target.value))} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1.5 font-mono" 
                  />
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="font-semibold text-slate-500 text-[10px] block">Statut de Chantier</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-1.5"
                  >
                    <option value="Planning">En Planification</option>
                    <option value="Active">Actif / En cours</option>
                    <option value="Completed">Terminé</option>
                    <option value="Delayed">Retardé</option>
                    <option value="Archived">Archivé</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">{t('startDate')} *</label>
                  <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-500">{t('plannedEndDate')} *</label>
                  <input 
                    type="date" 
                    value={plannedEndDate} 
                    onChange={e => setPlannedEndDate(e.target.value)} 
                    className="w-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg p-2.5" 
                    required 
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-50 text-slate-50 dark:text-slate-900 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors font-semibold"
                >
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
