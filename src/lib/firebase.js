import { initializeApp } from 'firebase/app'
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

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId
)

if (!isFirebaseConfigured) {
  console.warn(
    '[firebase] VITE_FIREBASE_* env vars are not fully set. ' +
      'Copy .env.example to .env and fill in your Firebase project config. ' +
      'Authentication will not work until this is configured.'
  )
}

// Falls back to harmless placeholders so initializeApp never throws when env
// vars are missing — isFirebaseConfigured is what callers should check
// before relying on auth actually working.
const app = initializeApp(
  isFirebaseConfigured
    ? firebaseConfig
    : {
        apiKey: 'placeholder-api-key',
        authDomain: 'placeholder.firebaseapp.com',
        projectId: 'placeholder-project',
      }
)

export const auth = getAuth(app)
export const db = getFirestore(app)

// Storage is intentionally not initialized here — nothing in the app uses
// file uploads yet. Add `import { getStorage } from 'firebase/storage'`
// and `export const storage = getStorage(app)` back in when a feature
// (resume/avatar upload) actually needs it, so it doesn't bloat the bundle
// before it's used.
