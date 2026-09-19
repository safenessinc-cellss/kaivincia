import { TelnyxBackendService } from '../server/telnyxBackend';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        body = {};
      }
    }

    const connectionId = body?.connectionId || process.env.TELNYX_CONNECTION_ID || '';
    const result = await TelnyxBackendService.testConnection(connectionId);

    res.statusCode = result.httpStatus >= 200 && result.httpStatus < 300 ? 200 : result.httpStatus;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('[API /api/telnyx-test] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      httpStatus: 500,
      message: err.message || 'Error interno del servidor al probar conexión'
    }));
  }
}
