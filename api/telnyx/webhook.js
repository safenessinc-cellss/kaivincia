import { TelnyxBackendService } from '../../server/telnyxBackend';

/**
 * Webhook de Telnyx (/api/telnyx/webhook)
 * Recibe eventos de llamadas, grabación y DTMF enviados por Telnyx Call Control / TeXML.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Telnyx-Signature-Ed25519, Telnyx-Timestamp');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ status: 'error', message: 'Método no permitido' }));
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

    const result = await TelnyxBackendService.handleWebhook(body);
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', ...result }));
  } catch (err) {
    console.error('[API /api/telnyx/webhook] Error procesando evento:', err);
    // Responder 200 a Telnyx para evitar reintentos continuos en caso de payloads malformados
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ignored', error: err.message }));
  }
}
