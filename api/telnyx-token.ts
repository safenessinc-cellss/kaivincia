import type { IncomingMessage, ServerResponse } from 'http';
import { TelnyxBackendService } from '../server/telnyxBackend.js';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Inicializar Firebase Admin a nivel de módulo (obligatorio en Vercel serverless)
if (!getApps().length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}');
    initializeApp({ credential: cert(serviceAccount) });
    console.log('[telnyx-token] Firebase Admin inicializado');
  } catch (err) {
    console.error('[telnyx-token] Error inicializando Firebase Admin:', err);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader);

    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No autorizado. Se requiere token de Firebase.' }));
      return;
    }

    console.log('[telnyx-token] Usuario autenticado:', authUser.uid, authUser.email);

    const db = getFirestore();
    const operadorDoc = await db.collection('operadores').doc(authUser.uid).get();

    let operadorData: any;
    let credentialId: string;
    let sipUsername: string;

    if (!operadorDoc.exists) {
      console.log('[telnyx-token] Operador no existe, creando...');
      const connectionId = (req.query?.connectionId as string) || process.env.TELNYX_CONNECTION_ID || '';
      const credential = await TelnyxBackendService.getOrCreateTelephonyCredential(authUser.uid, connectionId);

      operadorData = {
        id: authUser.uid,
        email: authUser.email || '',
        nombre: authUser.email?.split('@')[0] || 'Operador',
        rol: 'agente',
        telnyxCredentialId: credential.id,
        telnyxUsername: credential.sip_username,
        numerosAsignados: [],
        horario: {
          inicio: '00:00',
          fin: '23:59',
          zonaHoraria: 'America/Los_Angeles',
          diasLaborables: ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'],
        },
        disponible: false,
        enLlamada: false,
        permiteSalientes: true,
        permiteEntrantes: true,
        activo: true,
        creadoEn: new Date().toISOString(),
      };

      await db.collection('operadores').doc(authUser.uid).set(operadorData);
      credentialId = credential.id;
      sipUsername = credential.sip_username;
    } else {
      operadorData = operadorDoc.data();
      credentialId = operadorData.telnyxCredentialId;
      sipUsername = operadorData.telnyxUsername;

      if (!credentialId) {
        console.log('[telnyx-token] Operador sin credencial, creando...');
        const connectionId = (req.query?.connectionId as string) || process.env.TELNYX_CONNECTION_ID || '';
        const credential = await TelnyxBackendService.getOrCreateTelephonyCredential(authUser.uid, connectionId);
        credentialId = credential.id;
        sipUsername = credential.sip_username;

        await db.collection('operadores').doc(authUser.uid).update({
          telnyxCredentialId: credentialId,
          telnyxUsername: sipUsername,
          actualizadoEn: new Date().toISOString(),
        });
      }
    }

    if (operadorData.rol !== 'admin' && operadorData.rol !== 'supervisor') {
      const enHorario = verificarHorario(operadorData.horario);
      if (!enHorario) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          error: 'Fuera de horario laboral. Contacta a tu supervisor.',
          horario: operadorData.horario,
        }));
        return;
      }
    }

    if (operadorData.activo === false) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Cuenta desactivada. Contacta al administrador.' }));
      return;
    }

    console.log('[telnyx-token] Generando JWT para credencial:', credentialId);
    const token = await TelnyxBackendService.generateAgentJwt(credentialId);

    await db.collection('operadores').doc(authUser.uid).update({
      disponible: true,
      ultimaActividad: new Date().toISOString(),
    });

    const numerosAsignados: any[] = [];
    if (operadorData.numerosAsignados && operadorData.numerosAsignados.length > 0) {
      for (const numId of operadorData.numerosAsignados) {
        const numDoc = await db.collection('telnyx_phone_numbers').doc(numId).get();
        if (numDoc.exists) {
          numerosAsignados.push({ id: numDoc.id, ...numDoc.data() });
        }
      }
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      token,
      sipUsername,
      credentialId,
      connectionId: process.env.TELNYX_CONNECTION_ID || '',
      operador: {
        uid: authUser.uid,
        nombre: operadorData.nombre,
        rol: operadorData.rol,
        horario: operadorData.horario,
      },
      numerosAsignados,
      allowedNumbers: numerosAsignados.map((n) => n.phoneNumber),
    }));
  } catch (err: any) {
    console.error('[API /api/telnyx-token] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Error interno al generar credenciales de Telnyx' }));
  }
}

function verificarHorario(horario: any): boolean {
  if (!horario || !horario.inicio || !horario.fin) return true;
  try {
    const zonaHoraria = horario.zonaHoraria || 'America/Los_Angeles';
    const ahora = new Date().toLocaleString('en-US', { timeZone: zonaHoraria });
    const fecha = new Date(ahora);
    const horaActual = fecha.getHours() * 60 + fecha.getMinutes();
    const [inicioH, inicioM] = horario.inicio.split(':').map(Number);
    const [finH, finM] = horario.fin.split(':').map(Number);
    const horaInicio = inicioH * 60 + inicioM;
    const horaFin = finH * 60 + finM;

    if (horario.diasLaborables && Array.isArray(horario.diasLaborables)) {
      const diasMap = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
      const diaActual = diasMap[fecha.getDay()];
      if (!horario.diasLaborables.includes(diaActual)) return false;
    }

    if (horaFin < horaInicio) return horaActual >= horaInicio || horaActual <= horaFin;
    return horaActual >= horaInicio && horaActual <= horaFin;
  } catch (err) {
    console.error('[verificarHorario] Error:', err);
    return true;
  }
}
