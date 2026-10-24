import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined,
} as const;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with auto-detect long polling and ignoreUndefinedProperties
const databaseId = (firebaseConfig as any).firestoreDatabaseId;
let dbInstance;

try {
  dbInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
      ignoreUndefinedProperties: true
    },
    databaseId || undefined
  );
} catch (e) {
  dbInstance = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
}

export const db = dbInstance;
export const auth = getAuth(app);

// Initialize storage with explicit bucket URL if auto-detection fails
let storageInstance;
try {
  storageInstance = getStorage(app);
} catch (e) {
  console.warn("Storage auto-initialization failed, trying with explicit bucket", e);
  if ((firebaseConfig as any).storageBucket) {
    storageInstance = getStorage(app, `gs://${(firebaseConfig as any).storageBucket}`);
  }
}
export const storage = storageInstance!;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // If user is unauthenticated during a read/listen subscription (GET/LIST), this is an expected
  // transient state during initial page load, route transitions, or logout. Handled gracefully.
  if (!auth.currentUser && (operationType === OperationType.GET || operationType === OperationType.LIST)) {
    console.warn(`[Firestore] Unauthenticated read handled gracefully on ${path}`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email || undefined,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId || undefined,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Do not throw for read/listen subscriptions (GET/LIST) to prevent crashing the React UI.
  // Throw for mutations (CREATE/UPDATE/DELETE/WRITE) so they can be caught by the action UI.
  if (operationType !== OperationType.GET && operationType !== OperationType.LIST) {
    throw new Error(JSON.stringify(errInfo));
  }
}
