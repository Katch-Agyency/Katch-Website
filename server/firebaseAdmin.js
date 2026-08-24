import { createSign } from 'node:crypto';

let cachedToken = null;
let tokenExpiresAt = 0;

function requiredEnvironment() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!projectId || (!emulatorHost && (!clientEmail || !privateKey))) {
    throw new Error('firebase_server_not_configured');
  }
  return { projectId, clientEmail, privateKey, emulatorHost };
}

function base64Url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString('base64url');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && tokenExpiresAt - 60 > now) return cachedToken;

  const { clientEmail, privateKey } = requiredEnvironment();
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    scope: 'https://www.googleapis.com/auth/datastore',
    iat: now,
    exp: now + 3600,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsignedToken);
  signer.end();
  const signature = base64Url(signer.sign(privateKey));
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    console.error('Firebase access token request failed:', response.status);
    throw new Error('firebase_auth_failed');
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiresAt = now + Number(data.expires_in || 3600);
  return cachedToken;
}

function stringValue(value) {
  return { stringValue: value };
}

export async function createProjectInquiry(submissionId, inquiry) {
  const { projectId, emulatorHost } = requiredEnvironment();
  const accessToken = emulatorHost ? 'owner' : await getAccessToken();
  const now = new Date().toISOString();
  const apiOrigin = emulatorHost ? `http://${emulatorHost}` : 'https://firestore.googleapis.com';
  const endpoint = `${apiOrigin}/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/projects?documentId=${encodeURIComponent(submissionId)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fields: {
        name: stringValue(inquiry.name),
        email: stringValue(inquiry.email),
        company: stringValue(inquiry.company),
        projectType: stringValue(inquiry.projectType),
        projectDetails: stringValue(inquiry.projectDetails),
        currentWebsite: stringValue(inquiry.currentWebsite),
        status: stringValue('New'),
        createdAt: { timestampValue: now },
        updatedAt: { timestampValue: now },
        notes: stringValue(''),
      },
    }),
  });

  if (response.status === 409) return { duplicate: true };
  if (!response.ok) {
    console.error('Firestore project creation failed:', response.status);
    throw new Error('firestore_write_failed');
  }
  return { duplicate: false };
}
