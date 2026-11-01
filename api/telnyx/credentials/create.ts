import { adminAuth, adminDb } , isFirebaseAdminConfigured } from '../../../server/_lib/firebaseAdmin.js';

const ADMIN_ROLES = new Set(['superadmin', 'admin']);

export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, private');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') {
    res.statusCode = 405; res.setHeader('Allow', 'POST, OPTIONS');
    res.end(JSON.stringify({ error: 'Method Not Allowed' })); return;
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
      res.statusCode = 403; res.end(JSON.stringify({ error: 'Solo superadministradores y administradores pueden crear credenciales.' })); return;
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const nombre = String(body.nombre || '').trim();
    const operadorUid = String(body.operadorUid || '').trim();
    const connectionId = String(body.connectionId || process.env.TELNYX_CONNECTION_ID || '').trim();
    if (!nombre || nombre.length > 100 || !operadorUid || !connectionId) {
      res.statusCode = 400; res.end(JSON.stringify({ error: 'Nombre, operador y conexión Telnyx son obligatorios.' })); return;
    }
    const operatorRef = adminDb.collection('operadores').doc(operadorUid);
    const operatorSnap = await operatorRef.get();
    if (!operatorSnap.exists || operatorSnap.data()?.activo === false) {
      res.statusCode = 404; res.end(JSON.stringify({ error: 'El operador no existe o está desactivado.' })); return;
    }
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      res.statusCode = 503; res.end(JSON.stringify({ error: 'Servicio Telnyx no configurado.' })); return;
    }

    const telnyxRes = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connectionId, name: nombre })
    });
    const telnyxData = await telnyxRes.json().catch(() => ({}));
    if (!telnyxRes.ok || !telnyxData.data?.id) {
      res.statusCode = 502; res.end(JSON.stringify({ error: 'Telnyx rechazó la creación de la credencial.' })); return;
    }

    const credentialId = String(telnyxData.data.id);
    const sipUsername = String(telnyxData.data.sip_username || '');
    await adminDb.collection('telnyx_sip_credentials').doc(credentialId).set({
      id: credentialId, name: nombre, telnyxUsername: sipUsername,
      connectionId, assignedTo: operadorUid, operadorUid, status: 'active',
      activo: true, createdAt: new Date().toISOString()
    });
    await operatorRef.set({
      telnyxCredentialId: credentialId, telnyxUsername: sipUsername,
      connectionId, activo: true, actualizadoEn: new Date().toISOString()
    }, { merge: true });

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, credentialId, sipUsername, message: 'Credencial asignada correctamente.' }));
  } catch (error: any) {
    console.error('[telnyx-credentials-create] Request failed:', error?.message || 'unknown error');
    res.statusCode = 500; res.end(JSON.stringify({ error: 'No fue posible crear la credencial SIP.' }));
  }
}
