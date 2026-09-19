import { TelnyxBackendService } from '../server/telnyxBackend';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader as string);

    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No autorizado. Token de Firebase inválido o ausente.' }));
      return;
    }

    const result = await TelnyxBackendService.getAccountPhoneNumbers();
    res.statusCode = result.success ? 200 : 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    console.error('[API /api/telnyx-numbers] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: false,
      numbers: [],
      message: err.message || 'Error al obtener números de Telnyx'
    }));
  }
}
