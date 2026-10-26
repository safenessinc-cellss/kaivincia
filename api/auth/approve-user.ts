import { adminAuth, adminDb } from '../../server/_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const AUTHORIZED_APPROVER_EMAIL = 'safeness.c.a@gmail.com';

function send(res: any, status: number, payload: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return send(res, 401, { error: 'Se requiere una sesión autenticada.' });
  }

  let decoded: any;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7).trim());
  } catch {
    return send(res, 401, { error: 'La sesión no es válida o ha expirado.' });
  }

  const email = String(decoded.email || '').trim().toLowerCase();
  if (email !== AUTHORIZED_APPROVER_EMAIL || decoded.email_verified !== true) {
    return send(res, 403, { error: 'Solo safeness.c.a@gmail.com puede aprobar o rechazar usuarios.' });
  }

  const uid = typeof req.body?.uid === 'string' ? req.body.uid.trim() : '';
  const action = req.body?.action;
  if (!uid || uid.length > 128 || !['approve', 'reject'].includes(action)) {
    return send(res, 400, { error: 'Solicitud inválida: se requiere uid y acción approve/reject.' });
  }

  if (uid === decoded.uid) {
    return send(res, 400, { error: 'No se puede procesar la aprobación de la propia cuenta mediante esta acción.' });
  }

  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return send(res, 404, { error: 'No se encontró la solicitud de usuario.' });
    }

    const now = FieldValue.serverTimestamp();
    if (action === 'approve') {
      await userRef.update({
        status: 'approved',
        approvedBy: AUTHORIZED_APPROVER_EMAIL,
        approvedAt: now,
        rejectedBy: FieldValue.delete(),
        rejectedAt: FieldValue.delete(),
        rejectionReason: FieldValue.delete(),
        updatedAt: now,
      });
    } else {
      await userRef.update({
        status: 'rejected',
        rejectedBy: AUTHORIZED_APPROVER_EMAIL,
        rejectedAt: now,
        rejectionReason: typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 500) : '',
        updatedAt: now,
      });
    }

    return send(res, 200, { ok: true, uid, status: action === 'approve' ? 'approved' : 'rejected' });
  } catch (error: any) {
    console.error('[approve-user] Failed to update approval state:', error?.message || error);
    return send(res, 500, { error: 'No se pudo guardar la aprobación. Inténtalo de nuevo.' });
  }
}
