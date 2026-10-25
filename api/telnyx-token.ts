import type { IncomingMessage, ServerResponse } from 'http';
import * as admin from 'firebase-admin';
import { TelnyxBackendService } from '../server/telnyxBackend';

const CALL_ROLES = new Set(['superadmin', 'admin', 'owner', 'supervisor', 'tlmk', 'ventas', 'agente', 'agent']);
const normalizeRole = (value: unknown) => String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Vary', 'Origin');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') { res.statusCode = 405; res.end(JSON.stringify({ error: 'Method Not Allowed' })); return; }

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader as string);
    if (!authUser?.uid || !admin.apps.length) {
      res.statusCode = 401; res.end(JSON.stringify({ error: 'Sesión no válida. Inicia sesión nuevamente.' })); return;
    }

    const profileSnap = await admin.firestore().collection('users').doc(authUser.uid).get();
    if (!profileSnap.exists) {
      res.statusCode = 403; res.end(JSON.stringify({ error: 'Perfil pendiente de aprobación.' })); return;
    }
    const profile: any = profileSnap.data() || {};
    const status = String(profile.status ?? '').trim().toLowerCase();
    const role = normalizeRole(profile.role);
    const legacyPrivileged = ['superadmin', 'admin', 'owner'].includes(role) && status === 'active';
    if (['blocked', 'suspended', 'rejected'].includes(status)) {
      res.statusCode = 403; res.end(JSON.stringify({ error: 'Acceso bloqueado. Contacta a un administrador.' })); return;
    }
    if (status !== 'approved' && !legacyPrivileged) {
      res.statusCode = 403; res.end(JSON.stringify({ error: 'Tu cuenta está pendiente de aprobación.' })); return;
    }
    if (!role || !CALL_ROLES.has(role)) {
      res.statusCode = 403; res.end(JSON.stringify({ error: 'Tu rol no permite utilizar telefonía.' })); return;
    }

    // Never accept a caller-supplied connection ID: it could mint credentials on an
    // arbitrary connection. The server's configured connection is authoritative.
    const connectionId = process.env.TELNYX_CONNECTION_ID || '';
    if (!connectionId) {
      res.statusCode = 503; res.end(JSON.stringify({ error: 'Telefonía no configurada: falta TELNYX_CONNECTION_ID.' })); return;
    }

    const credential = await TelnyxBackendService.getOrCreateTelephonyCredential(authUser.uid, connectionId);
    const token = await TelnyxBackendService.generateAgentJwt(credential.id);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ token, sipUsername: credential.sip_username, credentialId: credential.id, connectionId, allowedNumbers: [] }));
  } catch (err: any) {
    // Do not return provider errors, API responses, or credentials to the client.
    console.error('[api/telnyx-token] Failed to issue WebRTC token');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'No se pudo generar la sesión de telefonía. Revisa la configuración del servidor.' }));
  }
}
