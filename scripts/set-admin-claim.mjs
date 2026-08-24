import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const uid = process.argv[2] || process.env.FIREBASE_ADMIN_UID;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!uid || !projectId || !clientEmail || !privateKey) {
  console.error('Usage: FIREBASE_PROJECT_ID=... FIREBASE_CLIENT_EMAIL=... FIREBASE_PRIVATE_KEY=... npm run admin:grant -- <uid>');
  process.exit(1);
}

const app = getApps()[0] || initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const user = await auth.getUser(uid);
await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), admin: true });
await auth.revokeRefreshTokens(uid);
console.log(`Admin access granted to ${user.email || uid}. The user must sign in again.`);
