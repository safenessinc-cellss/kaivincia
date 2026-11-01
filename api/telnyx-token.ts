import { adminDb } from '../server/_lib/firebaseAdmin.js';
import { TelnyxBackendService } from '../server/telnyxBackend.js';

const ALLOWED_VOIP_ROLES = new Set([
  'superadmin', 'admin', 'owner', 'ceo', 'gestor',
  'supervisor', 'agent', 'collaborator'
]);
const normalizeRole = (value: unknown) => {
  const raw = String(value || '').toLowerCase().trim();
  return ({ sales: 'agent', ventas: 'agent', tlmk: 'agent', telemarketing: 'agent', setter: 'agent', closer: 'agent', agente: 'agent', operador: 'agent', call_agent: 'agent' } as Record<string, string>)[raw] || raw;
};
const PRIVILEGED_ROLES = new Set(['superadmin', 'admin', 'owner', 'ceo', 'gestor']);

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Authorization');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader);
    if (!authUser?.uid) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'Se requiere una sesión válida de Firebase.' }));
      return;
    }

    const userSnap = await adminDb.collection('users').doc(authUser.uid).get();
    if (!userSnap.exists) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Perfil de usuario no provisionado.' }));
      return;
    }

    const profile = userSnap.data() || {};
    const status = String(profile.status || '').toLowerCase();
    const role = normalizeRole(profile.role);
    if (!['approved', 'active'].includes(status) || !ALLOWED_VOIP_ROLES.has(role) || !(await hasVoipPermission(authUser.uid, profile, role))) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'La cuenta no está aprobada o no tiene permiso de telefonía.' }));
      return;
    }

    // An operator and credential must be assigned by an administrator.
    // Never create a Telnyx credential merely because someone authenticated.
    const operatorSnap = await adminDb.collection('operadores').doc(authUser.uid).get();
    if (!operatorSnap.exists) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'No tienes un operador VoIP asignado. Solicita la asignación a un administrador.' }));
      return;
    }
    const operator = operatorSnap.data() || {};
    if (operator.activo === false || !operator.telnyxCredentialId) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Operador desactivado o sin credencial SIP asignada.' }));
      return;
    }
    if (operator.permiteSalientes === false && operator.permiteEntrantes === false) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'El operador no tiene permisos de llamadas.' }));
      return;
    }
    if (!PRIVILEGED_ROLES.has(role) && !verificarHorario(operator.horario)) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Fuera del horario laboral asignado.' }));
      return;
    }

    const credentialId = String(operator.telnyxCredentialId);
    const credentialSnap = await adminDb.collection('telnyx_sip_credentials').doc(credentialId).get();
    if (credentialSnap.exists) {
      const credential = credentialSnap.data() || {};
      const assignedUid = credential.assignedTo || credential.operadorUid || null;
      if (assignedUid && assignedUid !== authUser.uid) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'La credencial SIP pertenece a otro operador.' }));
        return;
      }
      if (credential.status === 'inactive' || credential.activo === false) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'La credencial SIP está desactivada.' }));
        return;
      }
    }

    const token = await TelnyxBackendService.generateAgentJwt(credentialId);
    const numberIds: string[] = Array.isArray(operator.numerosAsignados)
      ? operator.numerosAsignados.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const directAssignment = await adminDb.collection('telnyx_agent_assignments').doc(authUser.uid).get();
    const assignmentQuery = await adminDb.collection('telnyx_agent_assignments').where('agentId', '==', authUser.uid).limit(1).get();
    const assignment = directAssignment.exists ? (directAssignment.data() || {}) : (assignmentQuery.docs[0]?.data() || {});
    const assignedPhones: string[] = Array.isArray(assignment.authorizedNumbers)
      ? assignment.authorizedNumbers.filter((value: unknown): value is string => typeof value === 'string')
      : [];
    const inventory = await adminDb.collection('telnyx_phone_numbers').get();
    const numbers = inventory.docs
      .filter((snap: any) => {
        if (PRIVILEGED_ROLES.has(role)) return true;
        const data = snap.data() || {};
        const phone = data.phoneNumber || data.phone_number || '';
        const status = String(data.status || '').toLowerCase();
        const isUsable = !['disabled', 'deleted', 'inactive', 'released'].includes(status);
        return isUsable && (numberIds.includes(snap.id) || assignedPhones.includes(phone));
      })
      .map((snap: any) => {
        const data = snap.data() || {};
        return { id: snap.id, phoneNumber: data.phoneNumber || data.phone_number || '', status: data.status || 'unknown' };
      })
      .filter((item: any) => Boolean(item.phoneNumber));

    await adminDb.collection('operadores').doc(authUser.uid).update({
      disponible: true,
      ultimaActividad: new Date().toISOString(),
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      token,
      sipUsername: operator.telnyxUsername || '',
      credentialId,
      connectionId: operator.connectionId || process.env.TELNYX_CONNECTION_ID || '',
      operador: { uid: authUser.uid, nombre: operator.nombre || profile.name || authUser.email || 'Operador', rol: role },
      numerosAsignados: numbers,
      allowedNumbers: numbers.map((number: any) => number.phoneNumber),
    }));
  } catch (err: any) {
    console.error('[api/telnyx-token] Request rejected:', err?.message || 'unknown error');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'No fue posible obtener las credenciales de telefonía.' }));
  }
}

function verificarHorario(horario: any): boolean {
  if (!horario || !horario.inicio || !horario.fin) return true;
  try {
    const zone = horario.zonaHoraria || 'America/Los_Angeles';
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now);
    const value = (type: string) => parts.find((part) => part.type === type)?.value || '';
    const dayMap: Record<string, string> = { Sun: 'dom', Mon: 'lun', Tue: 'mar', Wed: 'mie', Thu: 'jue', Fri: 'vie', Sat: 'sab' };
    const day = dayMap[value('weekday')];
    if (Array.isArray(horario.diasLaborables) && !horario.diasLaborables.includes(day)) return false;
    const current = Number(value('hour')) * 60 + Number(value('minute'));
    const [startHour, startMinute] = String(horario.inicio).split(':').map(Number);
    const [endHour, endMinute] = String(horario.fin).split(':').map(Number);
    if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return false;
    const start = startHour * 60 + startMinute;
    const end = endHour * 60 + endMinute;
    return end < start ? current >= start || current <= end : current >= start && current <= end;
  } catch {
    return false;
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
  return ['superadmin', 'admin', 'owner', 'ceo', 'gestor', 'agent', 'collaborator'].includes(role);
}
