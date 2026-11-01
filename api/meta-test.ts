import { MetaBackendService } from '../server/metaBackend.js';
import type { MetaChannel } from '../src/types/meta.js';
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
    const principal = await authorizeCrmRequest(req, res, { adminOnly: true });
    if (!principal) return;
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { return res.status(400).json({ success: false, error: 'JSON inválido.' }); } }
    const channel = body?.channel as MetaChannel | undefined;
    if (channel && !['whatsapp', 'facebook', 'instagram'].includes(channel)) return res.status(400).json({ success: false, error: 'Canal inválido.' });
    const result = await MetaBackendService.testConnection(channel);
    await adminDb.collection('audit_logs').add({ action: 'META_CONNECTION_TEST', result: result.success ? 'SUCCESS' : 'FAILED', actorUid: principal.uid, actorEmail: principal.email, channel: channel || 'all', timestamp: new Date() });
    return res.status(result.success ? 200 : 502).json({ success: result.success, results: result.results });
  } catch (err: any) {
    console.error('[meta-test] Error:', err);
    return res.status(500).json({ success: false, error: 'No se pudo probar la conexión Meta.' });
  }
}