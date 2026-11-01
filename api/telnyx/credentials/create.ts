import { adminDb } from '../../../server/_lib/firebaseAdmin.js';
import { TelnyxBackendService } from '../../../server/telnyxBackend.js';
import { authorizeCrmRequest } from '../../../server/authorization.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  try {
    const principal = await authorizeCrmRequest(req, res, { adminOnly: true });
    if (!principal) return;
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON inválido.' }); }
    }
    const { nombre, operadorUid, connectionId } = body || {};
    if (typeof nombre !== 'string' || !nombre.trim() || typeof operadorUid !== 'string' || !operadorUid.trim()) {
      return res.status(400).json({ error: 'Faltan campos válidos: nombre y operadorUid.' });
    }
    const operatorRef = adminDb.collection('operadores').doc(operadorUid);
    const operatorSnap = await operatorRef.get();
    if (!operatorSnap.exists || operatorSnap.data()?.activo !== true) {
      return res.status(404).json({ error: 'El operador destino no existe o está desactivado.' });
    }
    const configuredConnectionId = process.env.TELNYX_CONNECTION_ID || '';
    if (!configuredConnectionId || (connectionId && connectionId !== configuredConnectionId)) {
      return res.status(403).json({ error: 'Connection ID no autorizado para este entorno.' });
    }
    const apiKey = TelnyxBackendService.getApiKey();
    if (!apiKey) return res.status(503).json({ error: 'TELNYX_API_KEY no configurada.' });
    const telnyxRes = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: configuredConnectionId, name: nombre.trim() }),
    });
    if (!telnyxRes.ok) {
      console.error('[telnyx-credentials-create] Carrier rejected request:', telnyxRes.status);
      return res.status(502).json({ error: `Telnyx respondió con estado ${telnyxRes.status}.` });
    }
    const telnyxData = await telnyxRes.json();
    const credentialId = telnyxData?.data?.id;
    const sipUsername = telnyxData?.data?.sip_username;
    if (!credentialId || !sipUsername) return res.status(502).json({ error: 'Telnyx devolvió una credencial incompleta.' });
    const now = new Date().toISOString();
    await adminDb.collection('telnyx_sip_credentials').doc(credentialId).set({
      id: credentialId, telnyxUsername: sipUsername, connectionId: configuredConnectionId,
      operadorUid, activo: true, creadoEn: now,
    });
    await operatorRef.set({ telnyxCredentialId: credentialId, telnyxUsername: sipUsername, actualizadoEn: now }, { merge: true });
    await adminDb.collection('audit_logs').add({
      action: 'TELNYX_CREDENTIAL_CREATE', result: 'SUCCESS', actorUid: principal.uid,
      actorEmail: principal.email, targetUid: operadorUid, credentialId, timestamp: new Date(),
    });
    return res.status(200).json({ success: true, credentialId, sipUsername, message: 'Credencial creada correctamente.' });
  } catch (err: any) {
    console.error('[telnyx-credentials-create] Error:', err);
    return res.status(500).json({ success: false, error: 'No se pudo crear la credencial Telnyx.' });
  }
}
