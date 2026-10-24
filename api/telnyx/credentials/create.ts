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
  } catch (err: any) {
    console.error('[telnyx] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
