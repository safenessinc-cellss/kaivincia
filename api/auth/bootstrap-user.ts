import { adminAuth, adminDb } , isFirebaseAdminConfigured } from '../../server/_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const SUPERADMINS = (process.env.SUPERADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim())
  .filter(Boolean);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!isFirebaseAdminConfigured) {
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: 'Firebase Admin no está configurado para este entorno.' }));
    return;
  }

  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing token' }));
    return;
  }

  let decoded: any;
  try {
    decoded = await adminAuth.verifyIdToken(authHeader.slice(7).trim());
  } catch {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid token' }));
    return;
  }

  const userRef = adminDb.collection('users').doc(decoded.uid);
  const snap = await userRef.get();
  const isSuperAdmin = SUPERADMINS.some((email) =>
    email.toLowerCase() === String(decoded.email || '').toLowerCase()
  );

  // Repair legacy allowlisted SuperAdmin profiles that were accidentally created
  // as role "none"/"tlmk" or left pending by the old client-side bootstrap.
  if (snap.exists) {
    const existing = snap.data() || {};
    if (isSuperAdmin && (existing.role !== 'superadmin' || existing.status === 'pending' || !existing.status)) {
      const repaired = {
        role: 'superadmin',
        status: 'active',
        email: decoded.email || existing.email || null,
        uid: decoded.uid,
        updatedAt: new Date().toISOString(),
      };
      await userRef.set(repaired, { merge: true });
      const updated = { ...existing, ...repaired };
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ user: updated, repaired: true }));
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ user: existing }));
    return;
  }
  const profile = {
    uid: decoded.uid,
    name: decoded.name || (decoded.email || '').split('@')[0] || 'Usuario',
    email: decoded.email || null,
    role: isSuperAdmin ? 'superadmin' : 'none',
    status: isSuperAdmin ? 'active' : 'pending',
    avatarUrl: decoded.picture || '',
    createdAt: new Date().toISOString(),
    lastLogin: FieldValue.serverTimestamp(),
  };

  await userRef.set(profile, { merge: true });
  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ user: profile }));
}
