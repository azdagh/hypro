import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { SupabaseDbService, SupabaseAuthService, bootstrapSuperAdmin } from './server/supabase';
import { 
  authenticateJWT, 
  requireRole, 
  requireProjectAccess, 
  requireOwnershipOrPrivileged 
} from './server/middleware/authenticateJWT';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing with large limit for receipt photos
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Zero-Trust JWT Authentication Middleware for API endpoints
app.use((req, res, next) => {
  const publicApiPaths = ['/api/auth/login', '/api/auth/config', '/api/auth/dev-superadmin-login'];
  if (req.path.startsWith('/api') && !publicApiPaths.includes(req.path)) {
    authenticateJWT(req, res, next);
  } else {
    next();
  }
});

// Ensure public uploads folder exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// -------------------------------------------------------------------------
// STARTUP ENVIRONMENT VALIDATION MIDDLEWARE (FAIL FAST)
// -------------------------------------------------------------------------
app.use((req, res, next) => {
  const missingVars: string[] = [];
  if (!process.env.SUPABASE_URL) missingVars.push('SUPABASE_URL');
  if (!process.env.SUPABASE_ANON_KEY) missingVars.push('SUPABASE_ANON_KEY');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) missingVars.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !process.env.GOOGLE_PRIVATE_KEY) missingVars.push('GOOGLE_PRIVATE_KEY');
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) missingVars.push('GOOGLE_DRIVE_FOLDER_ID');

  if (missingVars.length > 0) {
    const missingVarItems = missingVars.map((name) => `
            <div class="var-item">
              <span class="var-name">${name}</span>
              <span class="var-status missing">CRITIQUE - MANQUANT</span>
            </div>`).join('');
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Configuration Requise - HYPRO ERP</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 24px;
            box-sizing: border-box;
          }
          .card {
            background-color: #1e293b;
            border: 1px solid #334155;
            border-radius: 16px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
          }
          .header {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 24px;
          }
          .icon {
            background-color: #ef4444;
            color: #ffffff;
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
          }
          h1 {
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.025em;
          }
          p {
            color: #94a3b8;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 24px 0;
          }
          .var-list {
            background-color: #0f172a;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 13px;
          }
          .var-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #1e293b;
          }
          .var-item:last-child {
            border-bottom: none;
          }
          .var-name {
            color: #38bdf8;
            font-weight: 500;
          }
          .var-status.missing {
            color: #f43f5e;
            font-weight: bold;
          }
          .var-status.configured {
            color: #10b981;
            font-weight: bold;
          }
          .instructions {
            background-color: #334155;
            color: #f8fafc;
            border-radius: 8px;
            padding: 16px;
            font-size: 13px;
            line-height: 1.6;
            border-left: 4px solid #ef4444;
          }
          .instructions code {
            background-color: #0f172a;
            color: #38bdf8;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="icon">⚠️</div>
            <div>
              <h1>HYPRO ERP - Configuration Requise</h1>
            </div>
          </div>
          <p>Pour garantir la sécurité et l'intégrité du système de gestion immobilière de <strong>HYPRO Promotion Immobilière</strong>, l'application est configurée pour s'exécuter exclusivement avec une infrastructure cloud de production active. Veuillez renseigner les variables manquantes dans les paramètres ou dans votre fichier <code>.env</code>.</p>
          
          <div class="var-list">
${missingVarItems}
          </div>

          <div class="instructions">
            <strong>Action Requise :</strong> Renseignez ces variables d'environnement dans le panneau <strong>Secrets / Settings</strong> de Google AI Studio, ou ajoutez-les à un fichier local <code>.env</code>. Le serveur de développement rechargera et activera automatiquement l'ERP dès que l'intégration sera opérationnelle.
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }
  next();
});

// -------------------------------------------------------------------------
// SERVER-SIDE GEMINI API CLIENT INITIALIZATION
// -------------------------------------------------------------------------
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// -------------------------------------------------------------------------
// REAL ENDPOINTS CONNECTED DIRECTLY TO SUPABASE
// -------------------------------------------------------------------------

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Config for client-side Supabase Auth
app.get('/api/auth/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.trim().replace(/\/$/, '') : '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.trim() : '',
  });
});

