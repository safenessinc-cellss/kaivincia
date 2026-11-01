import { MetaBackendService } from '../metaBackend.js';
import type { MetaChannel, MetaSendPayload } from '../../src/types/meta.js';

export default async function handler(req: any, res: any) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Dev-UID');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed. Use POST.` }));
    return;
  }

  try {
    // 1. Verificación de Autenticación de Firebase
    const authHeader = req.headers['authorization'] || '';
    const authUser = await MetaBackendService.verifyAuthToken(authHeader);

    // En producción se exige token de sesión válido; en dev se permite X-Dev-UID para pruebas asistidas
    if (!authUser && !req.headers['x-dev-uid'] && process.env.NODE_ENV === 'production') {
      res.statusCode = 401;
      res.end(JSON.stringify({
        success: false,
        error: 'No autorizado. Se requiere token de autenticación de Firebase válido.'
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
      const buffers: any[] = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const dataStr = Buffer.concat(buffers).toString();
      body = dataStr ? JSON.parse(dataStr) : {};
    }

    const { channel, to, text, template } = (body || {}) as MetaSendPayload;

    // 3. Validación de campos obligatorios
    if (!channel || !['whatsapp', 'facebook', 'instagram'].includes(channel)) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: "El campo 'channel' es obligatorio y debe ser 'whatsapp', 'facebook' o 'instagram'."
      }));
      return;
    }

    if (!to || typeof to !== 'string' || !to.trim()) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: "El campo 'to' (destinatario / ID / número de teléfono) es obligatorio."
      }));
      return;
    }

    if (!template && (!text || typeof text !== 'string' || !text.trim())) {
      res.statusCode = 400;
      res.end(JSON.stringify({
        success: false,
        error: "Se requiere un mensaje de texto ('text') o una plantilla ('template') válida para enviar."
      }));
      return;
    }

    const recipient = to.trim();

    // 4. Enrutamiento por Canal
    let sendResult;

    if (channel === 'whatsapp') {
      if (template && template.name) {
        sendResult = await MetaBackendService.sendWhatsAppTemplate(
          recipient,
          template.name,
          template.params,
          template.languageCode || 'es'
        );
      } else {
        sendResult = await MetaBackendService.sendWhatsAppMessage(recipient, text || '');
      }
    } else if (channel === 'facebook') {
      sendResult = await MetaBackendService.sendFacebookMessage(recipient, text || '');
    } else if (channel === 'instagram') {
      sendResult = await MetaBackendService.sendInstagramMessage(recipient, text || '');
    }

    // 5. Auditoría del envío
    console.log(`[AUDIT] Action: META_MESSAGE_SENT | Channel: ${channel} | Recipient: ${recipient} | User: ${authUser?.email || 'system'} | MessageId: ${sendResult?.messageId}`);

    res.statusCode = 200;
    res.end(JSON.stringify({
      success: true,
      messageId: sendResult?.messageId || `meta_msg_${Date.now()}`,
      channel,
      recipientId: recipient
    }));
    return;
  } catch (err: any) {
    console.error('[API /api/meta-send] Error:', err);
    res.statusCode = 500;
    res.end(JSON.stringify({
      success: false,
      error: err.message || 'Error al enviar mensaje a través de Meta Graph API'
    }));
    return;
  }
}
