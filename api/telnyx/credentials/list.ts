import { adminAuth, adminDb } from '../../../server/_lib/firebaseAdmin.js';

const ADMIN_ROLES = new Set(['superadmin', 'admin']);

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('Vary', 'Authorization');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, OPTIONS');
    res.end(JSON.stringify({ success: false, error: 'Method Not Allowed' }));
    return;
  }

  try {
    const header = String(req.headers['authorization'] || '');
    if (!header.startsWith('Bearer ')) {
      res.statusCode = 401; res.end(JSON.stringify({ error: 'Sesión requerida.' })); return;
    }
    const decoded = await adminAuth.verifyIdToken(header.slice(7), true);
    const profileSnap = await adminDb.collection('users').doc(decoded.uid).get();
    const profile = profileSnap.data() || {};
    if (!profileSnap.exists || !['approved', 'active'].includes(String(profile.status || '').toLowerCase()) || !ADMIN_ROLES.has(String(profile.role || '').toLowerCase())) {
      res.statusCode = 403; res.end(JSON.stringify({ error: 'Solo administradores autorizados pueden consultar credenciales SIP.' })); return;
    }

    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      res.statusCode = 503; res.end(JSON.stringify({ success: false, error: 'Servicio Telnyx no configurado.' })); return;
    }
    const response = await fetch('https://api.telnyx.com/v2/telephony_credentials?page[size]=250', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    if (!response.ok) {
      res.statusCode = 502; res.end(JSON.stringify({ success: false, error: 'Telnyx no pudo devolver las credenciales.' })); return;
    }
    const payload = await response.json();
    const credentials = (payload.data || []).map((item: any) => ({
      id: item.id, name: item.name, sipUsername: item.sip_username,
      connectionId: item.connection_id, createdAt: item.created_at
    }));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, total: credentials.length, credentials }));
  } catch (error: any) {
    console.error('[telnyx-credentials-list] Request failed:', error?.message || 'unknown error');
    res.statusCode = 500; res.end(JSON.stringify({ success: false, error: 'No fue posible consultar las credenciales.' }));
  }
}
