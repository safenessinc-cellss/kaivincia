import { MetaBackendService } from '../metaBackend.js';

export default async function handler(req: any, res: any) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Dev-UID');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // GET: Obtener estado de configuración sin exponer tokens sensibles
  if (req.method === 'GET') {
    try {
      const config = MetaBackendService.getConfig();
      res.statusCode = 200;
      res.end(JSON.stringify(config));
      return;
    } catch (err: any) {
      console.error('[API /api/meta-config GET] Error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({ error: err.message || 'Error al obtener configuración de Meta' }));
      return;
    }
  }

  // POST: Actualizar credenciales y configuración de Meta
  if (req.method === 'POST') {
    try {
      // 1. Verificación de Autenticación
      const authHeader = req.headers['authorization'] || '';
      const authUser = await MetaBackendService.verifyAuthToken(authHeader);

      // Si no hay token de autenticación válido y no es modo desarrollo asistido, requerir login
      if (!authUser && !req.headers['x-dev-uid'] && process.env.NODE_ENV === 'production') {
        res.statusCode = 401;
        res.end(JSON.stringify({
          success: false,
          error: 'No autorizado. Se requiere token de sesión administrativo.'
        }));
        return;
      }

      // 2. Parseo del cuerpo de la petición
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          body = {};
        }
      } else if (!body && typeof req.on === 'function') {
        // En entornos de Node stream tradicional
        const buffers: any[] = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        const dataStr = Buffer.concat(buffers).toString();
        body = dataStr ? JSON.parse(dataStr) : {};
      }

      // 3. Actualizar la configuración en el servicio de backend
      const updatedConfig = MetaBackendService.updateConfig({
        appId: body.appId,
        appSecret: body.appSecret,
        verifyToken: body.verifyToken,
        whatsappPhoneNumberId: body.whatsappPhoneNumberId,
        whatsappBusinessAccountId: body.whatsappBusinessAccountId,
        whatsappAccessToken: body.whatsappAccessToken,
        facebookPageId: body.facebookPageId,
        facebookPageAccessToken: body.facebookPageAccessToken,
        instagramAccountId: body.instagramAccountId,
        instagramAccessToken: body.instagramAccessToken
      });

      // 4. Registrar acción en audit logs del sistema si está disponible
      console.log(`[AUDIT] Action: META_CONFIGURED | User: ${authUser?.email || 'admin@kaivincia.com'} | Timestamp: ${new Date().toISOString()}`);

      res.statusCode = 200;
      res.end(JSON.stringify({
        success: true,
        config: updatedConfig,
        message: 'Configuración de Meta actualizada correctamente.'
      }));
      return;
    } catch (err: any) {
      console.error('[API /api/meta-config POST] Error:', err);
      res.statusCode = 500;
      res.end(JSON.stringify({
        success: false,
        error: err.message || 'Error interno al actualizar configuración de Meta'
      }));
      return;
    }
  }

  // Método no permitido
  res.statusCode = 405;
  res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
}
