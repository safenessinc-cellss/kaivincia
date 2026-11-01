import { adminDb } , isFirebaseAdminConfigured } from '../server/_lib/firebaseAdmin.js';
import { TelnyxBackendService } from '../server/telnyxBackend.js';

const PRIVILEGED_ROLES = new Set(['superadmin', 'admin', 'owner', 'ceo', 'gestor']);
const CONFIG_ROLES = new Set(['superadmin', 'admin']);
const VOIP_ROLES = new Set([
  ...PRIVILEGED_ROLES, 'supervisor', 'agent', 'collaborator'
]);
const normalizeRole = (value: unknown) => {
  const raw = String(value || '').toLowerCase().trim();
  return ({ sales: 'agent', ventas: 'agent', tlmk: 'agent', telemarketing: 'agent', setter: 'agent', closer: 'agent', agente: 'agent', operador: 'agent', call_agent: 'agent' } as Record<string, string>)[raw] || raw;
};

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    res.end(JSON.stringify({ success: false, numbers: [], error: 'Method Not Allowed' }));
    return;
  }

  if (!isFirebaseAdminConfigured) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Firebase Admin no está configurado para este entorno.' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader);
    if (!authUser?.uid) {
      res.statusCode = 401;
      res.end(JSON.stringify({ success: false, numbers: [], error: 'Sesión no válida.' }));
      return;
    }

    const profileSnap = await adminDb.collection('users').doc(authUser.uid).get();
    const profile = profileSnap.data() || {};
    const role = normalizeRole(profile.role);
    const permissionGranted = CONFIG_ROLES.has(role)
      ? await hasTelephonyConfigPermission(profile, role)
      : await hasVoipPermission(authUser.uid, profile, role);
    if (!profileSnap.exists || !['approved', 'active'].includes(String(profile.status || '').toLowerCase()) || !VOIP_ROLES.has(role) || !permissionGranted) {
      res.statusCode = 403;
      res.end(JSON.stringify({ success: false, numbers: [], error: 'Cuenta sin autorización para telefonía.' }));
      return;
    }

    if (PRIVILEGED_ROLES.has(role)) {
      const result = await TelnyxBackendService.getAccountPhoneNumbers();
      res.statusCode = result.success ? 200 : 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
      return;
    }

    const operatorSnap = await adminDb.collection('operadores').doc(authUser.uid).get();
    const operator = operatorSnap.data() || {};
    if (!operatorSnap.exists || operator.activo === false) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, numbers: [], message: 'No hay números asignados a este operador.' }));
      return;
    }

    const assignmentDoc = await adminDb.collection('telnyx_agent_assignments').doc(authUser.uid).get();
    const assignmentQuery = await adminDb.collection('telnyx_agent_assignments').where('agentId', '==', authUser.uid).limit(1).get();
    const assignment = assignmentDoc.exists ? (assignmentDoc.data() || {}) : (assignmentQuery.docs[0]?.data() || {});
    const assignedPhones: string[] = Array.isArray(assignment.authorizedNumbers)
      ? assignment.authorizedNumbers.filter((value: unknown): value is string => typeof value === 'string')
      : [];
    const assignedIds: string[] = Array.isArray(operator.numerosAsignados)
      ? operator.numerosAsignados.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const inventory = await adminDb.collection('telnyx_phone_numbers').get();
    const numbers = inventory.docs.filter((snap: any) => {
      const data = snap.data() || {};
      const phone = data.phoneNumber || data.phone_number || '';
      const status = String(data.status || '').toLowerCase();
      const isUsable = !['disabled', 'deleted', 'inactive', 'released'].includes(status);
      return isUsable && (assignedIds.includes(snap.id) || assignedPhones.includes(phone));
    })
      .filter((snap: any) => snap.exists)
      .map((snap: any) => {
        const data = snap.data() || {};
        return {
          id: snap.id,
          phone_number: data.phoneNumber || data.phone_number || '',
          status: data.status || 'unknown',
          connection_id: data.connectionId || data.connection_id || undefined
        };
      })
      .filter((number: any) => Boolean(number.phone_number));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, numbers }));
  } catch (error: any) {
    console.error('[telnyx-numbers] Request failed:', error?.message || 'unknown error');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, numbers: [], error: 'No fue posible consultar los números telefónicos.' }));
  }
}


async function hasVoipPermission(uid: string, profile: any, role: string): Promise<boolean> {
  const override = profile.permissions?.voip_calls;
  if (typeof override === 'boolean') return override;
  const matrixSnap = await adminDb.collection('settings').doc('rbac_matrix').get();
  const matrix = matrixSnap.data()?.matrix || {};
  const roleMatrix = matrix[role] || (role === 'agent' ? matrix.sales : undefined);
  const matrixValue = roleMatrix?.voip_calls;
  if (typeof matrixValue === 'boolean') return matrixValue;
  return ['superadmin', 'admin', 'owner', 'ceo', 'gestor', 'supervisor', 'agent', 'collaborator'].includes(role);
}


async function hasTelephonyConfigPermission(profile: any, role: string): Promise<boolean> {
  const override = profile.permissions?.telephony_config;
  if (typeof override === 'boolean') return override;
  const matrixSnap = await adminDb.collection('settings').doc('rbac_matrix').get();
  const matrixValue = matrixSnap.data()?.matrix?.[role]?.telephony_config;
  if (typeof matrixValue === 'boolean') return matrixValue;
  return CONFIG_ROLES.has(role);
}
