import { adminAuth, adminDb } from '../_lib/firebaseAdmin.js';
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
  if (snap.exists) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ user: snap.data() }));
    return;
  }

  const isSuperAdmin = SUPERADMINS.includes(decoded.email || '');
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
