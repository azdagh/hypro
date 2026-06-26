import fs from 'fs';
import path from 'path';
import { 
  Profile, UserPreference, Project, Allocation, ExpenseCategory, Expense, 
  Supplier, Subcontractor, PurchaseRequest, PurchaseOrder, Contract, Stock, 
  Equipment, Notification, AuditLog 
} from '../src/types';

const DB_FILE = path.join(process.cwd(), 'data', 'database.json');

// Ensure database folder exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
}

interface DatabaseSchema {
  profiles: Profile[];
  user_preferences: UserPreference[];
  projects: Project[];
  allocations: Allocation[];
  expense_categories: ExpenseCategory[];
  expenses: Expense[];
  suppliers: Supplier[];
  subcontractors: Subcontractor[];
  purchase_requests: PurchaseRequest[];
  purchase_orders: PurchaseOrder[];
  contracts: Contract[];
  stocks: Stock[];
  equipment: Equipment[];
  notifications: Notification[];
  audit_logs: AuditLog[];
}

const DEFAULT_DB: DatabaseSchema = {
  profiles: [
    {
      id: 'usr-admin',
      email: 'admin@hypro.dz',
      full_name: 'Oussama Abbas Bammoune',
      phone: '+213 555 12 34 56',
      role: 'Super Admin',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'usr-director',
      email: 'director@hypro.dz',
      full_name: 'Karim Ait Larbi',
      phone: '+213 561 22 33 44',
      role: 'Financial Director',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'usr-accountant',
      email: 'accountant@hypro.dz',
      full_name: 'Zohra Belkacemi',
      phone: '+213 550 44 55 66',
      role: 'Accountant',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'usr-manager',
      email: 'sitemanager@hypro.dz',
      full_name: 'Sofiane Boumediene',
      phone: '+213 552 99 88 77',
      role: 'Site Manager',
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&fit=crop',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'usr-employee',
      email: 'employee@hypro.dz',
      full_name: 'Yacine Meziane',
      phone: '+213 554 11 22 33',
      role: 'Employee',
      avatar_url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&fit=crop',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'usr-auditor',
      email: 'auditor@hypro.dz',
      full_name: 'Amine Benhabyles',
      phone: '+213 553 77 88 99',
      role: 'Auditor',
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&fit=crop',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  user_preferences: [
    {
      id: 'pref-admin',
      user_id: 'usr-admin',
      language: 'fr',
      theme: 'dark',
      notification_settings: { email: true, push: true, realtime: true },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  projects: [
    {
      id: 'proj-1',
      code: 'HY-ORAN-01',
      name: 'Résidence El Yasmines (Oran)',
      description: 'Projet de construction de 3 tours résidentielles de standing de R+10 avec locaux commerciaux au RDC à Oran Est.',
      location: 'Sidi Chami, Oran',
      total_land_area: 4500.00,
      built_area: 12000.00,
      number_of_buildings: 3,
      number_of_blocks: 6,
      number_of_floors: 10,
      number_of_apartments: 120,
      budget: 250000000.00, // 250M DZD
      start_date: '2025-01-10',
      planned_end_date: '2026-12-20',
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'proj-2',
      code: 'HY-CHER-02',
      name: 'Les Jardins de Chéraga (Alger)',
      description: 'Complexe résidentiel comprenant 4 bâtiments à haute performance énergétique, piscine collective et espaces verts.',
      location: 'Chéraga, Alger',
      total_land_area: 7200.00,
      built_area: 22000.00,
      number_of_buildings: 4,
      number_of_blocks: 8,
      number_of_floors: 12,
      number_of_apartments: 180,
      budget: 480000000.00, // 480M DZD
      start_date: '2025-04-15',
      planned_end_date: '2027-06-30',
      status: 'Active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'proj-3',
      code: 'HY-BEZ-03',
      name: 'Tour d\'Affaires Bab Ezzouar',
      description: 'Immeuble de bureaux de grande hauteur (R+18) destiné aux sièges d\'entreprises multinationales, labellisé HQE.',
      location: 'Bab Ezzouar, Alger',
      total_land_area: 9000.00,
      built_area: 35000.00,
      number_of_buildings: 2,
      number_of_blocks: 4,
      number_of_floors: 18,
      number_of_apartments: 0,
      budget: 850000000.00, // 850M DZD
      start_date: '2026-03-01',
      planned_end_date: '2028-10-31',
      status: 'Planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  allocations: [
    {
      id: 'alloc-1',
      project_id: 'proj-1',
      amount_dzd: 150000000.00, // 150M DZD
      allocated_by: 'usr-director',
      allocated_to: 'Sofiane Boumediene (Site Manager)',
      notes: 'Premier versement des fonds de roulement pour le terrassement et l\'installation de chantier.',
      receipt_file_id: 'gdrive-alloc1',
      receipt_url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&fit=crop',
      created_at: '2025-01-12T09:30:00.000Z'
    },
    {
      id: 'alloc-2',
      project_id: 'proj-2',
      amount_dzd: 200000000.00, // 200M DZD
      allocated_by: 'usr-director',
      allocated_to: 'Sofiane Boumediene (Site Manager)',
      notes: 'Allocation initiale pour l\'acquisition de structures préfabriquées et fondations.',
      receipt_file_id: 'gdrive-alloc2',
      receipt_url: 'https://images.unsplash.com/photo-1543185377-b75371a29437?w=500&fit=crop',
      created_at: '2025-04-18T14:15:00.000Z'
    },
    {
      id: 'alloc-3',
      project_id: 'proj-1',
      amount_dzd: 45000000.00, // 45M DZD
      allocated_by: 'usr-director',
      allocated_to: 'Sofiane Boumediene (Site Manager)',
      notes: 'Versement complémentaire pour l\'achat de ciment et de ronds à béton.',
      receipt_file_id: 'gdrive-alloc3',
      receipt_url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=500&fit=crop',
      created_at: '2025-06-01T11:00:00.000Z'
    }
  ],
  expense_categories: [
    { id: 'cat-1', name: 'Gros Œuvre & Fondations' },
    { id: 'cat-2', name: 'Second Œuvre & Plâtre' },
    { id: 'cat-3', name: 'Matériaux & Ciment' },
    { id: 'cat-4', name: 'Main d\'Œuvre & Journaliers' },
    { id: 'cat-5', name: 'Location Engins & Camions' },
    { id: 'cat-6', name: 'Carburant & Logistique' },
    { id: 'cat-7', name: 'Sécurité & Équipements (EPI)' },
    { id: 'cat-8', name: 'Frais Administratifs & Bureau' }
  ],
  expenses: [
    {
      id: 'exp-1',
      project_id: 'proj-1',
      category_id: 'cat-1',
      submitted_by: 'usr-manager',
      amount_dzd: 42000000.00, // 42M DZD
      description: 'Facture travaux de terrassement et creusement de sol, Entreprise Oranaise de Terrassement.',
      receipt_file_id: 'gdrive-exp1',
      receipt_url: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&fit=crop',
      status: 'Approved',
      submitted_at: '2025-02-15T10:00:00.000Z',
      updated_at: '2025-02-16T15:00:00.000Z'
    },
    {
      id: 'exp-2',
      project_id: 'proj-1',
      category_id: 'cat-3',
      submitted_by: 'usr-manager',
      amount_dzd: 38500000.00, // 38.5M DZD
      description: 'Achat de 350 tonnes de ciment GICA auprès du distributeur officiel d\'Oran.',
      receipt_file_id: 'gdrive-exp2',
      receipt_url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=500&fit=crop',
      status: 'Approved',
      submitted_at: '2025-03-20T08:30:00.000Z',
      updated_at: '2025-03-21T11:20:00.000Z'
    },
    {
      id: 'exp-3',
      project_id: 'proj-2',
      category_id: 'cat-4',
      submitted_by: 'usr-employee',
      amount_dzd: 1200000.00, // 1.2M DZD
      description: 'Paiement de la main d\'œuvre journalière pour le coulage de la dalle du Bloc B.',
      receipt_file_id: 'gdrive-exp3',
      receipt_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&fit=crop',
      status: 'Approved',
      submitted_at: '2025-05-10T17:00:00.000Z',
      updated_at: '2025-05-11T09:00:00.000Z'
    },
    {
      id: 'exp-4',
      project_id: 'proj-1',
      category_id: 'cat-6',
      submitted_by: 'usr-manager',
      amount_dzd: 450000.00, // 450k DZD
      description: 'Ravitaillement carburant Naftal pour les groupes électrogènes et la grue de chantier.',
      receipt_file_id: 'gdrive-exp4',
      receipt_url: 'https://images.unsplash.com/photo-1527018601619-a508a2be00cd?w=500&fit=crop',
      status: 'Pending',
      submitted_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'exp-5',
      project_id: 'proj-2',
      category_id: 'cat-7',
      submitted_by: 'usr-manager',
      amount_dzd: 2300000.00, // 2.3M DZD
      description: 'Achat de casques, chaussures de sécurité, gilets haute visibilité et harnais anti-chute.',
      receipt_file_id: 'gdrive-exp5',
      receipt_url: 'https://images.unsplash.com/photo-1513828742140-ccaa34f32735?w=500&fit=crop',
      status: 'Pending',
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  suppliers: [
    {
      id: 'supp-1',
      company_name: 'Sarl GICA Algerie (Ciment)',
      contact_name: 'Mourad Laribi',
      phone: '+213 21 88 99 00',
      email: 'm.laribi@gica.dz',
      address: 'Zone Industrielle, Meftah, Alger',
      created_at: new Date().toISOString()
    },
    {
      id: 'supp-2',
      company_name: 'Ets Naftal Distribution',
      contact_name: 'Rachid Benslimane',
      phone: '+213 23 45 67 89',
      email: 'contact@naftal.dz',
      address: 'Route des Dunes, Cheraga, Alger',
      created_at: new Date().toISOString()
    },
    {
      id: 'supp-3',
      company_name: 'Sarl Somacim (Engins BTP)',
      contact_name: 'Omar Benyahia',
      phone: '+213 31 54 32 10',
      email: 'o.benyahia@somacim.com',
      address: 'Zone Industrielle Hassi Ameur, Oran',
      created_at: new Date().toISOString()
    }
  ],
  subcontractors: [
    {
      id: 'subc-1',
      company_name: 'Sarl Algeria Fondations BTP',
      contact_name: 'Tarek Hamidi',
      phone: '+213 560 55 66 77',
      email: 't.hamidi@algeriafondations.com',
      created_at: new Date().toISOString()
    },
    {
      id: 'subc-2',
      company_name: 'Ets Belplâtre Oran',
      contact_name: 'Fouad Belkacem',
      phone: '+213 555 41 42 43',
      email: 'f.belkacem@belplatre.dz',
      created_at: new Date().toISOString()
    }
  ],
  purchase_requests: [
    {
      id: 'pr-1',
      project_id: 'proj-1',
      requester_id: 'usr-manager',
      description: 'Demande urgente d\'achat de 150 treillis soudés pour dalles du Bloc A.',
      amount_dzd: 3400000.00,
      status: 'Pending',
      created_at: new Date().toISOString()
    }
  ],
  purchase_orders: [
    {
      id: 'po-1',
      supplier_id: 'supp-1',
      project_id: 'proj-1',
      amount_dzd: 12500000.00,
      status: 'Approved',
      created_at: '2025-05-15T09:00:00.000Z'
    }
  ],
  contracts: [
    {
      id: 'cont-1',
      project_id: 'proj-1',
      contractor_id: 'subc-1',
      amount_dzd: 85000000.00, // 85M DZD
      start_date: '2025-01-20',
      end_date: '2025-08-30',
      created_at: '2025-01-15T11:00:00.000Z'
    }
  ],
  stocks: [
    {
      id: 'st-1',
      project_id: 'proj-1',
      item_name: 'Ciment GICA CPJ-CEM II',
      quantity: 120,
      unit: 'Tonnes',
      updated_at: new Date().toISOString()
    },
    {
      id: 'st-2',
      project_id: 'proj-1',
      item_name: 'Ronds à béton FeE500 Ø12',
      quantity: 45,
      unit: 'Tonnes',
      updated_at: new Date().toISOString()
    },
    {
      id: 'st-3',
      project_id: 'proj-2',
      item_name: 'Briques creuses 8 trous',
      quantity: 15000,
      unit: 'Unités',
      updated_at: new Date().toISOString()
    }
  ],
  equipment: [
    {
      id: 'eq-1',
      project_id: 'proj-1',
      equipment_name: 'Grue à tour Potain MC 85',
      status: 'Active',
      updated_at: new Date().toISOString()
    },
    {
      id: 'eq-2',
      project_id: 'proj-1',
      equipment_name: 'Pelle hydraulique Caterpillar 320D',
      status: 'Active',
      updated_at: new Date().toISOString()
    },
    {
      id: 'eq-3',
      project_id: 'proj-2',
      equipment_name: 'Centrale à béton mobile Liebherr',
      status: 'Under Maintenance',
      updated_at: new Date().toISOString()
    }
  ],
  notifications: [
    {
      id: 'not-1',
      user_id: 'usr-admin',
      title: 'Nouvelle dépense soumise',
      message: 'Le chef de chantier Sofiane Boumediene a soumis une dépense de 2 300 000,00 DZD pour l\'achat d\'Équipements (EPI).',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'not-2',
      user_id: 'usr-director',
      title: 'Nouvelle dépense soumise',
      message: 'Le chef de chantier Sofiane Boumediene a soumis une dépense de 2 300 000,00 DZD pour l\'achat d\'Équipements (EPI).',
      is_read: false,
      created_at: new Date().toISOString()
    }
  ],
  audit_logs: [
    {
      id: 'log-1',
      user_id: 'usr-director',
      entity: 'allocations',
      entity_id: 'alloc-1',
      action: 'INSERT',
      new_value: { amount_dzd: 150000000.00, project_id: 'proj-1' },
      created_at: '2025-01-12T09:30:00.000Z'
    }
  ]
};

export class LocalDbService {
  private static load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
        return DEFAULT_DB;
      }
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data) as DatabaseSchema;
    } catch (e) {
      console.error('Error reading local db, resetting to default', e);
      return DEFAULT_DB;
    }
  }

  private static save(data: DatabaseSchema) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error writing local db', e);
    }
  }

  // Generic lists
  public static getProfiles(): Profile[] {
    return this.load().profiles;
  }

  public static getProfileByEmail(email: string): Profile | undefined {
    return this.load().profiles.find(p => p.email.toLowerCase() === email.toLowerCase());
  }

  public static getPreferences(userId: string): UserPreference {
    const db = this.load();
    let pref = db.user_preferences.find(p => p.user_id === userId);
    if (!pref) {
      pref = {
        id: 'pref-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        language: 'fr',
        theme: 'light',
        notification_settings: { email: true, push: true, realtime: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.user_preferences.push(pref);
      this.save(db);
    }
    return pref;
  }

  public static updatePreferences(userId: string, updates: Partial<UserPreference>): UserPreference {
    const db = this.load();
    const index = db.user_preferences.findIndex(p => p.user_id === userId);
    let pref: UserPreference;
    if (index >= 0) {
      pref = { ...db.user_preferences[index], ...updates, updated_at: new Date().toISOString() };
      db.user_preferences[index] = pref;
    } else {
      pref = {
        id: 'pref-' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        language: updates.language || 'fr',
        theme: updates.theme || 'light',
        notification_settings: updates.notification_settings || { email: true, push: true, realtime: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.user_preferences.push(pref);
    }
    this.save(db);
    return pref;
  }

  // Projects
  public static getProjects(): Project[] {
    return this.load().projects;
  }

  public static getProject(id: string): Project | undefined {
    return this.load().projects.find(p => p.id === id);
  }

  public static createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>, userId: string): Project {
    const db = this.load();
    const newProj: Project = {
      ...project,
      id: 'proj-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.projects.push(newProj);

    this.logAudit(userId, 'projects', newProj.id, 'INSERT', null, newProj, db);
    this.save(db);
    return newProj;
  }

  public static updateProject(id: string, updates: Partial<Project>, userId: string): Project {
    const db = this.load();
    const idx = db.projects.findIndex(p => p.id === id);
    if (idx < 0) throw new Error('Project not found');

    const oldVal = db.projects[idx];
    const newVal = { ...oldVal, ...updates, updated_at: new Date().toISOString() };
    db.projects[idx] = newVal;

    this.logAudit(userId, 'projects', id, 'UPDATE', oldVal, newVal, db);
    this.save(db);
    return newVal;
  }

  public static deleteProject(id: string, userId: string) {
    const db = this.load();
    const idx = db.projects.findIndex(p => p.id === id);
    if (idx < 0) throw new Error('Project not found');

    const oldVal = db.projects[idx];
    db.projects.splice(idx, 1);

    this.logAudit(userId, 'projects', id, 'DELETE', oldVal, null, db);
    this.save(db);
  }

  // Budget validation logic helper
  public static checkBudgetExceeded(projectId: string, incomingAmount: number): { exceeded: boolean; remainingBudget: number; totalConsumed: number; projectBudget: number } {
    const db = this.load();
    const project = db.projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    // Consumed amounts = Approved Expenses + Approved Purchase Requests + Approved Purchase Orders + Contracts + incomingAmount
    const approvedExpenses = db.expenses
      .filter(e => e.project_id === projectId && e.status === 'Approved')
      .reduce((sum, e) => sum + e.amount_dzd, 0);

    const approvedPurchaseRequests = db.purchase_requests
      .filter(pr => pr.project_id === projectId && pr.status === 'Approved')
      .reduce((sum, pr) => sum + pr.amount_dzd, 0);

    const approvedPurchaseOrders = db.purchase_orders
      .filter(po => po.project_id === projectId && po.status === 'Approved')
      .reduce((sum, po) => sum + po.amount_dzd, 0);

    const activeContracts = db.contracts
      .filter(c => c.project_id === projectId)
      .reduce((sum, c) => sum + c.amount_dzd, 0);

    const totalConsumed = approvedExpenses + approvedPurchaseRequests + approvedPurchaseOrders + activeContracts;
    const remainingBudget = project.budget - totalConsumed;

    return {
      exceeded: (totalConsumed + incomingAmount) > project.budget,
      remainingBudget,
      totalConsumed,
      projectBudget: project.budget
    };
  }

  // Allocations
  public static getAllocations(): Allocation[] {
    const db = this.load();
    return db.allocations.map(a => {
      const u = db.profiles.find(p => p.id === a.allocated_by);
      return { ...a, allocated_by_name: u ? u.full_name : 'Unknown User' };
    });
  }

  public static createAllocation(alloc: Omit<Allocation, 'id' | 'created_at'>, userId: string): Allocation {
    const db = this.load();
    
    // We validate if allocation is within reason (optional, but let's check)
    // Budget check isn't strictly blocking for allocations as they fund the project, 
    // but let's log the event.
    const newAlloc: Allocation = {
      ...alloc,
      id: 'alloc-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    db.allocations.push(newAlloc);

    this.logAudit(userId, 'allocations', newAlloc.id, 'INSERT', null, newAlloc, db);
    this.createNotificationForGroup(['Super Admin', 'Financial Director', 'Accountant'], 
      'Allocation Créée', 
      `Une nouvelle allocation de ${newAlloc.amount_dzd.toLocaleString('fr-DZ')} DZD a été effectuée pour le projet par ${db.profiles.find(p => p.id === userId)?.full_name || 'Directeur'}.`, 
      db
    );

    this.save(db);
    return newAlloc;
  }

  // Expense Categories
  public static getCategories(): ExpenseCategory[] {
    return this.load().expense_categories;
  }

  // Expenses
  public static getExpenses(): Expense[] {
    const db = this.load();
    return db.expenses.map(e => {
      const proj = db.projects.find(p => p.id === e.project_id);
      const cat = db.expense_categories.find(c => c.id === e.category_id);
      const sub = db.profiles.find(p => p.id === e.submitted_by);
      return {
        ...e,
        project_name: proj ? proj.name : 'Unknown Project',
        project_code: proj ? proj.code : '',
        category_name: cat ? cat.name : 'Unknown Category',
        submitted_by_name: sub ? sub.full_name : 'Unknown Submitter'
      };
    });
  }

  public static createExpense(exp: Omit<Expense, 'id' | 'submitted_at' | 'updated_at'>, userId: string): Expense {
    const db = this.load();

    // Secure validation check:
    // If we're auto-approving (or submitting approved), check budget.
    // Usually site managers submit "Pending" expenses. Budget checks are triggered strictly upon APPROVAL,
    // but let's also check upon creation if status is set to Approved.
    if (exp.status === 'Approved') {
      const budgetCheck = this.checkBudgetExceeded(exp.project_id, exp.amount_dzd);
      if (budgetCheck.exceeded) {
        this.logAudit(userId, 'expenses', 'FAILED', 'BUDGET_LIMIT_EXCEEDED', { amount_dzd: exp.amount_dzd, projectId: exp.project_id }, null, db);
        throw new Error(`Budget dépassé! Le budget restant est de ${budgetCheck.remainingBudget.toLocaleString('fr-DZ')} DZD. Cette dépense de ${exp.amount_dzd.toLocaleString('fr-DZ')} DZD est rejetée.`);
      }
    }

    const newExp: Expense = {
      ...exp,
      id: 'exp-' + Math.random().toString(36).substr(2, 9),
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    db.expenses.push(newExp);

    this.logAudit(userId, 'expenses', newExp.id, 'INSERT', null, newExp, db);

    // Notify approvers
    this.createNotificationForGroup(['Super Admin', 'Financial Director', 'Accountant'], 
      'Nouvelle dépense soumise', 
      `Dépense de ${newExp.amount_dzd.toLocaleString('fr-DZ')} DZD soumise pour ${db.projects.find(p => p.id === newExp.project_id)?.name}.`, 
      db
    );

    this.save(db);
    return newExp;
  }

  public static updateExpenseStatus(expenseId: string, status: 'Approved' | 'Rejected', reason: string | undefined, userId: string): Expense {
    const db = this.load();
    const idx = db.expenses.findIndex(e => e.id === expenseId);
    if (idx < 0) throw new Error('Expense not found');

    const oldExpense = db.expenses[idx];
    
    // Budget check on Approval!
    if (status === 'Approved') {
      const budgetCheck = this.checkBudgetExceeded(oldExpense.project_id, oldExpense.amount_dzd);
      if (budgetCheck.exceeded) {
        // Automatically set to rejected due to budget, log it, throw error!
        oldExpense.status = 'Rejected';
        oldExpense.rejection_reason = 'Dépassement du budget du projet';
        oldExpense.updated_at = new Date().toISOString();
        db.expenses[idx] = oldExpense;
        
        this.logAudit(userId, 'expenses', expenseId, 'APPROVAL_BLOCKED_BUDGET', oldExpense, { status: 'Rejected', reason: 'Budget Exceeded' }, db);
        
        // Notify of budget limit breach
        this.createNotificationForGroup(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager'], 
          '⚠️ Alerte Budget Dépassé', 
          `L'approbation de la dépense de ${oldExpense.amount_dzd.toLocaleString('fr-DZ')} DZD a échoué car le budget du projet ${db.projects.find(p => p.id === oldExpense.project_id)?.name} est dépassé.`, 
          db
        );
        this.save(db);

        throw new Error(`Opération Bloquée: Le budget restant de ${budgetCheck.remainingBudget.toLocaleString('fr-DZ')} DZD est insuffisant pour approuver cette dépense de ${oldExpense.amount_dzd.toLocaleString('fr-DZ')} DZD.`);
      }
    }

    const updated: Expense = {
      ...oldExpense,
      status,
      rejection_reason: reason || null,
      updated_at: new Date().toISOString()
    };
    db.expenses[idx] = updated;

    this.logAudit(userId, 'expenses', expenseId, `UPDATE_STATUS_${status.toUpperCase()}`, oldExpense, updated, db);

    // Notify submitter
    this.createNotificationForUser(updated.submitted_by, 
      `Dépense ${status === 'Approved' ? 'Approuvée' : 'Rejetée'}`, 
      `Votre dépense de ${updated.amount_dzd.toLocaleString('fr-DZ')} DZD pour le projet ${db.projects.find(p => p.id === updated.project_id)?.name} a été ${status === 'Approved' ? 'approuvée' : 'rejetée'}.`, 
      db
    );

    this.save(db);
    return updated;
  }

  // Suppliers & Subcontractors
  public static getSuppliers(): Supplier[] {
    return this.load().suppliers;
  }

  public static createSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>, userId: string): Supplier {
    const db = this.load();
    const newSupp: Supplier = {
      ...supplier,
      id: 'supp-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    db.suppliers.push(newSupp);
    this.logAudit(userId, 'suppliers', newSupp.id, 'INSERT', null, newSupp, db);
    this.save(db);
    return newSupp;
  }

  public static getSubcontractors(): Subcontractor[] {
    return this.load().subcontractors;
  }

  public static createSubcontractor(subcontractor: Omit<Subcontractor, 'id' | 'created_at'>, userId: string): Subcontractor {
    const db = this.load();
    const newSub: Subcontractor = {
      ...subcontractor,
      id: 'subc-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    db.subcontractors.push(newSub);
    this.logAudit(userId, 'subcontractors', newSub.id, 'INSERT', null, newSub, db);
    this.save(db);
    return newSub;
  }

  // Purchase Requests
  public static getPurchaseRequests(): PurchaseRequest[] {
    const db = this.load();
    return db.purchase_requests.map(pr => {
      const proj = db.projects.find(p => p.id === pr.project_id);
      const req = db.profiles.find(p => p.id === pr.requester_id);
      return {
        ...pr,
        project_name: proj ? proj.name : '',
        requester_name: req ? req.full_name : ''
      };
    });
  }

  public static createPurchaseRequest(pr: Omit<PurchaseRequest, 'id' | 'created_at'>, userId: string): PurchaseRequest {
    const db = this.load();
    
    // Budget check upon approval, but check if we're submitting approved
    if (pr.status === 'Approved') {
      const budgetCheck = this.checkBudgetExceeded(pr.project_id, pr.amount_dzd);
      if (budgetCheck.exceeded) {
        throw new Error(`Budget dépassé! Le budget restant est de ${budgetCheck.remainingBudget.toLocaleString('fr-DZ')} DZD.`);
      }
    }

    const newPr: PurchaseRequest = {
      ...pr,
      id: 'pr-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    db.purchase_requests.push(newPr);
    this.logAudit(userId, 'purchase_requests', newPr.id, 'INSERT', null, newPr, db);
    
    this.createNotificationForGroup(['Super Admin', 'Financial Director'], 
      'Demande d\'achat soumise', 
      `Une nouvelle demande d'achat de ${newPr.amount_dzd.toLocaleString('fr-DZ')} DZD a été soumise.`, 
      db
    );

    this.save(db);
    return newPr;
  }

  public static approvePurchaseRequest(id: string, status: 'Approved' | 'Rejected', userId: string): PurchaseRequest {
    const db = this.load();
    const idx = db.purchase_requests.findIndex(pr => pr.id === id);
    if (idx < 0) throw new Error('Purchase Request not found');

    const pr = db.purchase_requests[idx];
    if (status === 'Approved') {
      const budgetCheck = this.checkBudgetExceeded(pr.project_id, pr.amount_dzd);
      if (budgetCheck.exceeded) {
        throw new Error(`Budget dépassé! Opération bloquée.`);
      }
    }

    pr.status = status;
    db.purchase_requests[idx] = pr;
    this.logAudit(userId, 'purchase_requests', id, `APPROVE_${status.toUpperCase()}`, null, pr, db);
    this.save(db);
    return pr;
  }

  // Purchase Orders
  public static getPurchaseOrders(): PurchaseOrder[] {
    const db = this.load();
    return db.purchase_orders.map(po => {
      const supp = db.suppliers.find(s => s.id === po.supplier_id);
      const proj = db.projects.find(p => p.id === po.project_id);
      return {
        ...po,
        supplier_name: supp ? supp.company_name : '',
        project_name: proj ? proj.name : ''
      };
    });
  }

  public static createPurchaseOrder(po: Omit<PurchaseOrder, 'id' | 'created_at'>, userId: string): PurchaseOrder {
    const db = this.load();
    const budgetCheck = this.checkBudgetExceeded(po.project_id, po.amount_dzd);
    if (budgetCheck.exceeded) {
      throw new Error(`Opération bloquée: Le budget restant est insuffisant pour ce bon de commande.`);
    }

    const newPo: PurchaseOrder = {
      ...po,
      id: 'po-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    db.purchase_orders.push(newPo);
    this.logAudit(userId, 'purchase_orders', newPo.id, 'INSERT', null, newPo, db);
    this.save(db);
    return newPo;
  }

  // Contracts
  public static getContracts(): Contract[] {
    const db = this.load();
    return db.contracts.map(c => {
      const proj = db.projects.find(p => p.id === c.project_id);
      const sub = db.subcontractors.find(s => s.id === c.contractor_id);
      return {
        ...c,
        project_name: proj ? proj.name : '',
        contractor_name: sub ? sub.company_name : ''
      };
    });
  }

  public static createContract(contract: Omit<Contract, 'id' | 'created_at'>, userId: string): Contract {
    const db = this.load();
    const budgetCheck = this.checkBudgetExceeded(contract.project_id, contract.amount_dzd);
    if (budgetCheck.exceeded) {
      throw new Error(`Opération bloquée: Le montant du contrat de sous-traitance dépasse le budget restant du projet.`);
    }

    const newContract: Contract = {
      ...contract,
      id: 'cont-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    db.contracts.push(newContract);
    this.logAudit(userId, 'contracts', newContract.id, 'INSERT', null, newContract, db);
    this.save(db);
    return newContract;
  }

  // Stocks & Equipment
  public static getStocks(): Stock[] {
    const db = this.load();
    return db.stocks.map(s => {
      const proj = db.projects.find(p => p.id === s.project_id);
      return { ...s, project_name: proj ? proj.name : '' };
    });
  }

  public static createStock(stock: Omit<Stock, 'id' | 'updated_at'>, userId: string): Stock {
    const db = this.load();
    const newStock: Stock = {
      ...stock,
      id: 'st-' + Math.random().toString(36).substr(2, 9),
      updated_at: new Date().toISOString()
    };
    db.stocks.push(newStock);
    this.logAudit(userId, 'stocks', newStock.id, 'INSERT', null, newStock, db);
    this.save(db);
    return newStock;
  }

  public static updateStockQuantity(id: string, qty: number, userId: string): Stock {
    const db = this.load();
    const idx = db.stocks.findIndex(s => s.id === id);
    if (idx < 0) throw new Error('Stock item not found');

    const oldVal = db.stocks[idx];
    const newVal = { ...oldVal, quantity: qty, updated_at: new Date().toISOString() };
    db.stocks[idx] = newVal;
    this.logAudit(userId, 'stocks', id, 'UPDATE', oldVal, newVal, db);
    this.save(db);
    return newVal;
  }

  public static getEquipment(): Equipment[] {
    const db = this.load();
    return db.equipment.map(e => {
      const proj = db.projects.find(p => p.id === e.project_id);
      return { ...e, project_name: proj ? proj.name : '' };
    });
  }

  public static createEquipment(eq: Omit<Equipment, 'id' | 'updated_at'>, userId: string): Equipment {
    const db = this.load();
    const newEq: Equipment = {
      ...eq,
      id: 'eq-' + Math.random().toString(36).substr(2, 9),
      updated_at: new Date().toISOString()
    };
    db.equipment.push(newEq);
    this.logAudit(userId, 'equipment', newEq.id, 'INSERT', null, newEq, db);
    this.save(db);
    return newEq;
  }

  public static updateEquipmentStatus(id: string, status: 'Active' | 'Under Maintenance' | 'Inactive', userId: string): Equipment {
    const db = this.load();
    const idx = db.equipment.findIndex(e => e.id === id);
    if (idx < 0) throw new Error('Equipment not found');

    const oldVal = db.equipment[idx];
    const newVal = { ...oldVal, status, updated_at: new Date().toISOString() };
    db.equipment[idx] = newVal;
    this.logAudit(userId, 'equipment', id, 'UPDATE', oldVal, newVal, db);
    this.save(db);
    return newVal;
  }

  // Notifications
  public static getNotifications(userId: string): Notification[] {
    return this.load().notifications.filter(n => n.user_id === userId);
  }

  public static markNotificationRead(id: string, userId: string): Notification {
    const db = this.load();
    const idx = db.notifications.findIndex(n => n.id === id && n.user_id === userId);
    if (idx < 0) throw new Error('Notification not found');

    db.notifications[idx].is_read = true;
    const item = db.notifications[idx];
    this.save(db);
    return item;
  }

  // Audit Logs
  public static getAuditLogs(): AuditLog[] {
    const db = this.load();
    return db.audit_logs.map(l => {
      const u = db.profiles.find(p => p.id === l.user_id);
      return {
        ...l,
        user_name: u ? u.full_name : 'Système'
      };
    }).sort((a,b) => b.created_at.localeCompare(a.created_at));
  }

  // Private helper utilities
  private static logAudit(userId: string, entity: string, entityId: string, action: string, oldVal: any, newVal: any, db: DatabaseSchema) {
    const log: AuditLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      entity,
      entity_id: entityId,
      action,
      old_value: oldVal,
      new_value: newVal,
      created_at: new Date().toISOString()
    };
    db.audit_logs.push(log);
  }

  private static createNotificationForGroup(roles: string[], title: string, message: string, db: DatabaseSchema) {
    const targets = db.profiles.filter(p => roles.includes(p.role));
    for (const t of targets) {
      db.notifications.push({
        id: 'not-' + Math.random().toString(36).substr(2, 9),
        user_id: t.id,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString()
      });
    }
  }

  private static createNotificationForUser(userId: string, title: string, message: string, db: DatabaseSchema) {
    db.notifications.push({
      id: 'not-' + Math.random().toString(36).substr(2, 9),
      user_id: userId,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    });
  }
}
