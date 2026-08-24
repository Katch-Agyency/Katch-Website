import { spawn } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import net from 'node:net';
import { chromium } from 'playwright';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import contactHandler from '../api/contact.js';

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || 'demo-katch';
process.env.FIREBASE_PROJECT_ID = projectId;
process.env.FIRESTORE_EMULATOR_HOST ||= '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= '127.0.0.1:9099';

const adminEmail = 'admin@katch.local';
const adminPassword = 'LocalTestPassword123!';
const submissionId = '11111111-2222-4333-8444-555555555555';

function waitForPort(port, timeout = 30_000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const attempt = () => {
      const socket = net.createConnection(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(); });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - started > timeout) reject(new Error(`Port ${port} did not open`));
        else setTimeout(attempt, 200);
      });
    };
    attempt();
  });
}

function mockResponse() {
  return {
    code: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.code = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});
const adminApp = initializeApp({
  projectId,
  credential: cert({
    projectId,
    clientEmail: `firebase-adminsdk@${projectId}.iam.gserviceaccount.com`,
    privateKey,
  }),
});
const auth = getAuth(adminApp);
let user;
try {
  user = await auth.getUserByEmail(adminEmail);
} catch {
  user = await auth.createUser({ email: adminEmail, password: adminPassword, emailVerified: true });
}
await auth.setCustomUserClaims(user.uid, { admin: true });
const nonAdminEmail = 'viewer@katch.local';
try {
  await auth.getUserByEmail(nonAdminEmail);
} catch {
  await auth.createUser({ email: nonAdminEmail, password: adminPassword, emailVerified: true });
}

const request = {
  method: 'POST',
  headers: { origin: 'http://127.0.0.1:5174', 'x-forwarded-for': '127.0.0.1' },
  socket: { remoteAddress: '127.0.0.1' },
  body: {
    submissionId,
    name: 'Jordan Lee',
    email: 'jordan@example.com',
    company: 'North Studio',
    projectType: 'Business Website',
    projectDetails: 'We need a clear business website that explains our services and generates qualified inquiries.',
    currentWebsite: 'https://north.example.com',
    faxNumber: '',
  },
};
const response = mockResponse();
await contactHandler(request, response);
if (response.code !== 200 || !response.body?.ok) throw new Error(`Public submission failed: ${response.code}`);
const storedInquiry = await getFirestore(adminApp).doc(`projects/${submissionId}`).get();
if (!storedInquiry.exists) throw new Error('Inquiry was not stored in Firestore');
if (Object.hasOwn(storedInquiry.data(), 'budget')) throw new Error('Removed budget field was stored');
if (storedInquiry.data().status !== 'New' || storedInquiry.data().notes !== '') throw new Error('Default lead fields were not stored correctly');
const publicRead = await fetch(`http://${process.env.FIRESTORE_EMULATOR_HOST}/v1/projects/${projectId}/databases/(default)/documents/projects/${submissionId}`);
if (publicRead.ok) throw new Error('Firestore rules allowed a public project read');

const vite = spawn('npm', ['run', 'dev', '--', '--port', '5174'], {
  cwd: process.cwd(),
  detached: true,
  stdio: 'pipe',
  env: {
    ...process.env,
    VITE_FIREBASE_API_KEY: 'fake-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: `${projectId}.firebaseapp.com`,
    VITE_FIREBASE_PROJECT_ID: projectId,
    VITE_FIREBASE_STORAGE_BUCKET: `${projectId}.firebasestorage.app`,
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: '1:123456789:web:adminqa',
    VITE_USE_FIREBASE_EMULATORS: 'true',
  },
});
vite.stderr.on('data', (data) => process.stderr.write(data));

let browser;
try {
  await waitForPort(5174);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });

  await page.goto('http://127.0.0.1:5174/admin', { waitUntil: 'networkidle' });
  await page.waitForURL('**/admin/login');
  await page.locator('#admin-email').fill(adminEmail);
  await page.locator('#admin-password').fill(adminPassword);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('heading', { name: 'Dashboard' }).waitFor();
  await page.getByText('Jordan Lee').waitFor();

  const realtimeResponse = mockResponse();
  await contactHandler({
    ...request,
    body: {
      ...request.body,
      submissionId: 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee',
      name: 'Realtime Client',
      email: 'realtime@example.com',
      company: 'Realtime Company',
    },
  }, realtimeResponse);
  if (realtimeResponse.code !== 200) throw new Error('Realtime submission failed');
  await page.getByText('Realtime Client').waitFor();
  await page.waitForFunction(() => {
    const card = Array.from(document.querySelectorAll('.admin-stats article')).find((element) => element.textContent.includes('Total Projects'));
    return card?.querySelector('strong')?.textContent.trim() === '2';
  });
  if (process.env.ADMIN_QA_SCREENSHOTS === 'true') await page.screenshot({ path: 'audit/admin-dashboard.jpg', type: 'jpeg', quality: 82 });

  await page.getByText('Jordan Lee').first().click();
  await page.getByRole('heading', { name: 'Jordan Lee' }).waitFor();
  await page.getByRole('heading', { name: 'Project' }).waitFor();
  if (!(await page.getByText('North Studio').first().isVisible())) throw new Error('Stored company was not visible');

  const statusSelect = page.locator('.admin-detail-list select');
  await statusSelect.selectOption('In Discussion');
  await page.getByText('Status updated.').waitFor();
  await page.locator('.admin-detail-notes textarea').fill('Follow up on Tuesday and confirm the sitemap requirements.');
  await page.getByRole('button', { name: 'Save Note' }).click();
  await page.getByText('Internal notes saved.').waitFor();

  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Jordan Lee' }).waitFor();
  if ((await statusSelect.inputValue()) !== 'In Discussion') throw new Error('Status did not persist');
  if (!(await page.locator('.admin-detail-notes textarea').inputValue()).includes('Follow up on Tuesday')) throw new Error('Internal note did not persist');
  if (process.env.ADMIN_QA_SCREENSHOTS === 'true') await page.screenshot({ path: 'audit/admin-project-detail.jpg', type: 'jpeg', quality: 82 });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://127.0.0.1:5174/admin/projects', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Projects' }).waitFor();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 1) throw new Error(`Admin mobile overflow: ${overflow}px`);
  await page.locator('.admin-project-cards article').first().waitFor();
  if (!(await page.locator('.admin-project-cards').isVisible())) throw new Error('Mobile project cards were not visible');
  if (process.env.ADMIN_QA_SCREENSHOTS === 'true') await page.screenshot({ path: 'audit/admin-projects-mobile.jpg', type: 'jpeg', quality: 82 });

  await page.locator('.admin-mobile-header > button').click();
  await page.locator('.admin-drawer .admin-account button').click();
  await page.waitForURL('**/admin/login');
  await page.locator('#admin-email').fill(nonAdminEmail);
  await page.locator('#admin-password').fill(adminPassword);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByText('This account is not authorized for Katch Admin.').waitFor();
  await page.goto('http://127.0.0.1:5174/admin');
  await page.waitForURL('**/admin/login');

  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join(' | ')}`);
  console.log('Admin integration QA passed: submission → realtime dashboard → details → status → notes → mobile → logout protection.');
} finally {
  if (browser) await browser.close();
  if (vite.pid) {
    try { process.kill(-vite.pid, 'SIGTERM'); } catch { /* already stopped */ }
  }
}
