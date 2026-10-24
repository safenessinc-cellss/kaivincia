import { TelnyxBackendService } from '../../server/telnyxBackend.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    // GET: Devuelve la configuración actual (sin exponer la API Key completa)
    if (req.method === 'GET') {
      const config = TelnyxBackendService.getConfig();
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(config));
      return;
    }

    // POST: Actualiza la configuración
    if (req.method === 'POST') {
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      const authUser = await TelnyxBackendService.verifyAuthToken(authHeader as string);

      if (!authUser?.uid) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'No autorizado. Token de Firebase inválido o ausente.' }));
        return;
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const updatedConfig = TelnyxBackendService.updateConfig({
        apiKey: body?.apiKey,
        connectionId: body?.connectionId,
        maxConcurrentCalls: body?.maxConcurrentCalls
      });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, config: updatedConfig }));
      return;
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  } catch (err: any) {
    console.error('[API /api/telnyx-config] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: err.message || 'Error en configuración de Telnyx' }));
  }
}
