import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

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
export const functions = getFunctions(app)

// Storage is intentionally not initialized here — nothing in the app uses
// file uploads yet. Add `import { getStorage } from 'firebase/storage'`
// and `export const storage = getStorage(app)` back in when a feature
// (resume/avatar upload) actually needs it, so it doesn't bloat the bundle
// before it's used.

// Explicit opt-in only — VITE_USE_FIREBASE_EMULATOR=true in .env.local.
// Deliberately NOT tied to import.meta.env.DEV: `npm run dev` should keep
// working against the real project by default (that's how every prior
// phase's live testing worked), and this flag is the one place that
// changes. Never enabled unless a developer asks for it, and never
// possible in a production build since `VITE_*` env behavior is
// build-time and this is an explicit local .env.local setting.
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectFunctionsEmulator(functions, '127.0.0.1', 5001)
  console.info('[firebase] Connected to local emulators (Auth/Firestore/Functions).')
}
