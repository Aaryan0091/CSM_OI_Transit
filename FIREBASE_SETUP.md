# Firebase Setup Placeholders

Use these local files to paste your real Firebase values:

## Frontend app config

1. Copy `.env.local.example` to `.env.local`
2. Paste these Firebase Web App values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_APP_CHECK_SITE_KEY` (add only after registering the web app in App Check)
- `VITE_APP_URL` (the deployed HTTPS URL used by verification and reset emails)

## Functions / admin approval config

1. Copy `functions/.env.local.example` to `functions/.env`
2. Paste these values:

- `MAIN_ADMIN_EMAIL`
- `APPROVAL_BASE_URL`
- `ADMIN_APPROVAL_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Notes

- Keep `.env.local` and `functions/.env` private.
- Do not commit real credentials.
- Vite will read `.env.local` automatically for the frontend.

## App Check rollout

1. In Firebase Console, open **App Check** and register the web app with reCAPTCHA v3.
2. Add the public site key as `VITE_FIREBASE_APP_CHECK_SITE_KEY` locally and in Vercel Production.
3. Redeploy and confirm valid App Check requests appear in Firebase metrics.
4. Only then enable enforcement for Cloud Firestore and Authentication.

Do not enable enforcement before the key is deployed, or legitimate users will be blocked.

## Authentication email branding

In Firebase Console, open **Authentication > Templates** and customize both **Email address verification** and **Password reset**:

- Sender name: `CSM Engineers`
- Verification subject: `Verify your email for CSM Order Tracker`
- Password-reset subject: `Reset your CSM Order Tracker password`
- Keep the Firebase action link placeholder in each template.

If the company owns a custom domain, use **Customize domain** in each template and add the DNS records Firebase provides. Otherwise, keep Firebase's default sending domain.

## Monitoring

The frontend includes Vercel Web Analytics and Speed Insights. Enable both features in the Vercel project dashboard, then redeploy to begin collecting production traffic and Core Web Vitals.

## Free-plan backups

Firestore scheduled backups require Blaze. On the free plan, create an encrypted/private local JSON backup with:

1. Set `GOOGLE_APPLICATION_CREDENTIALS` to the service-account JSON outside this repository.
2. Run `npm run backup-firestore -- /absolute/path/outside/this/project`.

The script exports top-level collections and nested order activity, refuses repository destinations, and writes owner-only files. Store copies on at least two protected devices or storage locations.
