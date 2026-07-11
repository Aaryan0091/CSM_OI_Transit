# CSM Engineers Order Tracker

React + TypeScript + Vite app for managing factory orders across departments, with optional Firebase auth/storage and a local sample-data fallback.

## Current Architecture

- `src/App.tsx`: app shell and top-level state
- `src/components/auth`: sign-in, sign-up, and admin-code screens
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

Required env vars:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_ADMIN_ACCESS_CODE`

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

## Local Fallback

If Firebase env vars are missing, the app still runs with local sample orders. That makes UI work and layout work easy even before backend setup is complete.

## Scripts

- `npm run dev`
- `npm run build`
- `npm run lint`
