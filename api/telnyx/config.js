import { TelnyxBackendService } from '../../server/telnyxBackend';

/**
 * Endpoint de configuración de Telnyx (/api/telnyx/config)
 * Soporta GET para consultar estado seguro (sin exponer API key en claro)
 * y POST para actualizar connectionId, apiKey y límites de concurrencia.
 */
export default async function handler(req, res) {
  // Encabezados CORS universales para producción y desarrollo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Dev-UID');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // GET: Retornar configuración activa con API key enmascarada
  if (req.method === 'GET') {
    try {
      const config = TelnyxBackendService.getConfig();
      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        config
      }));
      return;
    } catch (err) {
      console.error('[API /api/telnyx/config GET] Error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        message: err.message || 'Error al obtener configuración de Telnyx'
      }));
      return;
    }
  }

  // POST: Actualizar parámetros de conexión de Telnyx
  if (req.method === 'POST') {
    try {
      let body = req.body;

      // Soporte tanto para bodies pre-parseados (Vercel Serverless) como streams (Node estándar)
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      } else if (!body && typeof req.on === 'function') {
        const buffers = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const dataStr = Buffer.concat(buffers).toString('utf-8');
        body = dataStr ? JSON.parse(dataStr) : {};
      } else if (!body) {
        body = {};
      }

      const updated = TelnyxBackendService.updateConfig({
        apiKey: body.apiKey,
        connectionId: body.connectionId,
        maxConcurrentCalls: body.maxConcurrentCalls
      });

      console.log(`[AUDIT] Action: TELNYX_CONFIG_UPDATED | Timestamp: ${new Date().toISOString()}`);

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        config: updated,
        message: 'Configuración de Telnyx actualizada exitosamente en el servidor.'
      }));
      return;
    } catch (err) {
      console.error('[API /api/telnyx/config POST] Error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        message: err.message || 'Error al guardar configuración de Telnyx'
      }));
      return;
    }
  }

  res.statusCode = 405;
  res.end(JSON.stringify({
    success: false,
    message: `Método ${req.method} no permitido en este endpoint.`
  }));
}
