import { MetaBackendService } from '../server/metaBackend.js';
import type { MetaSendPayload } from '../src/types/meta.js';
import { authorizeCrmRequest } from '../server/authorization.js';
import { adminDb } from '../server/_lib/firebaseAdmin.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST, OPTIONS'); return res.status(405).json({ success: false, error: 'Method Not Allowed' }); }
  try {
    const principal = await authorizeCrmRequest(req, res);
    if (!principal) return;
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, error: 'JSON inválido.' }); } }
    const { channel, to, text, template } = (body || {}) as MetaSendPayload;
    if (!channel || !['whatsapp', 'facebook', 'instagram'].includes(channel)) return res.status(400).json({ success: false, error: 'Canal inválido.' });
    if (!to || typeof to !== 'string' || !to.trim()) return res.status(400).json({ success: false, error: 'Destinatario obligatorio.' });
    if (!template && (!text || typeof text !== 'string' || !text.trim())) return res.status(400).json({ success: false, error: 'Se requiere texto o plantilla.' });
    const recipient = to.trim();
    const result = channel === 'whatsapp'
      ? (template?.name ? await MetaBackendService.sendWhatsAppTemplate(recipient, template.name, template.params, template.languageCode || 'es') : await MetaBackendService.sendWhatsAppMessage(recipient, text || ''))
      : channel === 'facebook' ? await MetaBackendService.sendFacebookMessage(recipient, text || '') : await MetaBackendService.sendInstagramMessage(recipient, text || '');
    await adminDb.collection('audit_logs').add({ action: 'META_MESSAGE_SENT', result: 'SUCCESS', actorUid: principal.uid, actorEmail: principal.email, channel, recipient, messageId: result?.messageId || null, timestamp: new Date() });
    return res.status(200).json({ success: true, messageId: result?.messageId || null, channel, recipientId: recipient });
  } catch (err: any) {
    console.error('[meta-send] Error:', err);
    return res.status(502).json({ success: false, error: 'No se pudo enviar el mensaje mediante Meta.' });
  }
}