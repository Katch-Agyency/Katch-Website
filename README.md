# Katch — Production Website + Secure Admin

A production React/Vite website for Katch with a real Firebase-backed project inquiry flow and protected lead-management admin area.

## Architecture

```text
Public website
  → POST /api/contact (validated Vercel Function)
  → Cloud Firestore projects collection
  → optional Resend notification

Admin
  → Firebase Authentication
  → admin custom claim check
  → Firestore real-time listeners
  → Firestore Security Rules enforce admin-only reads/updates
```

The public browser never receives service-account credentials and cannot read or write the `projects` collection directly. The submission endpoint uses server-only credentials. Firebase client configuration is loaded only with the lazy admin bundle.

## Routes

### Public

- `/`
- `/demos`
- `/demos/smash-burger`
- `/demos/bta3-7awa4y`
- `/demos/raw`
- `/demos/refined-artistry`
- `/services`
- `/process`
- `/about`
- `/contact`

### Protected admin

- `/admin/login`
- `/admin`
- `/admin/projects`
- `/admin/projects/:projectId`

Admin routes are omitted from public navigation, marked `noindex`, and protected by Firebase Authentication plus an `admin: true` custom claim. Firestore rules independently enforce authorization.

## Project inquiry model

```text
projects/{submissionId}
  name
  email
  company
  projectType
  projectDetails
  currentWebsite
  status            // New by default
  createdAt
  updatedAt
  notes             // admin-only internal notes
```

No budget value is collected or stored. Submission IDs provide idempotency so network retries do not create duplicate leads.

## Run locally

```bash
npm install
npm run dev
```

Without Firebase environment variables, the public site still renders and `/admin` safely redirects to a configuration-aware login screen. Real submissions require Firebase server configuration.

## Firebase production setup

1. Create a Firebase project.
2. Create a Firebase Web App and copy its web configuration.
3. Enable **Authentication → Email/Password**.
4. Create a **Cloud Firestore** database.
5. Install/login to the Firebase CLI and deploy the included rules:

```bash
npx firebase-tools login
npx firebase-tools use YOUR_PROJECT_ID
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

6. In Firebase Authentication, create the real admin user.
7. Copy that user's UID.
8. Load the server service-account environment variables locally, then grant the custom claim:

```bash
npm run admin:grant -- FIREBASE_AUTH_UID
```

The script requires `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. It stores no password and revokes existing sessions so the admin signs in again with the new claim.

## Environment variables

Copy `.env.example` to `.env.local` for local configuration. In Vercel, add the same values through project settings.

### Firebase web configuration

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

These are Firebase public app identifiers, not administrator credentials. Firestore Rules provide authorization.

### Server-only Firebase service account

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Never prefix these values with `VITE_`, expose them to client code, or commit them.

### Submission controls

```env
VITE_CONTACT_ENDPOINT=/api/contact
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
PUBLIC_SITE_URL=https://your-domain.com
```

### Optional Resend notification

```env
RESEND_API_KEY=re_...
KATCH_CONTACT_EMAIL=projects@your-domain.com
RESEND_FROM_EMAIL=Katch Website <website@your-verified-domain.com>
```

Firestore storage succeeds independently of optional notification delivery.

## Admin capabilities

- Real-time recent inquiries
- Total, New, In Discussion, and Won counts
- Latest 100 project requests with an efficient real-time query
- Search by name, company, or email
- Filter by status and project type
- Newest/oldest sorting
- Responsive desktop table and mobile cards
- Detailed client/project view
- Immediate status updates
- Private internal notes
- Copy email, mail client, and open website actions
- Archive status with confirmation
- Loading, empty, error, unauthorized, and configuration states

## Security model

`firestore.rules` enforces:

- No public reads
- No direct public creates
- Admin custom claim required for reads
- Admin custom claim required for updates
- Updates restricted to `status`, `notes`, and `updatedAt`
- Valid status allowlist
- Notes maximum length
- No document deletion

The public submission function separately validates field types, lengths, email, project type, URL, origin, request size, honeypot, rate limit, and idempotency key before using server credentials to store the inquiry.

## Automated QA

### Public website and protected-login QA

Start the development server, then run:

```bash
npm run qa
```

This covers public routes at 320–1920px, demo routes, refresh behavior, mobile navigation, overflow, history, form validation, removed budget field, current website normalization, disabled submission state, and protected admin redirects.

### Full Firebase integration QA

```bash
npm run qa:admin
```

This launches Firebase Auth and Firestore emulators and verifies the complete flow:

```text
validated submission
→ Firestore storage
→ real-time dashboard
→ project details
→ persisted status update
→ persisted private notes
→ responsive mobile cards
→ logout and route protection
```

No production Firebase data is touched.

## Production checks

```bash
npm run audit:production
npm audit --omit=dev
```

The public and admin applications are route-split. Firebase Auth and Firestore are downloaded only when an admin route is opened.

## Vercel deployment

1. Import the repository.
2. Framework: **Vite**.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Configure all production Firebase and origin variables.
6. Deploy Firestore rules.
7. Create and claim the real admin user.
8. Deploy the site.
9. Submit a real project request.
10. Verify it appears in `/admin` and persists after status/note updates.

`vercel.json` contains public/admin SPA rewrites, admin noindex headers, asset caching, and baseline security headers.

## Updating content

- Demo data: `src/data/projects.js`
- Services/process: `src/data/services.js`
- Public pages: `src/pages/`
- Admin: `src/admin/`
- Submission boundary: `api/contact.js`
- Firestore server integration: `server/firebaseAdmin.js`
- Security rules: `firestore.rules`
