import { TelnyxBackendService } from '../../../server/telnyxBackend.js';
import { authorizeCrmRequest } from '../../../server/authorization.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }
  try {
    const principal = await authorizeCrmRequest(req, res, { adminOnly: true });
    if (!principal) return;
    const result = await TelnyxBackendService.getApiKey();
    if (!result) return res.status(503).json({ success: false, credentials: [], error: 'TELNYX_API_KEY no configurada.' });
    const telnyxRes = await fetch('https://api.telnyx.com/v2/telephony_credentials?page[size]=250', {
      headers: { Authorization: `Bearer ${result}` },
    });
    if (!telnyxRes.ok) return res.status(502).json({ success: false, credentials: [], error: `Telnyx respondió con estado ${telnyxRes.status}.` });
    const data = await telnyxRes.json();
    const credentials = (data.data || []).map((c: any) => ({
      id: c.id, name: c.name, sipUsername: c.sip_username,
      connectionId: c.connection_id, createdAt: c.created_at,
    }));
    return res.status(200).json({ success: true, total: credentials.length, credentials });
  } catch (err: any) {
    console.error('[telnyx-credentials-list] Error:', err);
    return res.status(500).json({ success: false, credentials: [], error: 'No se pudieron consultar las credenciales.' });
  }
}
