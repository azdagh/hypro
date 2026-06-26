import React, { createContext, useContext, useState, useEffect } from 'react';

const fr = {
  appName: 'HYPRO ERP',
  subTitle: 'Gestion de Fonds de Roulement, Petty Cash & Projets',
  home: 'Tableau de Bord',
  projects: 'Projets de Construction',
  expenses: 'Dépenses & Petty Cash',
  allocations: 'Allocations de Caisse',
  purchaseRequests: 'Demandes d\'Achat',
  purchaseOrders: 'Bons de Commande',
  contracts: 'Contrats Sous-traitance',
  inventory: 'Stocks & Équipements',
  reports: 'Rapports & Exports',
  settings: 'Paramètres',
  auditLogs: 'Journaux d\'Audit',
  language: 'Langue',
  theme: 'Thème',
  role: 'Rôle',
  logout: 'Se déconnecter',
  login: 'Se connecter',
  email: 'Adresse Email',
  fullName: 'Nom Complet',
  phone: 'Téléphone',
  actions: 'Actions',
  status: 'Statut',
  date: 'Date',
  amount: 'Montant',
  description: 'Description',
  category: 'Catégorie',
  supplier: 'Fournisseur',
  subcontractor: 'Sous-traitant',
  notes: 'Notes',
  save: 'Enregistrer',
  cancel: 'Annuler',
  submit: 'Soumettre',
  approve: 'Approuver',
  reject: 'Rejeter',
  rejectionReason: 'Motif du rejet',
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  total: 'Total',
  search: 'Rechercher...',
  add: 'Ajouter',
  edit: 'Modifier',
  delete: 'Supprimer',
  archive: 'Archiver',
  viewDetails: 'Détails',
  uploadReceipt: 'Télécharger le reçu',
  cameraScan: 'Capturer le reçu (Caméra)',
  aiScanner: 'Analyse Automatique par IA (Gemini)',
  scanning: 'Analyse en cours par l\'IA...',
  scanSuccess: 'Reçu analysé avec succès !',
  scanError: 'Échec de l\'analyse par l\'IA.',
  remaining: 'Restant',
  consumed: 'Consommé',
  budget: 'Budget',
  location: 'Localisation',
  code: 'Code Projet',
  offlineMode: 'Mode Hors Ligne',
  offlineBanner: 'Vous êtes actuellement déconnecté de l\'ERP. Les actions seront mises en attente et synchronisées automatiquement dès le retour du réseau.',
  onlineBadge: 'En ligne',
  offlineBadge: 'Hors Ligne',
  currencySymbol: 'DZD',
  totalAllocations: 'Allocations Totales',
  totalExpenses: 'Dépenses Totales',
  availableBalance: 'Solde Disponible',
  pendingRequests: 'Demandes en Attente',
  monthlySpending: 'Dépenses Mensuelles',
  cashFlowForecast: 'Prévision de Trésorerie',
  budgetUtilization: 'Utilisation du Budget',
  cashFlowExplanation: 'Modèle prédictif basé sur l\'avancement des travaux et les dépenses moyennes.',
  totalProjects: 'Nombre de Projets',
  activeProjects: 'Projets Actifs',
  completedProjects: 'Projets Complétés',
  delayedProjects: 'Projets en Retard',
  totalApartments: 'Total Appartements',
  totalFloors: 'Total Étages',
  financialHealth: 'Santé Financière du Projet',
  greenHealth: 'Sûr (0-60%)',
  orangeHealth: 'Avertissement (60-85%)',
  redHealth: 'Critique (>85%)',
  totalLandArea: 'Superficie Terrain (m²)',
  builtArea: 'Superficie Bâtie (m²)',
  numBuildings: 'Nombre de Bâtiments',
  numBlocks: 'Nombre de Blocs',
  numFloors: 'Nombre d\'Étages',
  numApartments: 'Nombre d\'Appartements',
  startDate: 'Date de Début',
  plannedEndDate: 'Fin Planifiée',
  actualEndDate: 'Fin Réelle',
  createProject: 'Créer un Projet',
  editProject: 'Modifier le Projet',
  itemName: 'Nom du Matériau',
  quantity: 'Quantité',
  unit: 'Unité',
  addStock: 'Ajouter au Stock',
  equipmentName: 'Nom de l\'Équipement',
  addEquipment: 'Ajouter un Équipement',
  underMaintenance: 'En Maintenance',
  active: 'Actif',
  inactive: 'Inactif',
  budgetExceededError: 'Opération Bloquée: Le budget du projet est dépassé !',
  duplicateProtection: 'Attention: Une transaction identique a déjà été soumise récemment.',
  reportCenter: 'Centre de Rapports Financiers',
  generateReport: 'Générer le Rapport',
  exportPDF: 'Exporter en PDF',
  exportExcel: 'Exporter en Excel',
  annualReport: 'Rapport Annuel',
  monthlyReport: 'Rapport Mensuel',
  cashFlowReport: 'Rapport de Trésorerie',
  budgetReport: 'Rapport de Budget',
  profileTitle: 'Mon Profil Professionnel',
  securityTitle: 'Sécurité & Sessions Actives',
  activeSessions: 'Sessions Actives',
  appearance: 'Apparence du Système',
  languageSelector: 'Sélecteur de Langue',
  currentSession: 'Cette session',
  device: 'Appareil',
  locationIp: 'Adresse IP / Région',
  notificationPreferences: 'Préférences de Notifications',
};

export const translations = {
  fr,
  ar: fr,
};

export const formatCurrencyDZD = (value: number): string => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value).replace('DZD', 'DZD');
};

export const formatLocalDate = (dateStr: string, language: 'fr' | 'ar'): string => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'fr' ? 'fr-DZ' : 'ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

interface LanguageContextType {
  lang: 'fr' | 'ar';
  setLang: (lang: 'fr' | 'ar') => void;
  t: (key: keyof typeof translations['fr']) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<'fr' | 'ar'>(() => {
    const saved = localStorage.getItem('hypro_lang');
    return (saved === 'fr' || saved === 'ar') ? saved : 'fr';
  });

  const setLang = (newLang: 'fr' | 'ar') => {
    setLangState(newLang);
    localStorage.setItem('hypro_lang', newLang);
  };

  const t = (key: keyof typeof translations['fr']): string => {
    const dict = translations[lang] || translations.fr;
    return dict[key] || translations.fr[key] || String(key);
  };

  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
