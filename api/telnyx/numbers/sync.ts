import { TelnyxBackendService } from '../../../server/telnyxBackend.js';
import { getFirestore } from 'firebase-admin/firestore';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, 
Content-Type');

  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); 
return; }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    const authHeader = req.headers['authorization'] || 
req.headers['Authorization'];
    const authUser = await 
TelnyxBackendService.verifyAuthToken(authHeader);

    if (!authUser?.uid) {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'No autorizado' }));
      return;
    }

    const result = await TelnyxBackendService.getAccountPhoneNumbers();

    if (!result.success) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: result.message }));
      return;
    }

    const db = getFirestore();
    const numerosGuardados: string[] = [];

    for (const num of result.numbers) {
      const docId = `num_${num.phone_number.replace(/\D/g, '')}`;
      const existingDoc = await 
db.collection('telnyx_phone_numbers').doc(docId).get();
      const codigoArea = num.phone_number.replace(/\D/g, 
'').substring(1, 4);

      await db.collection('telnyx_phone_numbers').doc(docId).set({
        id: docId,
        phoneNumber: num.phone_number,
        status: num.status,
        connectionId: num.connection_id,
        friendlyName: existingDoc.exists
          ? existingDoc.data()?.friendlyName
          : `Línea ${codigoArea}`,
        assignedUserId: existingDoc.exists
          ? existingDoc.data()?.assignedUserId
          : null,
        codigoArea: existingDoc.exists
          ? existingDoc.data()?.codigoArea
          : codigoArea,
        region: existingDoc.exists
          ? existingDoc.data()?.region
          : null,
        isSharedPool: existingDoc.exists
          ? existingDoc.data()?.isSharedPool
          : true,
        esPrincipal: existingDoc.exists
          ? existingDoc.data()?.esPrincipal
          : false,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      numerosGuardados.push(docId);
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      success: true,
      total: numerosGuardados.length,
      numbers: numerosGuardados,
    }));
  } catch (err: any) {
    console.error('[numbers/sync] Error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message }));
  }
}
