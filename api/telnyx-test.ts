import { adminAuth, adminDb  , isFirebaseAdminConfigured } from '../server/_lib/firebaseAdmin.js';
import { TelnyxBackendService } from '../server/telnyxBackend.js';

async function authorizeTelephonyAdmin(req: any) {
  const header = String(req.headers['authorization'] || '');
  if (!header.startsWith('Bearer ')) return false;
  const decoded = await adminAuth.verifyIdToken(header.slice(7), true);
  const profileSnap = await adminDb.collection('users').doc(decoded.uid).get();
  const profile = profileSnap.data() || {};
  const role = String(profile.role || '').toLowerCase().trim();
  const matrixSnap = await adminDb.collection('settings').doc('rbac_matrix').get();
  const matrixValue = matrixSnap.data()?.matrix?.[role]?.telephony_config;
  const override = profile.permissions?.telephony_config;
  const allowed = typeof override === 'boolean' ? override : (typeof matrixValue === 'boolean' ? matrixValue : ['superadmin', 'admin'].includes(role));
  return profileSnap.exists &&
    ['approved', 'active'].includes(String(profile.status || '').toLowerCase()) &&
    ['superadmin', 'admin'].includes(role) && allowed;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
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
    if (!(await authorizeTelephonyAdmin(req))) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Solo administradores autorizados pueden probar conexiones Telnyx.' }));
      return;
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const connectionId = body?.connectionId || process.env.TELNYX_CONNECTION_ID || '';
    const result = await TelnyxBackendService.testConnection(connectionId);

    res.statusCode = result.httpStatus >= 200 && result.httpStatus < 300 ? 200 : result.httpStatus;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('[API /api/telnyx-test] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      httpStatus: 500,
      message: err.message || 'Error interno del servidor al probar conexión'
    }));
  }
}
