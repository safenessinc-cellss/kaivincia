import { adminAuth, adminDb } from '../../server/_lib/firebaseAdmin.js';
import { TelnyxBackendService } from '../../server/telnyxBackend.js';

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

  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Allow', 'GET, POST, OPTIONS');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }
    if (!(await authorizeTelephonyAdmin(req))) {
      res.statusCode = 403;
      res.end(JSON.stringify({ error: 'Solo administradores autorizados pueden consultar o modificar la configuración Telnyx.' }));
      return;
    }

    // GET: configuración sin exponer la API Key completa.
    if (req.method === 'GET') {
      const config = TelnyxBackendService.getConfig();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(config));
      return;
    }

    // POST: Actualiza la configuración
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (body?.apiKey) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'La API Key de Telnyx se configura exclusivamente como variable de entorno protegida en Vercel.' }));
        return;
      }
      const updatedConfig = TelnyxBackendService.updateConfig({
        connectionId: body?.connectionId,
        maxConcurrentCalls: body?.maxConcurrentCalls
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, config: updatedConfig }));
      return;
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err: any) {
    console.error('[API /api/telnyx-config] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message || 'Error en configuración de Telnyx' }));
  }
}
