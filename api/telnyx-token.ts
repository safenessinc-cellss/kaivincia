import { adminDb } from '../server/_lib/firebaseAdmin.js';
import { TelnyxBackendService } from '../server/telnyxBackend.js';
import { authorizeCrmRequest } from '../server/authorization.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const principal = await authorizeCrmRequest(req, res, { requireOperator: true });
    if (!principal) return;

    const operadorData = principal.operator;
    if (operadorData.permiteSalientes !== true && operadorData.permiteEntrantes !== true) {
      return res.status(403).json({ error: 'El operador no tiene permisos de telefonía habilitados.' });
    }

    if (operadorData.rol !== 'admin' && operadorData.rol !== 'supervisor') {
      if (!verificarHorario(operadorData.horario)) {
        return res.status(403).json({ error: 'Fuera de horario laboral. Contacta a tu supervisor.', horario: operadorData.horario });
      }
    }

    let credentialId = operadorData.telnyxCredentialId;
    let sipUsername = operadorData.telnyxUsername;
    if (!credentialId) {
      const connectionId = process.env.TELNYX_CONNECTION_ID || '';
      if (!connectionId) return res.status(503).json({ error: 'Falta configurar TELNYX_CONNECTION_ID.' });
      const credential = await TelnyxBackendService.getOrCreateTelephonyCredential(principal.uid, connectionId);
      credentialId = credential.id;
      sipUsername = credential.sip_username;
      await adminDb.collection('operadores').doc(principal.uid).update({
        telnyxCredentialId: credentialId,
        telnyxUsername: sipUsername,
        actualizadoEn: new Date().toISOString(),
      });
    }

    if (!credentialId) return res.status(503).json({ error: 'No se pudo asignar una credencial Telnyx.' });
    const token = await TelnyxBackendService.generateAgentJwt(credentialId);
    await adminDb.collection('operadores').doc(principal.uid).update({
      disponible: true,
      ultimaActividad: new Date().toISOString(),
    });

    const numerosAsignados: any[] = [];
    const assignedIds = Array.isArray(operadorData.numerosAsignados) ? operadorData.numerosAsignados : [];
    for (const numId of assignedIds) {
      const numDoc = await adminDb.collection('telnyx_phone_numbers').doc(String(numId)).get();
      if (numDoc.exists) {
        const number = numDoc.data() || {};
        if (number.status !== 'disabled' && number.phoneNumber) numerosAsignados.push({ id: numDoc.id, ...number });
      }
    }

    return res.status(200).json({
      token, sipUsername, credentialId,
      connectionId: process.env.TELNYX_CONNECTION_ID || '',
      operador: { uid: principal.uid, nombre: operadorData.nombre, rol: operadorData.rol, horario: operadorData.horario },
      numerosAsignados,
      allowedNumbers: numerosAsignados.map((n) => n.phoneNumber),
    });
  } catch (err: any) {
    console.error('[API /api/telnyx-token] Error:', err);
    return res.status(500).json({ error: 'No se pudo generar la credencial Telnyx.' });
  }
}

function verificarHorario(horario: any): boolean {
  if (!horario || !horario.inicio || !horario.fin) return true;
  try {
    const zonaHoraria = horario.zonaHoraria || 'America/Los_Angeles';
    const fecha = new Date(new Date().toLocaleString('en-US', { timeZone: zonaHoraria }));
    const horaActual = fecha.getHours() * 60 + fecha.getMinutes();
    const [inicioH, inicioM] = horario.inicio.split(':').map(Number);
    const [finH, finM] = horario.fin.split(':').map(Number);
    const horaInicio = inicioH * 60 + inicioM;
    const horaFin = finH * 60 + finM;
    if (![horaInicio, horaFin].every(Number.isFinite)) return false;
    if (Array.isArray(horario.diasLaborables)) {
      const diasMap = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
      if (!horario.diasLaborables.includes(diasMap[fecha.getDay()])) return false;
    }
    return horaFin < horaInicio
      ? horaActual >= horaInicio || horaActual <= horaFin
      : horaActual >= horaInicio && horaActual <= horaFin;
  } catch {
    return false;
  }
}
