import { Request, Response, NextFunction } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabase, getServiceRoleSupabase, supabaseClientLS } from '../supabase';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      supabase?: SupabaseClient;
    }
  }
}

/**
 * ZERO TRUST JWT AUTHENTICATION MIDDLEWARE
 * Extracts and verifies Supabase JWT. Ignores client-supplied identity fields.
 */
export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé. Token Bearer manquant.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const rawUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (!rawUrl || !supabaseAnonKey) {
      return res.status(500).json({ error: 'Variables d\'environnement Supabase non configurées.' });
    }
    const supabaseUrl = rawUrl.trim().replace(/\/$/, '');

    // 1. Initialize a lightweight client for JWT verification
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 2. Validate token and get user from Supabase Auth
    const { data: { user }, error: authError } = await verifyClient.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Session expirée ou token invalide.' });
    }

    // 3. Resolve real user role from profiles table (via service role to bypass RLS during authentication phase)
    const supabaseAdmin = getServiceRoleSupabase();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(403).json({ error: 'Profil ERP introuvable.' });
    }

    // 4. Attach secure context to request (ignoring any user-supplied identities)
    req.user = {
      id: user.id,
      email: profile.email || user.email || '',
      role: profile.role
    };

    // 5. Create a per-request Supabase client with authenticated user JWT
    const reqClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    req.supabase = reqClient;

    // 6. Run downstream handlers in AsyncLocalStorage context so getSupabase() yields this per-request client
    supabaseClientLS.run(reqClient, () => {
      next();
    });

  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur d\'authentification : ' + err.message });
  }
}

/**
 * CENTRALIZED ROLE-BASED AUTHORIZATION MIDDLEWARE
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }

    const { role } = req.user;

    // Auditor cannot perform write operations (POST, PUT, DELETE)
    if (role === 'Auditor' && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ error: 'Accès interdit. Les auditeurs disposent uniquement d\'un droit de lecture.' });
    }

    // Site Manager cannot access other financial modules or settings
    if (role === 'Site Manager' && req.path.includes('/settings')) {
      return res.status(403).json({ error: 'Accès interdit. Les chefs de projet ne peuvent modifier les paramètres financiers.' });
    }

    // Financial Director cannot become Super Admin / modify admin users
    if (role === 'Financial Director' && req.path.includes('/admin/users') && req.method !== 'GET') {
      return res.status(403).json({ error: 'Accès interdit. Les Directeurs Financiers ne peuvent pas gérer les comptes administrateurs.' });
    }

    // Accountant cannot manage contracts
    if (role === 'Accountant' && req.path.includes('/contracts') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return res.status(403).json({ error: 'Accès interdit. Les Comptables ne peuvent pas modifier les contrats.' });
    }

    // Employee cannot approve expenses, create allocations, contracts, or view audit logs
    if (role === 'Employee') {
      if (req.path.includes('/expenses') && req.path.includes('/status')) {
        return res.status(403).json({ error: 'Accès interdit. Les employés ne peuvent pas approuver d\'essais financiers.' });
      }
      if (req.path.includes('/allocations') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return res.status(403).json({ error: 'Accès interdit. Les employés ne peuvent pas créer d\'allocations.' });
      }
      if (req.path.includes('/contracts') && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        return res.status(403).json({ error: 'Accès interdit. Les employés ne peuvent pas créer de contrats.' });
      }
      if (req.path.includes('/audit-logs')) {
        return res.status(403).json({ error: 'Accès interdit. Les employés n\'ont pas accès aux journaux d\'audit.' });
      }
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: `Accès interdit. Rôle(s) autorisé(s) : ${allowedRoles.join(', ')}.` });
    }

    next();
  };
}

/**
 * PROJECT-ASSIGNMENT LEVEL AUTHORIZATION MIDDLEWARE
 */
export async function requireProjectAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }

  // Retrieve project ID from request parameters, body, or query
  const projectId = req.params.projectId || req.params.id || req.body.project_id || req.query.project_id;
  if (!projectId) {
    return next();
  }

  // Super Admin, Financial Director, Accountant, and Auditor bypass project assignment checks
  const bypassRoles = ['Super Admin', 'Financial Director', 'Accountant', 'Auditor'];
  if (bypassRoles.includes(req.user.role)) {
    return next();
  }

  try {
    const supabase = getSupabase();
    // Invoke the PostgreSQL is_project_assigned_to_user function
    const { data: hasAccess, error } = await supabase.rpc('is_project_assigned_to_user', {
      p_id: projectId,
      u_id: req.user.id
    });

    if (error || !hasAccess) {
      return res.status(403).json({ error: 'Accès refusé. Vous n\'êtes pas affecté à ce projet de chantier.' });
    }

    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur de vérification d\'affectation de projet : ' + err.message });
  }
}

/**
 * REQUIRING OWNERSHIP OR PRIVILEGED ACCESS (e.g. for User Preferences or specific records)
 */
export function requireOwnershipOrPrivileged(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentification requise.' });
  }

  const resourceUserId = req.params.userId || req.body.user_id;
  if (!resourceUserId) {
    return next();
  }

  const { id: authUserId, role } = req.user;
  if (authUserId === resourceUserId || ['Super Admin', 'Financial Director'].includes(role)) {
    return next();
  }

  return res.status(403).json({ error: 'Accès interdit. Propriétaire ou administrateur requis.' });
}
