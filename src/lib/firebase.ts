import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean)

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY

export const isAppCheckConfigured = Boolean(app && appCheckSiteKey)
let appCheckInstance: AppCheck | null = null

if (app && appCheckSiteKey) {
  if (import.meta.env.DEV) {
    const debugGlobal = globalThis as typeof globalThis & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean
    }

    debugGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN = true
  }

  appCheckInstance = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  })
} else if (app && import.meta.env.DEV) {
  console.warn(
    'Firebase App Check is not configured locally. Add VITE_FIREBASE_APP_CHECK_SITE_KEY to your local env file.',
  )
}

export const appCheck = appCheckInstance
export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
