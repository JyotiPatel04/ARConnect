import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `sj_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-saved-jobs')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ candSuspended = false } = {}) {
  const candA = nextId('cand'), candB = nextId('cand')
  const jobA = nextId('job')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', candA), {
      role: 'candidate', full_name: 'Cand A', email: 'a@c.com',
      ...(candSuspended ? { moderationStatus: 'suspended' } : {}),
    })
    await setDoc(doc(db, 'users', candB), { role: 'candidate', full_name: 'Cand B', email: 'b@c.com' })
    await setDoc(doc(db, 'jobs', jobA), {
      employerId: nextId('emp'), title: 'React Developer', companyName: 'XYZ Pvt Ltd',
      location: 'Noida', jobType: 'Full-time', workMode: 'Remote', experienceLevel: 'Fresher',
      skills: ['React'], status: 'active', applicationCount: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
  })
  return { candA, candB, jobA }
}

// Matches exactly what savedJobService.js's saveJob() actually writes.
function validSavedJob({ candidateId, jobId }) {
  return {
    candidateId,
    jobId,
    jobTitle: 'React Developer',
    companyName: 'XYZ Pvt Ltd',
    salaryMin: 15000,
    salaryMax: 25000,
    location: 'Noida',
    employerVerified: false,
    savedAt: serverTimestamp(),
  }
}

async function seedSavedJob(f) {
  const savedJobId = `${f.candA}_${f.jobA}`
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'savedJobs', savedJobId), validSavedJob({ candidateId: f.candA, jobId: f.jobA }))
  })
  return savedJobId
}

describe('savedJobs.read -- owner only', () => {
  test('the owning candidate can read their own saved job', async () => {
    const f = await seedScenario()
    const savedJobId = await seedSavedJob(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDoc(doc(db, 'savedJobs', savedJobId)))
  })

  test('a different candidate cannot read another candidate\'s saved job', async () => {
    const f = await seedScenario()
    const savedJobId = await seedSavedJob(f)
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(getDoc(doc(db, 'savedJobs', savedJobId)))
  })

  test('an unauthenticated user cannot read a saved job', async () => {
    const f = await seedScenario()
    const savedJobId = await seedSavedJob(f)
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'savedJobs', savedJobId)))
  })
})

describe('savedJobs.create -- ownership, composite id, suspension', () => {
  test('the owning candidate can create their own saved job', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'savedJobs', `${f.candA}_${f.jobA}`), validSavedJob({ candidateId: f.candA, jobId: f.jobA }))
    )
  })

  test('cannot create a saved job whose candidateId field belongs to another candidate', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    // Doc id still matches candA's own naming -- isolates the candidateId
    // field check specifically, independent of the composite-id check.
    await assertFails(
      setDoc(doc(db, 'savedJobs', `${f.candA}_${f.jobA}`), validSavedJob({ candidateId: f.candB, jobId: f.jobA }))
    )
  })

  test('cannot create a saved job whose document id does not match {candidateId}_{jobId}', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    // candidateId field is correct; only the doc id is wrong.
    await assertFails(
      setDoc(doc(db, 'savedJobs', nextId('mismatched')), validSavedJob({ candidateId: f.candA, jobId: f.jobA }))
    )
  })

  test('a suspended candidate cannot create a saved job', async () => {
    const f = await seedScenario({ candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'savedJobs', `${f.candA}_${f.jobA}`), validSavedJob({ candidateId: f.candA, jobId: f.jobA }))
    )
  })

  test('an unauthenticated user cannot create a saved job', async () => {
    const f = await seedScenario()
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(
      setDoc(doc(db, 'savedJobs', `${f.candA}_${f.jobA}`), validSavedJob({ candidateId: f.candA, jobId: f.jobA }))
    )
  })

  test('a duplicate save with the same composite id is denied -- create-only, already exists', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    const ref = doc(db, 'savedJobs', `${f.candA}_${f.jobA}`)
    await assertSucceeds(setDoc(ref, validSavedJob({ candidateId: f.candA, jobId: f.jobA })))
    await assertFails(setDoc(ref, validSavedJob({ candidateId: f.candA, jobId: f.jobA })))
  })
})

describe('savedJobs.update -- unconditionally denied', () => {
  test('never updatable, not even by the owner', async () => {
    const f = await seedScenario()
    const savedJobId = await seedSavedJob(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'savedJobs', savedJobId), { jobTitle: 'Changed Title' }))
  })
})

describe('savedJobs.delete -- ownership, suspension', () => {
  test('the owning candidate can delete their own saved job', async () => {
    const f = await seedScenario()
    const savedJobId = await seedSavedJob(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(deleteDoc(doc(db, 'savedJobs', savedJobId)))
  })

  test('a suspended candidate cannot delete their own saved job', async () => {
    const f = await seedScenario({ candSuspended: true })
    const savedJobId = await seedSavedJob(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(deleteDoc(doc(db, 'savedJobs', savedJobId)))
  })

  // Cross-user boundary check distinct from the read test above -- proves
  // the owner-scoped rule also holds for the delete path, not just read.
  test('a different candidate cannot delete another candidate\'s saved job', async () => {
    const f = await seedScenario()
    const savedJobId = await seedSavedJob(f)
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(deleteDoc(doc(db, 'savedJobs', savedJobId)))
  })
})
