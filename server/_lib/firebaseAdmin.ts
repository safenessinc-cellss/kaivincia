import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error(
      'Firebase Admin no configurado: falta FIREBASE_SERVICE_ACCOUNT_KEY (JSON de la service account)'
    );
  }

  let serviceAccount: any;
  try {
    serviceAccount = JSON.parse(raw);
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no es JSON válido: ' + (e as Error).message);
  }
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }

  initializeApp({ credential: cert(serviceAccount) });
  console.log('[firebaseAdmin] App inicializada para', serviceAccount.project_id);
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
