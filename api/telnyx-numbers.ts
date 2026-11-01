import { adminDb } from '../server/_lib/firebaseAdmin.js';
import { TelnyxBackendService } from '../server/telnyxBackend.js';

const PRIVILEGED_ROLES = new Set(['superadmin', 'admin', 'owner', 'ceo', 'gestor']);
const VOIP_ROLES = new Set([
  ...PRIVILEGED_ROLES, 'supervisor', 'agent', 'agente', 'tlmk',
  'ventas', 'telemarketing', 'collaborator'
]);

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
    const role = String(profile.role || '').toLowerCase().trim();
    if (!profileSnap.exists || !['approved', 'active'].includes(String(profile.status || '').toLowerCase()) || !VOIP_ROLES.has(role)) {
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
    if (!operatorSnap.exists || operator.activo === false || !Array.isArray(operator.numerosAsignados)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, numbers: [], message: 'No hay números asignados a este operador.' }));
      return;
    }

    const assigned = await Promise.all(
      operator.numerosAsignados
        .filter((id: unknown): id is string => typeof id === 'string')
        .map((id: string) => adminDb.collection('telnyx_phone_numbers').doc(id).get())
    );
    const numbers = assigned
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
