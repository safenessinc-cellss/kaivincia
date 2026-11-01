import { TelnyxBackendService } from '../server/telnyxBackend.js';
import { adminDb } from '../server/_lib/firebaseAdmin.js';
import { authorizeCrmRequest } from '../server/authorization.js';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_URL || 'https://www.kaivinciacorp.com');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ success: false, numbers: [], error: 'Method Not Allowed' });
  }

  try {
    const principal = await authorizeCrmRequest(req, res);
    if (!principal) return;
    if (principal.isAdmin) {
      const result = await TelnyxBackendService.getAccountPhoneNumbers();
      return res.status(result.success ? 200 : 502).json(result);
    }

    const operatorSnap = await adminDb.collection('operadores').doc(principal.uid).get();
    const operator = operatorSnap.data() || {};
    if (!operatorSnap.exists || operator.activo !== true) {
      return res.status(403).json({ success: false, numbers: [], error: 'No tienes un perfil de operador activo.' });
    }
    const assigned = Array.isArray(operator.numerosAsignados) ? operator.numerosAsignados : [];
    const numbers: any[] = [];
    for (const id of assigned) {
      const snap = await adminDb.collection('telnyx_phone_numbers').doc(String(id)).get();
      if (!snap.exists) continue;
      const value = snap.data() || {};
      if (value.status !== 'disabled' && value.phoneNumber) {
        numbers.push({ id: snap.id, phone_number: value.phoneNumber, status: value.status, connection_id: value.connectionId });
      }
    }
    return res.status(200).json({ success: true, numbers });
  } catch (err: any) {
    console.error('[telnyx-numbers] Error:', err);
    return res.status(500).json({ success: false, numbers: [], error: 'No se pudieron obtener los números autorizados.' });
  }
}
