import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;

  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    const serviceAccount = JSON.parse(serviceAccountKey);
    adminApp = initializeApp({ credential: cert(serviceAccount) });
  } else {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }

  return adminApp;
}

export const adminAuth: Auth = new Proxy({} as Auth, {
  get: (_, prop) => {
    const target = getAuth(getAdminApp());
    const value = (target as Record<string, unknown>)[prop as string];
    return typeof value === 'function' ? (value as Function).bind(target) : value;
  },
});

export const adminDb: Firestore = new Proxy({} as Firestore, {
  get: (_, prop) => {
    const target = getFirestore(getAdminApp());
    const value = (target as Record<string, unknown>)[prop as string];
    return typeof value === 'function' ? (value as Function).bind(target) : value;
  },
});

export default getAdminApp;
