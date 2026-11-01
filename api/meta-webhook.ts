import crypto from 'crypto';
import { MetaBackendService } from '../server/metaBackend.js';

export default async function handler(req: any, res: any) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hub-Signature-256');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // 1. GET: Verificación de Suscripción del Webhook por Meta (Desafío hub.challenge)
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, 'http://localhost:3000');
      const mode = url.searchParams.get('hub.mode') || (req.query && req.query['hub.mode']);
      const token = url.searchParams.get('hub.verify_token') || (req.query && req.query['hub.verify_token']);
      const challenge = url.searchParams.get('hub.challenge') || (req.query && req.query['hub.challenge']);

      const verifiedChallenge = MetaBackendService.verifyWebhook(mode as string, token as string, challenge as string);

      if (verifiedChallenge) {
        console.log(`[Meta Webhook] Suscripción verificada exitosamente para modo "${mode}".`);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.statusCode = 200;
        res.end(verifiedChallenge);
        return;
      }

      console.warn(`[Meta Webhook] Verificación rechazada. Token recibido no coincide.`);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    } catch (err: any) {
      console.error('[Meta Webhook GET] Error:', err);
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.statusCode = 500;
      res.end('Internal Server Error');
      return;
    }
  }

  // 2. POST: Recepción de eventos en tiempo real (WhatsApp, Facebook, Instagram)
  if (req.method === 'POST') {
    res.setHeader('Content-Type', 'application/json');

    try {
      let rawBody = '';
      let payload: any = req.body;

      if (typeof payload === 'string') {
        rawBody = payload;
        try {
          payload = JSON.parse(rawBody);
        } catch {
          payload = {};
        }
      } else if (!payload && typeof req.on === 'function') {
        const buffers: any[] = [];
        for await (const chunk of req) {
          buffers.push(chunk);
        }
        rawBody = Buffer.concat(buffers).toString('utf-8');
        payload = rawBody ? JSON.parse(rawBody) : {};
      } else if (payload && typeof payload === 'object') {
        rawBody = JSON.stringify(payload);
      }

      // Verificación opcional de firma SHA256 si App Secret está configurado y hay cabecera X-Hub-Signature-256
      const appSecret = MetaBackendService.getAppSecret();
      const signatureHeader = req.headers['x-hub-signature-256'] as string;

      if (appSecret) {
        if (!signatureHeader || !rawBody) {
          console.warn('[Meta Webhook] Firma o cuerpo original ausente; solicitud rechazada.');
          res.statusCode = 401;
          res.end(JSON.stringify({ received: false, error: 'Firma del webhook requerida.' }));
          return;
        }
        try {
          const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest();
          const suppliedHex = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : '';
          const supplied = Buffer.from(suppliedHex, 'hex');
          if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
            res.statusCode = 401;
            res.end(JSON.stringify({ received: false, error: 'Firma del webhook inválida.' }));
            return;
          }
        } catch (sigErr) {
          console.error('[Meta Webhook] Error al validar firma:', sigErr);
          res.statusCode = 401;
          res.end(JSON.stringify({ received: false, error: 'No se pudo validar la firma.' }));
          return;
        }
      }

      // Procesar eventos entrantes a través del servicio central
      const result = await MetaBackendService.handleWebhook(payload);

      // Meta exige respuesta 200 OK inmediata
      res.statusCode = 200;
      res.end(JSON.stringify({
        received: true,
        actions: result.actions,
        eventsCount: result.eventsCount
      }));
      return;
    } catch (err: any) {
      console.error('[Meta Webhook POST] Error procesando evento:', err);
      // Retornar 200 para evitar que Meta reintente indefinidamente ante payloads con formato inesperado
      res.statusCode = 200;
      res.end(JSON.stringify({
        received: false,
        actions: [`Error: ${err.message}`],
        eventsCount: 0
      }));
      return;
    }
  }

  res.statusCode = 405;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: `Method ${req.method} Not Allowed` }));
}
