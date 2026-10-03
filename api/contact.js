import { createProjectInquiry } from '../server/firebaseAdmin.js';

const rateBuckets = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const PROJECT_TYPES = new Set([
  'Business Website',
  'Landing Page',
  'E-commerce',
  'Restaurant Website',
  'Portfolio',
  'SaaS Website',
  'Website Redesign',
  'AI Integration',
  'Automation',
  'Other',
]);

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email) && email.length <= 254;
}

function isValidWebsite(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
}

function isValidSubmissionId(value) {
  return /^[A-Za-z0-9_-]{16,100}$/.test(value);
}

function isRateLimited(request) {
  const ip = String(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const existing = rateBuckets.get(ip) || [];
  const recent = existing.filter((timestamp) => now - timestamp < WINDOW_MS);
  recent.push(now);
  rateBuckets.set(ip, recent);
  return recent.length > MAX_REQUESTS;
}

function originIsAllowed(request) {
  const configured = process.env.ALLOWED_ORIGINS || process.env.PUBLIC_SITE_URL;
  const origin = request.headers.origin;

  // Server-to-server requests do not carry an Origin header. Browser requests in
  // production must match an explicitly configured public origin; local QA stays
  // usable when no deployment origin has been configured yet.
  if (!origin) return true;
  if (configured) {
    const allowed = configured.split(',').map((value) => value.trim().replace(/\/$/, '')).filter(Boolean);
    return allowed.includes(origin.replace(/\/$/, ''));
  }

  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
  return !isProduction;
}

async function sendOptionalNotification(inquiry, submissionId) {
  const apiKey = process.env.RESEND_API_KEY;
  const contactEmail = process.env.KATCH_CONTACT_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !contactEmail || !fromEmail) return;

  const safe = Object.fromEntries(Object.entries(inquiry).map(([key, value]) => [key, escapeHtml(value)]));
  const publicSiteUrl = clean(process.env.PUBLIC_SITE_URL, 300).replace(/\/$/, '');
  const projectUrl = publicSiteUrl ? `${publicSiteUrl}/admin/projects/${encodeURIComponent(submissionId)}` : '';
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [contactEmail],
      reply_to: inquiry.email,
      subject: `New Katch project request — ${inquiry.projectType}`,
      text: [
        `Name: ${inquiry.name}`,
        `Email: ${inquiry.email}`,
        `Company: ${inquiry.company}`,
        `Project type: ${inquiry.projectType}`,
        `Current website: ${inquiry.currentWebsite || 'Not provided'}`,
        '',
        'Project details:',
        inquiry.projectDetails,
        ...(projectUrl ? ['', `View project: ${projectUrl}`] : []),
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#11110f">
          <p style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#666">Katch / New project request</p>
          <h1 style="font-size:32px;line-height:1.1">${safe.projectType}</h1>
          <table style="width:100%;border-collapse:collapse;margin:28px 0">
            <tr><td style="padding:10px 0;border-bottom:1px solid #ddd;color:#666">Name</td><td style="padding:10px 0;border-bottom:1px solid #ddd">${safe.name}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #ddd;color:#666">Email</td><td style="padding:10px 0;border-bottom:1px solid #ddd">${safe.email}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #ddd;color:#666">Company</td><td style="padding:10px 0;border-bottom:1px solid #ddd">${safe.company}</td></tr>
            <tr><td style="padding:10px 0;border-bottom:1px solid #ddd;color:#666">Current website</td><td style="padding:10px 0;border-bottom:1px solid #ddd">${safe.currentWebsite || 'Not provided'}</td></tr>
          </table>
          <h2 style="font-size:18px">Project details</h2>
          <p style="line-height:1.7;white-space:pre-wrap">${safe.projectDetails}</p>
          ${projectUrl ? `<p style="margin-top:28px"><a href="${escapeHtml(projectUrl)}" style="display:inline-block;padding:12px 18px;background:#11110f;color:#fff;text-decoration:none">View project</a></p>` : ''}
        </div>
      `,
    }),
  });

  if (!emailResponse.ok) console.error('Resend notification failed:', emailResponse.status);
}

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ message: 'Method not allowed.' });
  }
  if (!originIsAllowed(request)) return response.status(403).json({ message: 'Unable to submit this request.' });
  if (Number(request.headers['content-length'] || 0) > 20_000) return response.status(413).json({ message: 'Unable to submit this request.' });
  if (isRateLimited(request)) return response.status(429).json({ message: 'Please wait a few minutes before trying again.' });

  let body = request.body || {};
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return response.status(400).json({ message: 'Unable to submit this request.' });
    }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response.status(400).json({ message: 'Unable to submit this request.' });
  }

  // Bots commonly fill this hidden field. Return success without storing data.
  if (body.faxNumber) return response.status(200).json({ ok: true });

  const submissionId = clean(body.submissionId, 100);
  const inquiry = {
    name: clean(body.name, 100),
    email: clean(body.email, 254).toLowerCase(),
    company: clean(body.company, 160),
    projectType: clean(body.projectType, 100),
    projectDetails: clean(body.projectDetails, 5000),
    currentWebsite: clean(body.currentWebsite, 500),
  };

  const valid = isValidSubmissionId(submissionId)
    && inquiry.name.length >= 2
    && isValidEmail(inquiry.email)
    && inquiry.company.length >= 2
    && PROJECT_TYPES.has(inquiry.projectType)
    && inquiry.projectDetails.length >= 20
    && isValidWebsite(inquiry.currentWebsite);

  if (!valid) return response.status(422).json({ message: 'Please check the required fields and try again.' });

  try {
    const result = await createProjectInquiry(submissionId, inquiry);
    if (!result.duplicate) {
      try {
        await sendOptionalNotification(inquiry, submissionId);
      } catch (error) {
        console.error('Project notification could not be sent:', error instanceof Error ? error.message : 'unknown_error');
      }
    }
    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('Project inquiry submission failed:', error instanceof Error ? error.message : 'unknown_error');
    return response.status(503).json({ message: 'Project requests are temporarily unavailable. Please try again shortly.' });
  }
}
