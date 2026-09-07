import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `m_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-matches')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ candSuspended = false } = {}) {
  const candA = nextId('cand'), candB = nextId('cand')
  const empA = nextId('emp'), empB = nextId('emp')
  const jobA = nextId('job')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', candA), {
      role: 'candidate', full_name: 'Cand A', email: 'a@c.com',
      ...(candSuspended ? { moderationStatus: 'suspended' } : {}),
    })
    await setDoc(doc(db, 'users', candB), { role: 'candidate', full_name: 'Cand B', email: 'b@c.com' })
    await setDoc(doc(db, 'users', empA), { role: 'employer', full_name: 'Emp A', email: 'a@e.com' })
    await setDoc(doc(db, 'users', empB), { role: 'employer', full_name: 'Emp B', email: 'b@e.com' })
    await setDoc(doc(db, 'jobs', jobA), {
      employerId: empA, title: 'React Developer', companyName: 'XYZ Pvt Ltd',
      location: 'Noida', jobType: 'Full-time', workMode: 'Remote', experienceLevel: 'Fresher',
      skills: ['React'], status: 'active', applicationCount: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
  })
  return { candA, candB, empA, empB, jobA }
}

// Shape matches exactly what computeMatch (functions/index.js) actually
// writes via the Admin SDK -- these tests only exercise CLIENT access to an
// already-written match document, never the Cloud Function's own logic
// (that's covered by functions/src/matching/*.test.js).
function validMatch({ candidateId, jobId, employerId }) {
  return {
    candidateId,
    jobId,
    employerId,
    score: 72,
    breakdown: {
      skills: { score: 100, weight: 35, available: true },
      experience: { score: 100, weight: 20, available: true },
      location: { score: 100, weight: 15, available: true },
      salary: { score: null, weight: 15, available: false },
      jobType: { score: 100, weight: 10, available: true },
      workMode: { score: 100, weight: 5, available: true },
    },
    explanation: 'Strong alignment on required skills.',
    explanationSource: 'fallback-template',
    algorithmVersion: 'rule-v1',
    inputHash: 'deadbeef',
    computedAt: serverTimestamp(),
  }
}

async function seedMatch(f) {
  const matchId = `${f.candA}_${f.jobA}`
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'matches', matchId), validMatch({ candidateId: f.candA, jobId: f.jobA, employerId: f.empA }))
  })
  return matchId
}

describe('matches.read -- owning candidate or owning employer only', () => {
  test('the candidate who owns the match can read it', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDoc(doc(db, 'matches', matchId)))
  })

  test('the employer who owns the job can read the match', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(getDoc(doc(db, 'matches', matchId)))
  })

  test('an unrelated candidate cannot read another candidate\'s match', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(getDoc(doc(db, 'matches', matchId)))
  })

  test('an employer who does not own the job cannot read the match', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.empB).firestore()
    await assertFails(getDoc(doc(db, 'matches', matchId)))
  })

  test('an unauthenticated user cannot read the match', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'matches', matchId)))
  })

  // matches.read carries no isNotSuspended() check, matching every other
  // `allow read` in this ruleset -- suspension gates writes throughout this
  // file, never reads (see the isNotSuspended() grep: it appears only on
  // create/update/delete branches). This test confirms that existing model
  // actually holds here too, rather than assuming it.
  test('a suspended candidate can still read their own match -- suspension gates writes, not reads, matching the rest of this ruleset', async () => {
    const f = await seedScenario({ candSuspended: true })
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDoc(doc(db, 'matches', matchId)))
  })
})

describe('matches.create / update / delete -- unconditionally denied for every client', () => {
  test('the owning candidate cannot create a match document', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'matches', `${f.candA}_${f.jobA}`), validMatch({ candidateId: f.candA, jobId: f.jobA, employerId: f.empA }))
    )
  })

  test('the owning employer cannot create a match document', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'matches', `${f.candA}_${f.jobA}`), validMatch({ candidateId: f.candA, jobId: f.jobA, employerId: f.empA }))
    )
  })

  test('the owning candidate cannot update their own match (e.g. to inflate the score)', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'matches', matchId), { score: 100 }))
  })

  test('the owning employer cannot update the match', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'matches', matchId), { score: 100 }))
  })

  test('the owning candidate cannot delete their own match', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(deleteDoc(doc(db, 'matches', matchId)))
  })

  test('the owning employer cannot delete the match', async () => {
    const f = await seedScenario()
    const matchId = await seedMatch(f)
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(deleteDoc(doc(db, 'matches', matchId)))
  })
})
