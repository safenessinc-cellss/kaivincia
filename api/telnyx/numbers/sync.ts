import { adminDb } from '../../../server/_lib/firebaseAdmin.js';
import { authorizeCrmRequest } from '../../../server/authorization.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const principal = await authorizeCrmRequest(req, res, { adminOnly: true });
    if (!principal) return;
    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) return res.status(503).json({ success: false, error: 'TELNYX_API_KEY no configurada.' });

    const telnyxRes = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=250', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!telnyxRes.ok) {
      console.error('[telnyx-sync] Carrier rejected request:', telnyxRes.status);
      return res.status(502).json({ success: false, error: `Telnyx respondió con estado ${telnyxRes.status}.` });
    }

    const data = await telnyxRes.json();
    const numbers = (data.data || []).filter((n: any) => n.phone_number).map((n: any) => ({
      id: n.id, phoneNumber: n.phone_number, status: n.status, connectionId: n.connection_id,
    }));
    const batch = adminDb.batch();
    for (const number of numbers) {
      const docId = `num_${number.phoneNumber.replace(/\\D/g, '')}`;
      batch.set(adminDb.collection('telnyx_phone_numbers').doc(docId), {
        id: docId, phoneNumber: number.phoneNumber, status: number.status,
        connectionId: number.connectionId, updatedAt: new Date().toISOString(),
      }, { merge: true });
    }
    if (numbers.length) await batch.commit();
    await adminDb.collection('audit_logs').add({
      action: 'TELNYX_NUMBERS_SYNC', result: 'SUCCESS', actorUid: principal.uid,
      actorEmail: principal.email, count: numbers.length, timestamp: new Date(),
    });
    return res.status(200).json({ success: true, total: numbers.length, numbers: numbers.map((n: any) => n.phoneNumber) });
  } catch (err: any) {
    console.error('[telnyx-sync] Error:', err);
    return res.status(500).json({ success: false, error: 'No se pudo completar la sincronización Telnyx.' });
  }
}
