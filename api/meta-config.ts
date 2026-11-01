import { MetaBackendService } from '../server/metaBackend.js';
import { authorizeCrmRequest } from '../server/authorization.js';
import { adminDb } from '../server/_lib/firebaseAdmin.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  try {
    const principal = await authorizeCrmRequest(req, res, { adminOnly: true });
    if (!principal) return;
    if (req.method === 'GET') return res.status(200).json(MetaBackendService.getConfig());
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST, OPTIONS');
      return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, error: 'JSON inválido.' }); } }
    const config = MetaBackendService.updateConfig({
      appId: body?.appId, appSecret: body?.appSecret, verifyToken: body?.verifyToken,
      whatsappPhoneNumberId: body?.whatsappPhoneNumberId, whatsappBusinessAccountId: body?.whatsappBusinessAccountId,
      whatsappAccessToken: body?.whatsappAccessToken, facebookPageId: body?.facebookPageId,
      facebookPageAccessToken: body?.facebookPageAccessToken, instagramAccountId: body?.instagramAccountId,
      instagramAccessToken: body?.instagramAccessToken,
    });
    await adminDb.collection('audit_logs').add({ action: 'META_CONFIG_UPDATE', result: 'SUCCESS', actorUid: principal.uid, actorEmail: principal.email, timestamp: new Date() });
    return res.status(200).json({ success: true, config, message: 'Configuración de Meta actualizada.' });
  } catch (err: any) {
    console.error('[meta-config] Error:', err);
    return res.status(500).json({ success: false, error: 'No se pudo procesar la configuración Meta.' });
  }
}