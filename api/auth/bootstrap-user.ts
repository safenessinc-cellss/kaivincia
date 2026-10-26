import { adminAuth, adminDb } from '../../server/_lib/firebaseAdmin.js';
import { FieldValue } from 'firebase-admin/firestore';

const AUTHORIZED_SUPERADMIN_EMAIL = 'safeness.c.a@gmail.com';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
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
  const isSuperAdmin = String(decoded.email || '').trim().toLowerCase() === AUTHORIZED_SUPERADMIN_EMAIL;

  // Repair legacy allowlisted SuperAdmin profiles that were accidentally created
  // as role "none"/"tlmk" or left pending by the old client-side bootstrap.
  if (snap.exists) {
    const existing = snap.data() || {};
    if (isSuperAdmin && !['rejected', 'suspended'].includes(String(existing.status || '').toLowerCase()) &&
        (existing.role !== 'superadmin' || existing.status !== 'approved')) {
      const repaired = {
        role: 'superadmin',
        status: 'approved',
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
    status: isSuperAdmin ? 'approved' : 'pending',
    avatarUrl: decoded.picture || '',
    createdAt: new Date().toISOString(),
    lastLogin: FieldValue.serverTimestamp(),
  };

  await userRef.set(profile, { merge: true });
  res.statusCode = 201;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ user: profile }));
}
