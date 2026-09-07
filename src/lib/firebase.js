import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { getStorage, connectStorageEmulator } from 'firebase/storage'

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
// Pinned to asia-south1 to match computeMatch's deployed region (see
// functions/index.js) — computeMatch is the only callable this app has, so
// this is a required counterpart to that region pin, not a default. A
// mismatched region here would make computeMatch uncallable in production
// (the client would call a region the function was never deployed to),
// not just slower.
export const functions = getFunctions(app, 'asia-south1')
// Resume upload (see src/services/resumeService.js) is the first feature
// that needs Storage. getStorage() only constructs a client SDK instance
// bound to the configured bucket — it makes no network call, so this is
// safe to have even before Storage is actually enabled in the Firebase
// Console. Uploads/downloads themselves will fail with a clear error
// until that's done (and until the project is on the Blaze plan, which
// Cloud Storage for Firebase now requires) — see README's Known
// limitations. The existing resumeLink URL field keeps working regardless.
export const storage = getStorage(app)

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
  connectStorageEmulator(storage, '127.0.0.1', 9199)
  console.info('[firebase] Connected to local emulators (Auth/Firestore/Functions/Storage).')
}
