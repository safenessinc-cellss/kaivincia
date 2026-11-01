import { adminDb  , isFirebaseAdminConfigured } from '../server/_lib/firebaseAdmin.js';
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

    // Agents require an exclusive assignment. Privileged users receive account-wide
    // call visibility, but use a dedicated/unassigned admin credential rather than
    // borrowing a credential currently assigned to an agent.
    const isPrivileged = PRIVILEGED_ROLES.has(role);
    const operatorSnap = await adminDb.collection('operadores').doc(authUser.uid).get();
    const operator = operatorSnap.exists ? (operatorSnap.data() || {}) : {};
    let credentialId = String(operator.telnyxCredentialId || '');

    if (!isPrivileged && (!operatorSnap.exists || operator.activo !== true || !credentialId)) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'No tienes un operador VoIP activo con credencial SIP asignada. Solicita la asignación a un administrador.' }));
      return;
    }
    if (!isPrivileged && operator.permiteSalientes !== true && operator.permiteEntrantes !== true) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'El operador no tiene permisos de llamadas.' }));
      return;
    }
    if (!isPrivileged && !verificarHorario(operator.horario)) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Fuera del horario laboral asignado.' }));
      return;
    }

    // A superadmin may use the configured admin credential or a single unassigned
    // active credential. Never select an agent-owned SIP credential implicitly.
    if (isPrivileged) {
      const configSnap = await adminDb.collection('settings').doc('telnyx_config').get();
      const config = configSnap.data() || {};
      const configuredAdminCredential = String(
        config.adminCredentialId || config.defaultAdminCredentialId || ''
      ).trim();
      if (configuredAdminCredential) credentialId = configuredAdminCredential;

      if (!credentialId) {
        const unassignedSnap = await adminDb.collection('telnyx_sip_credentials')
          .where('activo', '==', true).get();
        const unassigned = unassignedSnap.docs.filter((snap: any) => {
          const data = snap.data() || {};
          const assigned = data.assignedTo || data.operadorUid || null;
          const state = String(data.status || 'active').toLowerCase();
          return !assigned && !['inactive', 'disabled', 'revoked', 'deleted'].includes(state);
        });
        if (unassigned.length === 1) credentialId = unassigned[0].id;
      }
    }

    if (!credentialId) {
      res.statusCode = 409;
      res.end(JSON.stringify({ error: 'Falta asignar una credencial SIP exclusiva al superadministrador. En Administración VoIP, configura el ID en settings/telnyx_config.adminCredentialId o deja una única credencial activa sin asignar.' }));
      return;
    }
    let credentialSnap = await adminDb.collection('telnyx_sip_credentials').doc(credentialId).get();
    if (!credentialSnap.exists) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'La credencial SIP no está registrada en el CRM. Reasígnala desde la administración VoIP.' }));
      return;
    }
    let credential = credentialSnap.data() || {};
    let assignedUid = credential.assignedTo || credential.operadorUid || null;

    // If a legacy operator profile points at an agent-owned credential, recover
    // only when there is exactly one separate active, unassigned admin credential.
    if (isPrivileged && assignedUid && assignedUid !== authUser.uid) {
      const candidatesSnap = await adminDb.collection('telnyx_sip_credentials')
        .where('activo', '==', true).get();
      const candidates = candidatesSnap.docs.filter((snap: any) => {
        if (snap.id === credentialId) return false;
        const data = snap.data() || {};
        const owner = data.assignedTo || data.operadorUid || null;
        const state = String(data.status || 'active').toLowerCase();
        return !owner && state === 'active' && data.activo === true;
      });
      if (candidates.length === 1) {
        credentialId = candidates[0].id;
        credentialSnap = candidates[0] as any;
        credential = credentialSnap.data() || {};
        assignedUid = credential.assignedTo || credential.operadorUid || null;
      }
    }

    const directAssignment = isPrivileged
      ? null
      : await adminDb.collection('telnyx_agent_assignments').doc(authUser.uid).get();
    const assignmentQuery = isPrivileged ? null : await adminDb.collection('telnyx_agent_assignments')
      .where('telnyxCredentialId', '==', credentialId).limit(2).get();
    const matchingAssignments = assignmentQuery?.docs || [];
    const uniqueReverseAssignment = matchingAssignments.length === 1 &&
      matchingAssignments[0].data()?.agentId === authUser.uid;
    const directAssignmentData = directAssignment?.exists ? (directAssignment.data() || {}) : {};
    const directAssignmentMatches = Boolean(directAssignment?.exists) &&
      directAssignmentData.agentId === authUser.uid &&
      directAssignmentData.telnyxCredentialId === credentialId;

    if (isPrivileged) {
      if (assignedUid && assignedUid !== authUser.uid) {
        res.statusCode = 403;
        res.end(JSON.stringify({ error: 'Esta credencial pertenece a un agente. Asigna una credencial SIP independiente al superadministrador para mantener sesiones aisladas.' }));
        return;
      }
    } else if (
      (assignedUid !== null && assignedUid !== authUser.uid) ||
      matchingAssignments.length > 1 ||
      (matchingAssignments.length === 1 && !uniqueReverseAssignment) ||
      (!uniqueReverseAssignment && !directAssignmentMatches)
    ) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'La credencial SIP no está asignada exclusivamente a este operador. Revisa la asignación desde Administración VoIP.' }));
      return;
    }

    // Legacy imported credentials only stored activo=true (no status field).
    // Treat that shape as active, but continue to reject explicit inactive states.
    const credentialStatus = String(credential.status || (credential.activo === true ? 'active' : 'inactive')).toLowerCase();
    if (credentialStatus !== 'active' || credential.activo === false) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'La credencial SIP está desactivada o no tiene un estado válido.' }));
      return;
    }

    if (!isPrivileged && assignedUid === null && uniqueReverseAssignment) {
      await credentialSnap.ref.update({
        assignedTo: authUser.uid,
        assignedToEmail: authUser.email || '',
        updatedAt: new Date().toISOString(),
      });
    }

    const token = await TelnyxBackendService.generateAgentJwt(credentialId);
    const numberIds: string[] = Array.isArray(operator.numerosAsignados)
      ? operator.numerosAsignados.filter((id: unknown): id is string => typeof id === 'string')
      : [];
    const assignment = isPrivileged
      ? {}
      : (directAssignment?.exists
        ? directAssignmentData
        : (await adminDb.collection('telnyx_agent_assignments').where('agentId', '==', authUser.uid).limit(1).get()).docs[0]?.data() || {});
    const assignedPhones: string[] = Array.isArray(assignment.authorizedNumbers)
      ? assignment.authorizedNumbers.filter((value: unknown): value is string => typeof value === 'string')
      : [];
    const inventory = await adminDb.collection('telnyx_phone_numbers').get();
    const numbers = inventory.docs
      .filter((snap: any) => {
        const data = snap.data() || {};
        const phone = data.phoneNumber || data.phone_number || '';
        const status = String(data.status || '').toLowerCase();
        const isUsable = !['disabled', 'deleted', 'inactive', 'released'].includes(status);
        if (!isUsable) return false;
        if (isPrivileged) return true;
        return numberIds.includes(snap.id) || assignedPhones.includes(phone);
      })
      .map((snap: any) => {
        const data = snap.data() || {};
        return { id: snap.id, phoneNumber: data.phoneNumber || data.phone_number || '', status: data.status || 'unknown' };
      })
      .filter((item: any) => Boolean(item.phoneNumber));

    if (operatorSnap.exists) {
      await adminDb.collection('operadores').doc(authUser.uid).update({
        disponible: true,
        ultimaActividad: new Date().toISOString(),
      });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      token,
      sipUsername: operator.telnyxUsername || credential.telnyxUsername || credential.username || '',
      credentialId,
      connectionId: operator.connectionId || credential.connectionId || process.env.TELNYX_CONNECTION_ID || '',
      operador: { uid: authUser.uid, nombre: operator.nombre || profile.name || authUser.email || 'Operador', rol: role },
      permissions: {
        outbound: isPrivileged || operator.permiteSalientes === true,
        inbound: isPrivileged || operator.permiteEntrantes === true
      },
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
  // Account-level administrators retain full calling access even if a
  // legacy per-user override accidentally denies the voip_calls capability.
  if (PRIVILEGED_ROLES.has(role)) return true;
  const override = profile.permissions?.voip_calls;
  if (typeof override === 'boolean') return override;
  const matrixSnap = await adminDb.collection('settings').doc('rbac_matrix').get();
  const matrix = matrixSnap.data()?.matrix || {};
  const roleMatrix = matrix[role] || (role === 'agent' ? matrix.sales : undefined);
  const matrixValue = roleMatrix?.voip_calls;
  if (typeof matrixValue === 'boolean') return matrixValue;
  return ['superadmin', 'admin', 'owner', 'ceo', 'gestor', 'supervisor', 'agent', 'collaborator'].includes(role);
}
