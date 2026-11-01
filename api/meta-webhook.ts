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
      // La firma de Meta debe calcularse sobre los bytes originales recibidos.
      // Nunca reconstruir el cuerpo desde req.body: JSON.stringify cambia el contenido firmado.
      const rawCandidate = req.rawBody ?? req.bodyRaw ?? (Buffer.isBuffer(req.body) ? req.body : null) ?? (typeof req.body === 'string' ? req.body : null);
      const rawBuffer = Buffer.isBuffer(rawCandidate)
        ? rawCandidate
        : typeof rawCandidate === 'string' ? Buffer.from(rawCandidate, 'utf8') : null;
      const appSecret = MetaBackendService.getAppSecret();
      const signatureHeader = req.headers['x-hub-signature-256'] as string | undefined;

      if (!appSecret) {
        console.error('[Meta Webhook] META_APP_SECRET no configurado; se rechaza el evento.');
        res.statusCode = 503;
        res.end(JSON.stringify({ received: false, error: 'Webhook no configurado de forma segura.' }));
        return;
      }
      if (!rawBuffer || !signatureHeader || !/^sha256=[a-f0-9]{64}$/i.test(signatureHeader)) {
        res.statusCode = 401;
        res.end(JSON.stringify({ received: false, error: 'Firma o cuerpo original del webhook ausente.' }));
        return;
      }

      const expected = crypto.createHmac('sha256', appSecret).update(rawBuffer).digest();
      const supplied = Buffer.from(signatureHeader.slice(7), 'hex');
      if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
        res.statusCode = 401;
        res.end(JSON.stringify({ received: false, error: 'Firma del webhook inválida.' }));
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(rawBuffer.toString('utf8'));
      } catch {
        res.statusCode = 400;
        res.end(JSON.stringify({ received: false, error: 'JSON inválido.' }));
        return;
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
