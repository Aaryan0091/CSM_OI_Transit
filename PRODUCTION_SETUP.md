# Production Setup Checklist

## Safe deployment order

Order writes now require an atomic activity-history entry. Deploy during a short maintenance window when employees are not editing orders:

1. Commit and push the frontend changes to both repositories.
2. Wait for the friend's Vercel production deployment to finish.
3. Add the new production environment variables listed below and redeploy.
4. Deploy the matching Firestore rules:
   `npx firebase deploy --only firestore:rules --project csm-oi-transit`
5. Ask all signed-in employees to refresh the site.
6. Test one Admin create/update and one department update.

## Vercel project owner

In the friend's Vercel project:

1. Open **Settings > Environment Variables**.
2. Add `VITE_APP_URL` with the exact production HTTPS URL.
3. After Firebase App Check registration, add `VITE_FIREBASE_APP_CHECK_SITE_KEY` with the public reCAPTCHA v3 site key.
4. Scope both variables to **Production** (and Preview only if previews use the same Firebase project).
5. Open **Analytics** and enable Web Analytics.
6. Open **Speed Insights** and enable Speed Insights.
7. Redeploy after changing environment variables.

## Firebase project owner

Sign into an account that can manage `csm-oi-transit`.

### App Check

1. Open **App Check > Apps** and select the web app.
2. Register it with **reCAPTCHA v3** using the production domain.
3. Copy the public site key to Vercel as `VITE_FIREBASE_APP_CHECK_SITE_KEY`.
4. Redeploy the site.
5. Use the deployed app and confirm valid requests appear under **App Check > Metrics**.
6. Enable enforcement for **Cloud Firestore** only after valid requests are visible.
7. Enable Authentication enforcement later, after its metrics also show valid requests.

### Authentication email templates

Open **Authentication > Templates** and edit both templates:

- Sender name: `CSM Engineers`
- Verification subject: `Verify your email for CSM Order Tracker`
- Password-reset subject: `Reset your CSM Order Tracker password`
- Keep Firebase's action-link placeholder in the message body.
- Add the production domain under **Authentication > Settings > Authorized domains**.

If the company owns a custom domain, use **Customize domain** and add Firebase's DNS records. Do not enable a custom sending domain until Firebase reports verification complete.

## Backups on the free plan

Firebase scheduled backups require Blaze, so use the local backup command:

1. Keep the service-account JSON outside the repository.
2. Set `GOOGLE_APPLICATION_CREDENTIALS` to its absolute path.
3. Run:
   `npm run backup-firestore -- /absolute/private/backup/directory`
4. Confirm the resulting JSON file is non-empty.
5. Keep a second encrypted copy on another protected device or storage provider.

Run a backup before major releases and at least weekly while the app contains active orders.
