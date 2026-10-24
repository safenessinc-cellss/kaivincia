import { adminAuth } from '../../../server/_lib/firebaseAdmin.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Falta header Authorization' }));
      return;
    }
    const authUser = await adminAuth.verifyIdToken(authHeader.replace('Bearer ', ''), true);
    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Token inválido' }));
      return;
    }

    const apiKey = process.env.TELNYX_API_KEY;
    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: 'TELNYX_API_KEY no configurada' }));
      return;
    }

    const telnyxRes = await fetch('https://api.telnyx.com/v2/phone_numbers?page[size]=250', {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });

    if (!telnyxRes.ok) {
      const errText = await telnyxRes.text();
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: false, error: `Telnyx ${telnyxRes.status}: ${errText}` }));
      return;
    }

    const data = await telnyxRes.json();
    const numbers = (data.data || []).map((n: any) => ({
      id: n.id,
      phoneNumber: n.phone_number,
      status: n.status,
      connectionId: n.connection_id,
    }));

    const { getFirestore } = await import('firebase-admin/firestore');
    const db = getFirestore();

    for (const num of numbers) {
      const docId = `num_${num.phoneNumber.replace(/\D/g, '')}`;
      await db.collection('telnyx_phone_numbers').doc(docId).set({
        id: docId,
        phoneNumber: num.phoneNumber,
        status: num.status,
        connectionId: num.connectionId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, total: numbers.length, numbers: numbers.map((n: any) => n.phoneNumber) }));
    return;
  } catch (err: any) {
    console.error('[telnyx] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
