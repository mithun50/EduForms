/**
 * Seed script to create the initial super admin.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts
 *
 * Make sure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY
 * are set in .env.local before running.
 */

import { initializeApp, cert, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';

config({ path: '.env.local' });

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY));
} else {
  credential = cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  } as ServiceAccount);
}

const app = initializeApp({ credential });
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_EMAIL = process.argv[2] || 'admin@eduforms.com';
const ADMIN_PASSWORD = process.argv[3] || 'admin123456';
const ADMIN_NAME = process.argv[4] || 'Super Admin';

async function seed() {
  try {
    console.log('Creating super admin...');

    // Check if already exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log('User already exists:', userRecord.uid);
    } catch {
      userRecord = await auth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: ADMIN_NAME,
      });
      console.log('Created Firebase Auth user:', userRecord.uid);
    }

    // Create/update admin doc
    await db.collection('admins').doc(userRecord.uid).set({
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: 'super_admin',
      institutionId: null,
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    console.log('Admin document created in Firestore');
    console.log('\n--- Super Admin Credentials ---');
    console.log(`Email:    ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('-------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed();
