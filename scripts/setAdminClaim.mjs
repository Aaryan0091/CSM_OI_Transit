#!/usr/bin/env node

const [, , email] = process.argv

if (!email) {
  console.error('Usage: node scripts/setAdminClaim.mjs user@company.com')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    'Set GOOGLE_APPLICATION_CREDENTIALS to your Firebase service account JSON file before running this script.',
  )
  process.exit(1)
}

let initializeApp
let applicationDefault
let getAuth

try {
  const admin = await import('firebase-admin/app')
  const auth = await import('firebase-admin/auth')
  initializeApp = admin.initializeApp
  applicationDefault = admin.applicationDefault
  getAuth = auth.getAuth
} catch {
  console.error(
    'Missing dependency: install firebase-admin before running this script.',
  )
  console.error('Example: npm install -D firebase-admin')
  process.exit(1)
}

initializeApp({
  credential: applicationDefault(),
})

try {
  const user = await getAuth().getUserByEmail(email)

  await getAuth().setCustomUserClaims(user.uid, {
    admin: true,
  })

  console.log(`Admin claim granted to ${email} (${user.uid})`)
  console.log('Ask the user to sign out and sign back in to refresh their token.')
} catch (error) {
  console.error('Failed to grant admin claim:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
