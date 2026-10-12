import { TelnyxBackendService } from '../../../server/telnyxBackend.js';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    const authUser = await TelnyxBackendService.verifyAuthToken(authHeader);

    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No autorizado' }));
      return;
    }

    const { nombre, operadorUid, connectionId } = req.body;

    if (!nombre || !operadorUid) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Faltan campos: nombre y operadorUid' }));
      return;
    }

    const apiKey = process.env.TELNYX_API_KEY;
    const connId = connectionId || process.env.TELNYX_CONNECTION_ID;

    const telnyxResponse = await fetch('https://api.telnyx.com/v2/telephony_credentials', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connection_id: connId,
        name: nombre,
      }),
    });

    if (!telnyxResponse.ok) {
      const errorText = await telnyxResponse.text();
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        error: `Error creando credencial (${telnyxResponse.status}): ${errorText}`
      }));
      return;
    }

    const telnyxData = await telnyxResponse.json();
    const credentialId = telnyxData.data.id;
    const sipUsername = telnyxData.data.sip_username;

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
    res.end(JSON.stringify({
      success: true,
      credentialId,
      sipUsername,
      message: 'Credencial creada correctamente',
    }));
  } catch (err: any) {
    console.error('[credentials/create] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
