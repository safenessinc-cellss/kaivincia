import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminConfigured = getApps().length > 0;

if (!adminConfigured) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      const serviceAccount: any = JSON.parse(raw);
      if (typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({ credential: cert(serviceAccount) });
      adminConfigured = true;
      console.log('[firebaseAdmin] App inicializada para', serviceAccount.project_id);
    } catch (error) {
      console.error('[firebaseAdmin] No se pudo inicializar Firebase Admin:', (error as Error).message);
    }
  }
}

export const isFirebaseAdminConfigured = adminConfigured;

export const adminAuth = adminConfigured ? getAuth() : null as unknown as ReturnType<typeof getAuth>;
export const adminDb = adminConfigured ? getFirestore() : null as unknown as ReturnType<typeof getFirestore>;
