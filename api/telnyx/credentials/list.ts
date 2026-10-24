import { adminAuth } from '../../../server/_lib/firebaseAdmin.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Falta header Authorization' }));
      return;
    }
    const authUser = await adminAuth.verifyIdToken(authHeader.replace('Bearer ', ''), true);
    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Token inválido' }));
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
    return;
  } catch (err: any) {
    console.error('[telnyx] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
