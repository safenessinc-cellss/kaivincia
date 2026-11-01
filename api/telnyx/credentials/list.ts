import { adminAuth, adminDb  , isFirebaseAdminConfigured } from '../../../server/_lib/firebaseAdmin.js';

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

  if (!isFirebaseAdminConfigured) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Firebase Admin no está configurado para este entorno.' }));
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
    const role = String(profile.role || '').toLowerCase();
    const matrixSnap = await adminDb.collection('settings').doc('rbac_matrix').get();
    const matrixValue = matrixSnap.data()?.matrix?.[role]?.telephony_config;
    const override = profile.permissions?.telephony_config;
    const permission = typeof override === 'boolean' ? override : (typeof matrixValue === 'boolean' ? matrixValue : ADMIN_ROLES.has(role));
    if (!profileSnap.exists || !['approved', 'active'].includes(String(profile.status || '').toLowerCase()) || !ADMIN_ROLES.has(role) || !permission) {
      res.statusCode = 403; res.end(JSON.stringify({ error: 'Solo administradores autorizados pueden consultar credenciales SIP.' })); return;
    }

    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      res.statusCode = 503; res.end(JSON.stringify({ success: false, error: 'Servicio Telnyx no configurado.' })); return;
    }
    // Retrieve the complete account inventory instead of silently stopping at
    // the first page. Telnyx returns credential records across connections.
    const allCredentials: any[] = [];
    let pageNumber = 1;
    let totalPages = 1;
    while (pageNumber <= totalPages && pageNumber <= 100) {
      const url = new URL('https://api.telnyx.com/v2/telephony_credentials');
      url.searchParams.set('page[size]', '250');
      url.searchParams.set('page[number]', String(pageNumber));
      const response = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      if (!response.ok) {
        const detail = await response.text();
        console.error('[telnyx-credentials-list] Telnyx response:', response.status, detail.slice(0, 500));
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: `Telnyx no pudo devolver las credenciales (HTTP ${response.status}).` }));
        return;
      }
      const payload = await response.json();
      const batch = Array.isArray(payload.data) ? payload.data : [];
      allCredentials.push(...batch);
      const reportedPages = Number(payload.meta?.page?.total_pages || payload.meta?.total_pages || 0);
      totalPages = reportedPages > 0 ? reportedPages : (batch.length === 250 ? pageNumber + 1 : pageNumber);
      pageNumber += 1;
    }
    const credentials = allCredentials.map((item: any) => ({
      id: item.id,
      name: item.name || item.sip_username || item.id,
      sipUsername: item.sip_username || '',
      connectionId: item.connection_id || '',
      status: item.status || item.status_detail || 'unknown',
      createdAt: item.created_at
    }));
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, total: credentials.length, credentials }));
  } catch (error: any) {
    console.error('[telnyx-credentials-list] Request failed:', error?.message || 'unknown error');
    res.statusCode = 500; res.end(JSON.stringify({ success: false, error: 'No fue posible consultar las credenciales.' }));
  }
}
