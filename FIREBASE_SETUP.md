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
