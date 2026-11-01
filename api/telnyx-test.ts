import { TelnyxBackendService } from '../server/telnyxBackend.js';
import { authorizeCrmRequest } from '../server/authorization.js';

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
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const requested = typeof body?.connectionId === 'string' ? body.connectionId.trim() : '';
    const configured = process.env.TELNYX_CONNECTION_ID || '';
    if (requested && configured && requested !== configured) {
      return res.status(403).json({ success: false, error: 'Sólo se permite probar la conexión Telnyx configurada en el servidor.' });
    }
    const result = await TelnyxBackendService.testConnection(configured);
    return res.status(result.httpStatus >= 200 && result.httpStatus < 300 ? 200 : result.httpStatus).json(result);
  } catch (err: any) {
    console.error('[API /api/telnyx-test] Error:', err);
    return res.status(500).json({ success: false, httpStatus: 500, message: 'Error interno al probar la conexión.' });
  }
}
