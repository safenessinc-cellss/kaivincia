import { adminAuth } from '../server/_lib/firebaseAdmin.js';

export default async function handler(req: any, res: any) {
  const path = req.query.path || [];
  const route = Array.isArray(path) ? path.join('/') : path;

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

    // ── call-reports ──
    if (route === 'call-reports' && req.method === 'GET') {
      const { from, to } = req.query;
      if (!from || !to) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Faltan from y to' }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, message: 'call-reports OK', from, to }));
      return;
    }

    // ── credentials/list ──
    if (route === 'credentials/list' && req.method === 'GET') {
      const apiKey = process.env.TELNYX_API_KEY;
      if (!apiKey) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: 'TELNYX_API_KEY no configurada' }));
        return;
      }

      const telnyxRes = await fetch('https://api.telnyx.com/v2/telephony_credentials?page[size]=250', {
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
      const credentials = (data.data || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        sipUsername: c.sip_username,
        connectionId: c.connection_id,
        createdAt: c.created_at,
      }));

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, total: credentials.length, credentials }));
      return;
    }

    // ── credentials/create ──
    if (route === 'credentials/create' && req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { nombre, operadorUid, connectionId } = body || {};

      if (!nombre || !operadorUid) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Faltan campos: nombre y operadorUid' }));
        return;
      }

      const apiKey = process.env.TELNYX_API_KEY;
      const connId = connectionId || process.env.TELNYX_CONNECTION_ID;

      const telnyxRes = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connection_id: connId, name: nombre }),
      });

      if (!telnyxRes.ok) {
        const errText = await telnyxRes.text();
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `Error creando credencial (${telnyxRes.status}): ${errText}` }));
        return;
      }

      const telnyxData = await telnyxRes.json();
      const credentialId = telnyxData.data.id;
      const sipUsername = telnyxData.data.sip_username;

      const { getFirestore } = await import('firebase-admin/firestore');
      const db = getFirestore();

      await db.collection('telnyx_sip_credentials').doc(credentialId).set({
        id: credentialId,
        telnyxUsername: sipUsername,
        connectionId: connId,
        operadorUid,
        activo: true,
        creadoEn: new Date().toISOString(),
      });

      await db.collection('operadores').doc(operadorUid).set({
        telnyxCredentialId: credentialId,
        telnyxUsername: sipUsername,
        actualizadoEn: new Date().toISOString(),
      }, { merge: true });

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, credentialId, sipUsername, message: 'Credencial creada correctamente' }));
      return;
    }

    // ── numbers/sync ──
    if (route === 'numbers/sync' && req.method === 'POST') {
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
      res.end(JSON.stringify({ success: true, total: numbers.length, numbers: numbers.map(n => n.phoneNumber) }));
      return;
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Ruta no encontrada', route }));
  } catch (err: any) {
    console.error('[telnyx unified] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
