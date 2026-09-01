// One-time migration: the 12 jobs seeded in Phase 3A predate the
// applicationCount field that Phase 3B's rules now depend on. Run this
// BEFORE publishing the new firestore.rules (it only needs the currently-
// live rules — a plain field-add the owning employer is already allowed to
// do) so no existing job is left without the field the new rules read.
//
//   node scripts/backfillApplicationCount.mjs

import { readFileSync } from 'fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'

const envText = readFileSync('.env', 'utf8')
const env = {}
for (const line of envText.split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) env[m[1]] = m[2].trim()
}

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

const SEED_EMPLOYER_EMAIL = 'seed-employer@arconnect.dev'
const SEED_EMPLOYER_PASSWORD = 'SeedEmployer123!'

async function main() {
  const cred = await signInWithEmailAndPassword(auth, SEED_EMPLOYER_EMAIL, SEED_EMPLOYER_PASSWORD)
  const q = query(collection(db, 'jobs'), where('employerId', '==', cred.user.uid))
  const snap = await getDocs(q)

  let updated = 0
  let skipped = 0
  for (const jobDoc of snap.docs) {
    const data = jobDoc.data()
    if (typeof data.applicationCount === 'number') {
      skipped++
      continue
    }
    await updateDoc(doc(db, 'jobs', jobDoc.id), { applicationCount: 0 })
    console.log('Backfilled applicationCount=0 on', jobDoc.id, '-', data.title)
    updated++
  }

  console.log(`\nDone. ${updated} job(s) backfilled, ${skipped} already had the field.`)
}

main().catch((err) => {
  console.error('SCRIPT ERROR:', err)
  process.exitCode = 1
})
