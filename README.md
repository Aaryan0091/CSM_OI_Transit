# CSM Engineers Order Tracker

React + TypeScript + Vite app for managing factory orders across departments, with Firebase auth/storage support.

## Current Architecture

- `src/App.tsx`: app shell and top-level state
- `src/components/auth`: sign-in and sign-up screens
- `src/components/dashboard`: header, filters, stats, banners, and order list UI
- `src/components/orders`: order editing and creation modals
- `src/services`: Firebase-facing auth and Firestore access
- `src/data/constants.ts`: theme tokens and departments
- `src/utils`: pure helpers and normalization logic

## Firebase Setup

Firebase is isolated to a small part of the project:

- `src/lib/firebase.ts`
- `src/services/auth.ts`
- `src/services/orders.ts`
- `src/services/users.ts`

Required setup:

1. Copy `.env.example` to your local env file and fill in the values.
   You can also use `.env.local.example` -> `.env.local`.
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

## Admin Access Workflow

Admin access is assigned manually while the project uses Firebase's free plan:

1. The user contacts the project owner outside the app.
2. The owner verifies the requester's identity and runs:
   `npm run set-admin-claim -- user@company.com`
3. The user signs out and signs back in to receive the updated admin token.

The code in `functions/` is reserved for a future automated email-approval workflow. It is not part of the active application because deploying Firebase Functions requires the Blaze plan.

## Live Order Updates

The dashboard subscribes to Firestore while a verified user is signed in. Order changes made by other employees appear automatically without refreshing the page, and the listener is removed when the user signs out.

Every order create/update is committed atomically with an immutable activity entry containing the authenticated actor, department, change summary, and Firestore server timestamp.

## Production Operations

- Vercel Web Analytics and Speed Insights are initialized in the frontend.
- Optional Firebase App Check support uses `VITE_FIREBASE_APP_CHECK_SITE_KEY`.
- Verification and password-reset emails return to `VITE_APP_URL` when configured.
- `npm run backup-firestore -- /absolute/output/directory` creates a private JSON export outside the repository.
- `.github/workflows/firestore-backup.yml` creates a weekly backup artifact after the repository owner configures its Firebase credential secret.
- Order dialogs are loaded only when opened, and stable dependencies are split into cacheable production chunks.
- See `FIREBASE_SETUP.md` for the safe App Check rollout and Firebase email-template settings.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
