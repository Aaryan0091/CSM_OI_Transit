# CSM Engineers Order Tracker

React + TypeScript + Vite app for managing factory orders across departments, with optional Firebase auth/storage and a local sample-data fallback.

## Current Architecture

- `src/App.tsx`: app shell and top-level state
- `src/components/auth`: sign-in and sign-up screens
- `src/components/dashboard`: header, filters, stats, banners, and order list UI
- `src/components/orders`: order editing and creation modals
- `src/services`: Firebase-facing auth and Firestore access
- `src/data/constants.ts`: theme tokens, departments, and sample orders
- `src/utils`: pure helpers and normalization logic

## Firebase Setup

Firebase is isolated to a small part of the project:

- `src/lib/firebase.ts`
- `src/services/auth.ts`
- `src/services/orders.ts`
- `src/services/users.ts`

Required setup:

1. Copy `.env.example` to your local env file and fill in the values.
2. Enable `Email/Password` sign-in in Firebase Authentication.
3. Create a Firestore collection named `users`.
4. For each Firebase Auth user, create a Firestore document whose id matches the auth `uid`.
5. Create admin users manually in Firebase/Auth + Firestore instead of exposing admin as a public signup role.

Required env vars:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
Example `users/{uid}` document:

```json
{
  "name": "Akhil",
  "dept": "Admin"
}
```

Allowed `dept` values:

- `Admin`
- `Sales`
- `Design`
- `Procurement`
- `Production`
- `QC`
- `Dispatch`

Public signup in the app is intentionally limited to department roles. For admin access, create the account yourself, set the corresponding Firestore profile, and grant the Firebase custom claim `admin: true`.

## Admin Setup

Production admin access in this app is based on Firebase custom claims, not a frontend-only code.

Required for an admin user:

1. Create the user in Firebase Authentication.
2. Create their `users/{uid}` Firestore profile document.
3. Grant the user the Firebase custom claim `admin: true` from a privileged server/Admin SDK environment.

The app treats a user as admin only when the Firebase ID token includes `admin: true`.

This repo includes a helper script for that:

1. Install the Firebase Admin SDK locally:
   `npm install -D firebase-admin`
2. Download a Firebase service account JSON file from Google Cloud / Firebase project settings.
3. Set `GOOGLE_APPLICATION_CREDENTIALS` to that JSON file path.
4. Run:
   `npm run set-admin-claim -- user@company.com`
5. Have that user sign out and sign back in so the updated token is picked up.

## Admin Request Workflow

The app now supports the first half of the approval flow in the frontend:

1. A non-admin signed-in user clicks `Request Admin Access`.
2. The app creates a pending document in `adminRequests`.
3. A Firebase Function emails the main admin with a secure approval link.
4. The approval link hits a privileged function that grants the Firebase custom claim `admin: true`.
5. The requester signs out and signs back in to pick up the new admin token.

Function setup required before this works end to end:

1. Copy `functions/.env.example` to a real `functions/.env`.
2. Install function dependencies inside `functions/`.
3. Deploy the functions in `functions/index.mjs`.
4. Configure these function environment variables:
   - `MAIN_ADMIN_EMAIL`
   - `APPROVAL_BASE_URL`
   - `ADMIN_APPROVAL_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_SECURE`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`

## Local Fallback

If Firebase env vars are missing, the app still runs with local sample orders. That makes UI work and layout work easy even before backend setup is complete.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