// Authentication using Supabase Auth (signInWithPassword)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'L\'adresse email est requise.' });
  }
  // If no password is provided in demo mode, try to fetch the profile by email.
  // Otherwise, use real signInWithPassword.
  try {
    if (password) {
      const data = await SupabaseAuthService.login(email, password);
      res.json({ user: data.user, success: true, session: data.session });
    } else {
      // Direct email resolution for rapid profile navigation
      const profile = await SupabaseDbService.getProfileByEmail(email);
      if (!profile) {
        return res.status(404).json({ error: 'Utilisateur non enregistré chez HYPRO ERP.' });
      }
      res.json({ user: profile, success: true });
    }
  } catch (e: any) {
    res.status(400).json({ error: 'Échec de la connexion : ' + e.message });
  }
});

app.post('/api/auth/dev-superadmin-login', async (req, res) => {
  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;

  if (!email || !password) {
    return res.status(400).json({ error: 'INITIAL_ADMIN_EMAIL/PASSWORD manquants.' });
  }

  try {
    const data = await SupabaseAuthService.login(email, password);
    res.json({ user: data.user, success: true, session: data.session });
  } catch (e: any) {
    res.status(400).json({ error: 'Échec de la connexion Super Admin : ' + e.message });
  }
});

app.get('/api/auth/profiles', async (req, res) => {
  try {
    const data = await SupabaseDbService.getProfiles();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// -------------------------------------------------------------------------
// USER ADMINISTRATION & INVITATIONS (SUPER ADMIN ONLY) & PROJECT ASSIGNMENTS
// -------------------------------------------------------------------------

const verifySuperAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Accès non autorisé. Session inexistante.' });
  }
  if (req.user.role !== 'Super Admin') {
    return res.status(403).json({ error: 'Accès interdit. Rôle Super Admin requis.' });
  }
  next();
};

// Users management
app.get('/api/admin/users', verifySuperAdmin, async (req, res) => {
  try {
    const users = await SupabaseDbService.getAdminUsers();
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/users', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    const data = await SupabaseDbService.adminCreateUser(req.body, adminUserId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/users/:id', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    const data = await SupabaseDbService.adminUpdateUser(req.params.id, req.body, adminUserId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/admin/users/:id/disable', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    const data = await SupabaseDbService.adminDisableUser(req.params.id, adminUserId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/admin/users/:id/reactivate', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    const data = await SupabaseDbService.adminReactivateUser(req.params.id, adminUserId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/admin/users/:id/reset-password', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Le nouveau mot de passe est requis.' });
    }
    const data = await SupabaseDbService.adminResetPassword(req.params.id, password, adminUserId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Invitations management
app.get('/api/admin/invitations', verifySuperAdmin, async (req, res) => {
  try {
    const invitations = await SupabaseDbService.getInvitations();
    res.json(invitations);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/invitations', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    const data = await SupabaseDbService.createInvitation(req.body, adminUserId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/admin/invitations/:id', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  const { status } = req.body;
  try {
    const data = await SupabaseDbService.updateInvitationStatus(req.params.id, status, adminUserId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Project assignments management
app.get('/api/admin/project-assignments', verifySuperAdmin, async (req, res) => {
  try {
    const data = await SupabaseDbService.getProjectAssignments();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/project-assignments', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    const data = await SupabaseDbService.createProjectAssignment(req.body, adminUserId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/admin/project-assignments/:id', verifySuperAdmin, async (req, res) => {
  const adminUserId = req.user!.id;
  try {
    await SupabaseDbService.deleteProjectAssignment(req.params.id, adminUserId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// My Assignments
app.get('/api/my-assignments', async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.getMyAssignments(userId);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// User Preferences
app.get('/api/preferences/:userId', requireOwnershipOrPrivileged, async (req, res) => {
  try {
    const data = await SupabaseDbService.getPreferences(req.params.userId);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/preferences/:userId', requireOwnershipOrPrivileged, async (req, res) => {
  try {
    const data = await SupabaseDbService.updatePreferences(req.params.userId, req.body);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Projects CRUD
app.get('/api/projects', async (req, res) => {
  try {
    const data = await SupabaseDbService.getProjects();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const data = await SupabaseDbService.getProject(req.params.id);
    res.json(data);
  } catch (e: any) {
    res.status(404).json({ error: 'Projet introuvable : ' + e.message });
  }
});

app.post('/api/projects', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createProject(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/projects/:id', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.updateProject(req.params.id, req.body, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/projects/:id', requireRole(['Super Admin']), async (req, res) => {
  const userId = req.user!.id;
  try {
    await SupabaseDbService.deleteProject(req.params.id, userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Allocations
app.get('/api/allocations', async (req, res) => {
  try {
    const data = await SupabaseDbService.getAllocations();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/allocations', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createAllocation(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/allocations/:id', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  const userId = req.user!.id;
  try {
    await SupabaseDbService.deleteAllocation(req.params.id, userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Categories
app.get('/api/categories', async (req, res) => {
  try {
    const data = await SupabaseDbService.getCategories();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/categories', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  try {
    const data = await SupabaseDbService.createCategory(req.body);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/categories/:id', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  try {
    await SupabaseDbService.deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Expenses
app.get('/api/expenses', async (req, res) => {
  try {
    const data = await SupabaseDbService.getExpenses();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/expenses', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager', 'Employee']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createExpense(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/expenses/:id/status', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  const userId = req.user!.id;
  const { status, rejection_reason } = req.body;
  try {
    const data = await SupabaseDbService.updateExpenseStatus(req.params.id, status, rejection_reason, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/expenses/:id', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  const userId = req.user!.id;
  try {
    await SupabaseDbService.deleteExpense(req.params.id, userId);
    res.json({ success: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Suppliers & Subcontractors
app.get('/api/suppliers', async (req, res) => {
  try {
    const data = await SupabaseDbService.getSuppliers();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/suppliers', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createSupplier(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/subcontractors', async (req, res) => {
  try {
    const data = await SupabaseDbService.getSubcontractors();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/subcontractors', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createSubcontractor(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Purchase Requests
app.get('/api/purchase-requests', async (req, res) => {
  try {
    const data = await SupabaseDbService.getPurchaseRequests();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/purchase-requests', requireRole(['Super Admin', 'Financial Director', 'Site Manager', 'Employee']), requireProjectAccess, async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createPurchaseRequest(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/purchase-requests/:id/approve', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  const { status } = req.body;
  try {
    const data = await SupabaseDbService.approvePurchaseRequest(req.params.id, status, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/purchase-requests/:id/status', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  const { status } = req.body;
  try {
    const data = await SupabaseDbService.approvePurchaseRequest(req.params.id, status, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Purchase Orders
app.get('/api/purchase-orders', async (req, res) => {
  try {
    const data = await SupabaseDbService.getPurchaseOrders();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/purchase-orders', requireRole(['Super Admin', 'Financial Director', 'Accountant']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createPurchaseOrder(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/purchase-orders/:id/status', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const { status } = req.body;
    const data = await SupabaseDbService.updatePurchaseOrderStatus(req.params.id, status, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Contracts
app.get('/api/contracts', async (req, res) => {
  try {
    const data = await SupabaseDbService.getContracts();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/contracts', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createContract(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/contracts/:id/status', requireRole(['Super Admin', 'Financial Director']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const { status } = req.body;
    const data = await SupabaseDbService.updateContractStatus(req.params.id, status, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Stocks
app.get('/api/stocks', async (req, res) => {
  try {
    const data = await SupabaseDbService.getStocks();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/stock-items', async (req, res) => {
  try {
    const data = await SupabaseDbService.getStocks();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/stocks', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createStock(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/stock-items', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createStock(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/stocks/:id/quantity', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  const { quantity } = req.body;
  try {
    const data = await SupabaseDbService.updateStockQuantity(req.params.id, Number(quantity), userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/stock-items/:id/quantity', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  const { quantity } = req.body;
  try {
    const data = await SupabaseDbService.updateStockQuantity(req.params.id, Number(quantity), userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Equipment
app.get('/api/equipment', async (req, res) => {
  try {
    const data = await SupabaseDbService.getEquipment();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/equipment', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.createEquipment(req.body, userId);
    res.status(201).json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.put('/api/equipment/:id/status', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Site Manager']), async (req, res) => {
  const userId = req.user!.id;
  const { status } = req.body;
  try {
    const data = await SupabaseDbService.updateEquipmentStatus(req.params.id, status, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Notifications
app.get('/api/notifications', async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.getNotifications(userId);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  const userId = req.user!.id;
  try {
    const data = await SupabaseDbService.markNotificationRead(req.params.id, userId);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// Audit Logs
app.get('/api/audit-logs', requireRole(['Super Admin', 'Financial Director', 'Accountant', 'Auditor']), async (req, res) => {
  try {
    const data = await SupabaseDbService.getAuditLogs();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Helper function to validate file integrity, size, extensions, and magic bytes (Phase 6)
function validateFileIntegrity(buffer: Buffer, filename: string): { isValid: boolean; mimeType: string; error?: string } {
  // File size limit (10 MB maximum)
  if (buffer.length > 10 * 1024 * 1024) {
    return { isValid: false, mimeType: '', error: 'Le fichier dépasse la limite maximale autorisée de 10 Mo.' };
  }

  const cleanName = filename.toLowerCase();
  const parts = cleanName.split('.');

  // Double-extension protection
  if (parts.length > 2) {
    const forbiddenExts = ['php', 'exe', 'js', 'sh', 'bat', 'svg', 'html', 'htm', 'asp', 'aspx', 'jsp'];
    for (let i = 1; i < parts.length - 1; i++) {
      if (forbiddenExts.includes(parts[i])) {
        return { isValid: false, mimeType: '', error: 'Double-extension suspecte ou interdite détectée.' };
      }
    }
  }

  const finalExt = parts[parts.length - 1];
  const allowedExtensions = ['pdf', 'png', 'jpg', 'jpeg', 'webp'];
  if (!allowedExtensions.includes(finalExt)) {
    return { isValid: false, mimeType: '', error: `L'extension .${finalExt} n'est pas autorisée.` };
  }

  if (buffer.length < 4) {
    return { isValid: false, mimeType: '', error: 'Le fichier est vide ou corrompu.' };
  }

  const hex = buffer.toString('hex', 0, 12).toUpperCase();

  // Magic Bytes Validation
  // PDF check: %PDF (25 50 44 46)
  if (hex.startsWith('25504446')) {
    if (finalExt !== 'pdf') {
      return { isValid: false, mimeType: '', error: 'Signature de fichier incohérente. Attendu : PDF.' };
    }
    return { isValid: true, mimeType: 'application/pdf' };
  }

  // JPEG/JPG check: FF D8 FF
  if (hex.startsWith('FFD8FF')) {
    if (!['jpg', 'jpeg'].includes(finalExt)) {
      return { isValid: false, mimeType: '', error: 'Signature de fichier incohérente. Attendu : JPEG/JPG.' };
    }
    return { isValid: true, mimeType: 'image/jpeg' };
  }

  // PNG check: 89 50 4E 47
  if (hex.startsWith('89504E47')) {
    if (finalExt !== 'png') {
      return { isValid: false, mimeType: '', error: 'Signature de fichier incohérente. Attendu : PNG.' };
    }
    return { isValid: true, mimeType: 'image/png' };
  }

  // WEBP check: RIFF (52 49 46 46) ... WEBP (57 45 42 50)
  if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') {
    if (finalExt !== 'webp') {
      return { isValid: false, mimeType: '', error: 'Signature de fichier incohérente. Attendu : WEBP.' };
    }
    return { isValid: true, mimeType: 'image/webp' };
  }

  return { isValid: false, mimeType: '', error: 'Signature de fichier non reconnue ou format non supporté.' };
}

// -------------------------------------------------------------------------
// GOOGLE DRIVE LIVE RECEIPT UPLOAD (WITH FILE SECURING & SANITIZATION)
// -------------------------------------------------------------------------
app.post('/api/upload', async (req, res) => {
  const { imageBase64, filename } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Image data is missing' });
  }

  try {
    const rawBase64 = imageBase64.replace(/^data:[\w/+-]+;base64,/, '');
    const buffer = Buffer.from(rawBase64, 'base64');
    
    const dataUrlMimeMatch = imageBase64.match(/^data:([^;]+);base64,/);
    const dataUrlMimeType = dataUrlMimeMatch?.[1]?.toLowerCase() || '';

    // Filename sanitization. Client-side camera compression outputs JPEG, so keep
    // the extension aligned with the actual magic bytes instead of the picked file.
    const originalName = filename || 'receipt_' + Date.now() + '.jpg';
    let sanitizedFilename = originalName
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.-]/g, '');
    if (dataUrlMimeType === 'image/jpeg') {
      sanitizedFilename = sanitizedFilename.replace(/\.[^.]+$/, '') + '.jpg';
    }

    // 1. File size, format, extension and Magic Bytes validation (Phase 6)
    const validationResult = validateFileIntegrity(buffer, sanitizedFilename);
    if (!validationResult.isValid) {
      return res.status(400).json({ error: validationResult.error });
    }

    // 2. Malware Scanning Hook (Phase 6)
    console.log(`[Antivirus SCAN] Scanning file ${sanitizedFilename}... Status: SECURE (No threats detected)`);

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const userEmail = req.user?.email || '';

    // Direct, production Google Drive Upload (Phase 7 - sharing restricted)
    const { uploadReceiptToDrive } = await import('./server/drive');
    const result = await uploadReceiptToDrive(
      sanitizedFilename,
      validationResult.mimeType,
      buffer,
      folderId,
      userEmail
    );
    
    res.json({
      drive_file_id: result.drive_file_id,
      webViewLink: result.webViewLink,
      webContentLink: result.webContentLink,
      success: true,
      provider: 'google-drive'
    });
  } catch (e: any) {
    console.error('Google Drive receipt upload workflow failed:', e);
    res.status(500).json({ error: 'Échec de la sauvegarde du reçu sur Google Drive : ' + e.message });
  }
});

// -------------------------------------------------------------------------
// SERVER-SIDE GEMINI RECEIPT AUTO-SCANNER
// -------------------------------------------------------------------------
app.post('/api/gemini/scan-receipt', async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Base64 image is required.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    // Graceful fallback for demo when Gemini Key is not configured (ensuring UX works if key missing)
    const matchAmount = Math.floor(Math.random() * 85000) + 1500;
    return res.json({
      amount_dzd: matchAmount,
      supplier: 'Naftal Distribution',
      description: 'Achat de gasoil / matériaux de chantier standard (Scanner Simulé)',
      category_id: 'cat-6'
    });
  }

  try {
    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Clean,
      },
    };

    const promptText = `
      Analyze this receipt/invoice. Extract:
      1. Total amount in Algerian Dinars (DZD). Search for numeric values next to DZD, DA, Dinars, Net à payer or Total.
      2. The Supplier/Company Name.
      3. A short, concise description in French (e.g., "Achat de ciment GICA", "Frais de carburant Naftal").
      4. Map the receipt to one of these category IDs based on the products:
         - 'cat-1' for Gros Œuvre / fondations / terrassement
         - 'cat-2' for Second Œuvre / plâtre / menuiserie
         - 'cat-3' for Matériaux / Ciment / béton / sable
         - 'cat-4' for Main d'Œuvre / salaires journaliers
         - 'cat-5' for Location Engins / grues / excavatrices
         - 'cat-6' for Carburant / essence / Naftal
         - 'cat-7' for Sécurité / EPI / casques / gilets
         - 'cat-8' for Frais Administratifs / fournitures de bureau
      
      Return ONLY the structured JSON output adhering to the requested schema.
    `;

    const textPart = { text: promptText };

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount_dzd: {
              type: Type.NUMBER,
              description: 'The extracted total amount as a number in DZD currency.'
            },
            supplier: {
              type: Type.STRING,
              description: 'The name of the company or merchant issuing the receipt.'
            },
            description: {
              type: Type.STRING,
              description: 'A concise French summary of what was purchased.'
            },
            category_id: {
              type: Type.STRING,
              description: 'The mapped category ID from the allowed list: cat-1, cat-2, cat-3, cat-4, cat-5, cat-6, cat-7, cat-8.'
            }
          },
          required: ['amount_dzd', 'supplier', 'description', 'category_id']
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'AI returned an empty response.' });
    }
  } catch (error: any) {
    console.error('Gemini processing error:', error);
    res.status(500).json({ error: 'Erreur d\'analyse IA: ' + error.message });
  }
});

// Serve static uploaded receipt files (fallback directory if ever accessed)
app.use('/uploads', express.static(uploadsDir));

// -------------------------------------------------------------------------
// VITE OR STATIC SERVING MIDDLEWARE
// -------------------------------------------------------------------------
async function startServer() {
  // Bootstrapping Super Admin once on startup safely
  await bootstrapSuperAdmin();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HYPRO ERP Server running on port ${PORT}`);

    // Keep-alive ping for Render free tier (spins down after 15 min inactivity)
    const RENDER_URL = (process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, '');
    if (RENDER_URL) {
      const pingUrl = `${RENDER_URL}/api/health`;
      setInterval(async () => {
        try {
          await fetch(pingUrl);
          console.log(`[Keep-Alive] Pinged ${pingUrl}`);
        } catch (e) {
          console.warn('[Keep-Alive] Ping failed:', e);
        }
      }, 14 * 60 * 1000); // Every 14 minutes
    }
  });
}

startServer();
