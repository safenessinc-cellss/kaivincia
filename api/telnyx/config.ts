import { TelnyxBackendService } from '../../server/telnyxBackend.js';
import { authorizeCrmRequest } from '../../server/authorization.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, OPTIONS');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  try {
    const principal = await authorizeCrmRequest(req, res, { adminOnly: true });
    if (!principal) return;
    if (req.method === 'GET') return res.status(200).json(TelnyxBackendService.getConfig());

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, error: 'JSON inválido.' }); }
    }
    const updatedConfig = TelnyxBackendService.updateConfig({
      apiKey: body?.apiKey,
      connectionId: body?.connectionId,
      maxConcurrentCalls: body?.maxConcurrentCalls
    });
    await (await import('../../server/_lib/firebaseAdmin.js')).adminDb.collection('audit_logs').add({
      action: 'TELNYX_CONFIG_UPDATE', result: 'SUCCESS', actorUid: principal.uid,
      actorEmail: principal.email, timestamp: new Date(),
      changedApiKey: Boolean(body?.apiKey), changedConnectionId: Boolean(body?.connectionId),
    });
    return res.status(200).json({ success: true, config: updatedConfig });
  } catch (err: any) {
    console.error('[API /api/telnyx/config] Error:', err);
    return res.status(500).json({ success: false, error: 'Error en configuración de Telnyx.' });
  }
}
