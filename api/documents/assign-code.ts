import { adminAuth, adminDb, isFirebaseAdminConfigured } from '../../server/_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const OWNER_EMAILS = ['safeness.c.a@gmail.com'];
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9._/-]{1,79}$/;

function send(res: any, status: number, payload: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function rolePermission(profile: any, matrix: Record<string, any>) {
  const role = String(profile.role || '').toLowerCase().trim();
  const override = profile.permissions?.document_code_assign;
  if (typeof override === 'boolean') return override;
  const matrixRole = ['sales', 'ventas', 'tlmk', 'telemarketing', 'setter', 'closer', 'agente', 'operador', 'call_agent'].includes(role)
    ? 'sales'
    : role;
  const value = matrix[matrixRole]?.document_code_assign;
  return typeof value === 'boolean' ? value : false;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
  if (!isFirebaseAdminConfigured) return send(res, 503, { error: 'Firebase Admin no está configurado.' });

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return send(res, 401, { error: 'Missing bearer token' });
  }

  let decoded: any;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7).trim());
  } catch {
    return send(res, 401, { error: 'Invalid token' });
  }

  const documentId = String(req.body?.documentId || '').trim();
  const code = String(req.body?.code || '').trim().toUpperCase();
  if (!documentId || documentId.length > 180 || documentId.includes('/')) {
    return send(res, 400, { error: 'documentId inválido' });
  }
  if (!CODE_PATTERN.test(code)) {
    return send(res, 400, { error: 'Código inválido. Use 2–80 caracteres: letras, números, punto, guion, guion bajo o barra.' });
  }

  try {
    const userSnap = await adminDb.collection('users').doc(decoded.uid).get();
    if (!userSnap.exists) return send(res, 403, { error: 'Perfil no encontrado' });
    const profile = userSnap.data() || {};
    const status = String(profile.status || '').toLowerCase();
    if (!['approved', 'active'].includes(status)) return send(res, 403, { error: 'Cuenta no aprobada' });

    const email = String(decoded.email || profile.email || '').toLowerCase();
    const role = String(profile.role || '').toLowerCase();
    const isOwner = OWNER_EMAILS.includes(email);
    const isSuperAdmin = role === 'superadmin';
    let permitted = isOwner || isSuperAdmin;

    if (!permitted) {
      const matrixSnap = await adminDb.collection('settings').doc('rbac_matrix').get();
      const matrix = (matrixSnap.data()?.matrix || {}) as Record<string, any>;
      permitted = rolePermission(profile, matrix);
    }
    if (!permitted) return send(res, 403, { error: 'No tienes permiso para asignar códigos oficiales ISO.' });

    const documentRef = adminDb.collection('documents').doc(documentId);
    const auditRef = adminDb.collection('document_code_audit').doc();

    await adminDb.runTransaction(async transaction => {
      const documentSnap = await transaction.get(documentRef);
      if (!documentSnap.exists) throw Object.assign(new Error('Documento no encontrado'), { statusCode: 404 });

      const existing = documentSnap.data() || {};
      if (String(existing.code || existing.documentCode || existing.officialCode || existing.documentNumber || '').trim()) {
        throw Object.assign(new Error('El documento ya tiene un código oficial. La reasignación requiere un flujo separado de revisión.'), { statusCode: 409 });
      }

      const duplicateQueries = [
        adminDb.collection('documents').where('code', '==', code).limit(1),
        adminDb.collection('documents').where('documentCode', '==', code).limit(1),
        adminDb.collection('documents').where('officialCode', '==', code).limit(1),
        adminDb.collection('documents').where('documentNumber', '==', code).limit(1),
      ];
      const duplicateSnapshots = await Promise.all(duplicateQueries.map(query => transaction.get(query)));
      if (duplicateSnapshots.some(snapshot => !snapshot.empty)) {
        throw Object.assign(new Error('El código ya está asignado a otro documento.'), { statusCode: 409 });
      }

      transaction.update(documentRef, {
        code,
        codeStatus: 'official',
        codeAssignedAt: FieldValue.serverTimestamp(),
        codeAssignedBy: decoded.uid,
        codeAssignedByEmail: email,
        codeRevision: 1,
      });
      transaction.create(auditRef, {
        documentId,
        documentTitle: String(existing.title || existing.name || ''),
        assignedCode: code,
        action: 'ASSIGN_OFFICIAL_CODE',
        actorUid: decoded.uid,
        actorEmail: email,
        actorRole: role,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return send(res, 200, { success: true, documentId, code, status: 'official' });
  } catch (error: any) {
    const status = Number(error?.statusCode) || 500;
    if (status === 500) console.error('[document-code-assign]', error?.message || error);
    return send(res, status, { error: status === 500 ? 'No se pudo asignar el código documental.' : error.message });
  }
}
