// Emulator-only test fixture seeding. Uses the Admin SDK (bypasses
// security rules entirely, same as a real test-fixture setup would) and
// only ever talks to the local emulators — never production. Requires
// FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST to already be set
// (see functions/scripts/run-emulator-tests.sh).

import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error('Refusing to run: FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST not set.')
  console.error('This script must only ever run against the local emulator, never production.')
  process.exit(1)
}

initializeApp({ projectId: 'arconnect-7337f' })
const db = getFirestore()
const auth = getAuth()

async function upsertAuthUser(email, password) {
  try {
    return await auth.getUserByEmail(email)
  } catch {
    return auth.createUser({ email, password, emailVerified: true })
  }
}

async function main() {
  const employer = await upsertAuthUser('emulator-employer@example.com', 'TestPass123!')
  await db.doc(`users/${employer.uid}`).set({
    full_name: 'Emulator Test Employer',
    email: employer.email,
    role: 'employer',
    phone: null,
    avatar_url: null,
    created_at: new Date(),
    updated_at: new Date(),
  })

  const jobRef = db.collection('jobs').doc('emulator-seed-job-01')
  await jobRef.set({
    title: 'Sales Executive',
    companyName: 'Emulator Test Co',
    employerId: employer.uid,
    location: 'Varanasi',
    workMode: 'Onsite',
    jobType: 'Full-time',
    experienceLevel: '0-2 years',
    salaryMin: 18000,
    salaryMax: 25000,
    skills: ['Sales', 'Communication', 'MS Excel', 'Negotiation'],
    description: 'Seeded for Phase 4 emulator testing.',
    responsibilities: ['Visit local shops', 'Meet sales targets'],
    requirements: ['12th Pass'],
    employerVerified: true,
    status: 'active',
    applicationCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  const candidate = await upsertAuthUser('emulator-candidate@example.com', 'TestPass123!')
  await db.doc(`users/${candidate.uid}`).set({
    full_name: 'Emulator Test Candidate',
    email: candidate.email,
    role: 'candidate',
    phone: null,
    avatar_url: null,
    created_at: new Date(),
    updated_at: new Date(),
  })

  console.log('Seeded emulator fixtures:')
  console.log('  employer uid:', employer.uid)
  console.log('  candidate uid:', candidate.uid)
  console.log('  job id: emulator-seed-job-01')
}

main().then(() => process.exit(0))
