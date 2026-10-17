import { TelnyxBackendService } from '../../../server/telnyxBackend.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader);

    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'No autorizado' }));
      return;
    }

    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'TELNYX_API_KEY no configurada' }));
      return;
    }

    const telnyxRes = await fetch('https://api.telnyx.com/v2/telephony_credentials?page[size]=250', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!telnyxRes.ok) {
      const errText = await telnyxRes.text();
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: `Telnyx ${telnyxRes.status}: ${errText}` }));
      return;
    }

    const data = await telnyxRes.json();
    const credentials = (data.data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      sipUsername: c.sip_username,
      connectionId: c.connection_id,
      createdAt: c.created_at,
    }));

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, total: credentials.length, credentials }));
  } catch (err: any) {
    console.error('[credentials/list] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message }));
  }
}
