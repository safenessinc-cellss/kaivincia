import { adminAuth, adminDb } from './_lib/firebaseAdmin.js';

const ADMIN_ROLES = new Set(['superadmin', 'admin', 'owner', 'ceo', 'gestor']);
const ACTIVE_STATUSES = new Set(['active', 'approved']);
const ROLE_ALIASES: Record<string, string> = { agente: 'agent', tlmk: 'agent', telemarketing: 'agent', setter: 'agent', closer: 'agent', operador: 'agent' };

export function bearerToken(req: any): string | null {
  const value = req.headers?.authorization || req.headers?.Authorization;
  if (typeof value !== 'string' || !value.startsWith('Bearer ')) return null;
  const token = value.slice(7).trim();
  return token || null;
}

export async function authorizeCrmRequest(req: any, res: any, options: {
  adminOnly?: boolean;
  requireOperator?: boolean;
} = {}) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ success: false, error: 'Se requiere autenticación Firebase.' });
    return null;
  }

  let decoded: any;
  try {
    decoded = await adminAuth.verifyIdToken(token, true);
  } catch {
    res.status(401).json({ success: false, error: 'Sesión inválida o revocada.' });
    return null;
  }

  const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!userSnap.exists) {
    res.status(403).json({ success: false, error: 'El usuario no tiene un perfil CRM aprobado.' });
    return null;
  }

  const user = userSnap.data() || {};
  const status = String(user.status || '').toLowerCase();
  const storedRole = String(user.role || '').toLowerCase().trim();
  const role = ROLE_ALIASES[storedRole] || storedRole;
  if (!ACTIVE_STATUSES.has(status) || !role || role === 'none' || role === 'user') {
    res.status(403).json({ success: false, error: 'Cuenta pendiente, suspendida o sin rol autorizado.' });
    return null;
  }

  // Supervisores pueden coordinar agentes, pero nunca administrar credenciales,
  // configuración de proveedores ni secretos de integraciones.
  const isAdmin = ADMIN_ROLES.has(role);
  if (options.adminOnly && !isAdmin) {
    res.status(403).json({ success: false, error: 'Se requiere un rol administrativo autorizado.' });
    return null;
  }

  let operator: any = null;
  if (options.requireOperator) {
    const operatorSnap = await adminDb.collection('operadores').doc(decoded.uid).get();
    if (!operatorSnap.exists) {
      res.status(403).json({ success: false, error: 'No existe un operador habilitado. Solicita la asignación al administrador.' });
      return null;
    }
    operator = operatorSnap.data() || {};
    if (operator.activo !== true) {
      res.status(403).json({ success: false, error: 'El operador está desactivado.' });
      return null;
    }
  }

  return { uid: decoded.uid, email: decoded.email || user.email || '', role, user, operator, isAdmin };
}

export function sendMethodNotAllowed(res: any, methods: string[]) {
  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ success: false, error: 'Method Not Allowed' });
}
