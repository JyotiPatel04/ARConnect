import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `a_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-applications')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ appStatus = 'applied', jobStatus = 'active', empSuspended = false, candSuspended = false } = {}) {
  const empA = nextId('emp'), empB = nextId('emp'), candA = nextId('cand'), candB = nextId('cand')
  const jobA = nextId('job'), appA = `${candA}_${jobA}`
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', empA), { role: 'employer', full_name: 'Emp A', email: 'a@e.com', ...(empSuspended ? { moderationStatus: 'suspended' } : {}) })
    await setDoc(doc(db, 'users', empB), { role: 'employer', full_name: 'Emp B', email: 'b@e.com' })
    await setDoc(doc(db, 'users', candA), { role: 'candidate', full_name: 'Cand A', email: 'a@c.com', ...(candSuspended ? { moderationStatus: 'suspended' } : {}) })
    await setDoc(doc(db, 'users', candB), { role: 'candidate', full_name: 'Cand B', email: 'b@c.com' })
    await setDoc(doc(db, 'jobs', jobA), { employerId: empA, title: 'J', companyName: 'Co', status: jobStatus, applicationCount: appStatus ? 1 : 0 })
    if (appStatus) {
      await setDoc(doc(db, 'applications', appA), {
        candidateId: candA, jobId: jobA, employerId: empA, status: appStatus,
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    }
  })
  return { empA, empB, candA, candB, jobA, appA }
}

describe('applications.create -- ownership and spoofing', () => {
  test('candidate can apply to an active job as themselves', async () => {
    const f = await seedScenario({ appStatus: null })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('candidate cannot spoof candidateId to someone else', async () => {
    const f = await seedScenario({ appStatus: null })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', `${f.candB}_${f.jobA}`), {
        candidateId: f.candB, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('candidate cannot spoof employerId/jobTitle/companyName away from the real job', async () => {
    const f = await seedScenario({ appStatus: null })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empB, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('candidate cannot spoof their own candidateName/candidateEmail', async () => {
    const f = await seedScenario({ appStatus: null })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Someone Else', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('cannot apply to a closed job', async () => {
    const f = await seedScenario({ appStatus: null, jobStatus: 'closed' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('duplicate application (same candidate+job) is denied -- composite ID collision', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('employer cannot create an application', async () => {
    const f = await seedScenario({ appStatus: null })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('suspended candidate cannot apply', async () => {
    const f = await seedScenario({ appStatus: null, candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })
})

const SIX_STATUSES = ['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired']

describe('applications.update -- full six-status employer transition matrix', () => {
  for (const from of SIX_STATUSES) {
    for (const to of SIX_STATUSES) {
      if (from === to) continue
      test(`employer: ${from} -> ${to} allowed (free-form movement is intentional product behavior, Phase 14)`, async () => {
        const f = await seedScenario({ appStatus: from })
        const db = testEnv.authenticatedContext(f.empA).firestore()
        await assertSucceeds(updateDoc(doc(db, 'applications', f.appA), { status: to, updatedAt: serverTimestamp() }))
      })
    }
  }

  test('employer cannot spoof ownership/identity fields on update', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { candidateId: f.candB, status: 'reviewing' }))
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { employerId: f.empB, status: 'reviewing' }))
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { jobId: 'somethingElse', status: 'reviewing' }))
  })

  test('employer cannot set an invalid/unknown status', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'made-up-status' }))
  })

  test('a DIFFERENT employer cannot update someone else\'s application', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empB).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'reviewing' }))
  })

  test('a candidate cannot use the status field to change their own application status', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'hired' }))
  })

  test('suspended employer cannot change any application status', async () => {
    const f = await seedScenario({ appStatus: 'applied', empSuspended: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'reviewing' }))
  })
})

describe('applications.update -- candidate withdrawal ownership and lifecycle', () => {
  test('candidate can withdraw their own application from every non-terminal status', async () => {
    for (const from of ['applied', 'reviewing', 'shortlisted', 'interview']) {
      const f = await seedScenario({ appStatus: from })
      const db = testEnv.authenticatedContext(f.candA).firestore()
      await assertSucceeds(updateDoc(doc(db, 'applications', f.appA), { status: 'withdrawn', updatedAt: serverTimestamp() }))
    }
  })

  test('candidate cannot withdraw a terminal (hired or rejected) application', async () => {
    for (const from of ['hired', 'rejected']) {
      const f = await seedScenario({ appStatus: from })
      const db = testEnv.authenticatedContext(f.candA).firestore()
      await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'withdrawn' }))
    }
  })

  test('candidate cannot withdraw an already-withdrawn application', async () => {
    const f = await seedScenario({ appStatus: 'withdrawn' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'withdrawn' }))
  })

  test('candidate cannot withdraw another candidate\'s application', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'withdrawn' }))
  })

  test('candidate cannot use the withdraw path to set any status other than withdrawn', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'hired' }))
  })

  test('candidate cannot spoof ownership fields while withdrawing', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'withdrawn', employerId: f.empB }))
  })

  test('employer loses ALL update access once the application is withdrawn', async () => {
    const f = await seedScenario({ appStatus: 'withdrawn' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'shortlisted' }))
  })

  test('suspended candidate cannot withdraw', async () => {
    const f = await seedScenario({ appStatus: 'applied', candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'withdrawn' }))
  })
})

describe('applications.delete -- unconditionally denied', () => {
  test('neither candidate nor employer can delete an application', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    await assertFails(deleteDoc(doc(testEnv.authenticatedContext(f.candA).firestore(), 'applications', f.appA)))
    await assertFails(deleteDoc(doc(testEnv.authenticatedContext(f.empA).firestore(), 'applications', f.appA)))
  })
})
