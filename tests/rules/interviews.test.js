import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp, Timestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `i_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-interviews')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ appStatus = 'applied', interviewStatus = null, empSuspended = false } = {}) {
  const empA = nextId('emp'), empB = nextId('emp'), candA = nextId('cand'), candB = nextId('cand')
  const jobA = nextId('job'), appA = `${candA}_${jobA}`, ivA = nextId('iv')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', empA), { role: 'employer', full_name: 'Emp A', email: 'a@e.com', ...(empSuspended ? { moderationStatus: 'suspended' } : {}) })
    await setDoc(doc(db, 'users', empB), { role: 'employer', full_name: 'Emp B', email: 'b@e.com' })
    await setDoc(doc(db, 'users', candA), { role: 'candidate', full_name: 'Cand A', email: 'a@c.com' })
    await setDoc(doc(db, 'users', candB), { role: 'candidate', full_name: 'Cand B', email: 'b@c.com' })
    await setDoc(doc(db, 'jobs', jobA), { employerId: empA, title: 'J', companyName: 'Co', status: 'active', applicationCount: 1 })
    await setDoc(doc(db, 'applications', appA), {
      candidateId: candA, jobId: jobA, employerId: empA, status: appStatus,
      jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
      appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
    if (interviewStatus) {
      await setDoc(doc(db, 'interviews', ivA), {
        applicationId: appA, jobId: jobA, candidateId: candA, employerId: empA,
        scheduledAt: Timestamp.fromDate(new Date(Date.now() + 86400000)), durationMinutes: 30,
        interviewType: 'online', meetingLink: 'https://meet.example.com/x', location: '', notes: '',
        status: interviewStatus, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    }
  })
  return { empA, empB, candA, candB, jobA, appA, ivA }
}

function validPayload(f, overrides = {}) {
  return {
    applicationId: f.appA, jobId: f.jobA, candidateId: f.candA, employerId: f.empA,
    scheduledAt: Timestamp.fromDate(new Date(Date.now() + 172800000)), durationMinutes: 30,
    interviewType: 'online', meetingLink: 'https://meet.example.com/y', location: '', notes: '',
    status: 'scheduled', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    ...overrides,
  }
}

describe('interviews.create -- ownership, spoofing, withdrawn-application block', () => {
  test('employer can schedule an interview for their own, non-withdrawn application', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(setDoc(doc(db, 'interviews', f.ivA), validPayload(f)))
  })

  test('creation is DENIED when the parent application is withdrawn', async () => {
    const f = await seedScenario({ appStatus: 'withdrawn' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f)))
  })

  test('employer cannot create an interview for another employer\'s application', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const other = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'interviews', f.ivA), validPayload(f, { applicationId: other.appA, candidateId: other.candA, jobId: other.jobA }))
    )
  })

  test('employer cannot spoof candidateId/employerId/jobId away from the real application', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f, { candidateId: f.candB })))
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f, { employerId: f.empB })))
  })

  test('candidate cannot create an interview', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f)))
  })

  test('suspended employer cannot create an interview', async () => {
    const f = await seedScenario({ appStatus: 'applied', empSuspended: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f)))
  })

  test('field validation: online interview requires an https meeting link', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f, { meetingLink: 'http://insecure.com' })))
  })

  test('field validation: duration must be within 1-480 minutes', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f, { durationMinutes: 0 })))
    await assertFails(setDoc(doc(db, 'interviews', f.ivA), validPayload(f, { durationMinutes: 481 })))
  })
})

describe('interviews.update -- withdrawn-application lockdown', () => {
  test('CANCEL is allowed when the parent application is withdrawn', async () => {
    const f = await seedScenario({ appStatus: 'withdrawn', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'interviews', f.ivA), { status: 'cancelled', updatedAt: serverTimestamp() }))
  })

  test('EDIT (status stays scheduled) is DENIED when the parent application is withdrawn', async () => {
    const f = await seedScenario({ appStatus: 'withdrawn', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { durationMinutes: 45, status: 'scheduled', updatedAt: serverTimestamp() }))
  })

  test('MARK COMPLETE is DENIED when the parent application is withdrawn', async () => {
    const f = await seedScenario({ appStatus: 'withdrawn', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { status: 'completed', updatedAt: serverTimestamp() }))
  })
})

describe('interviews.update -- forward-only status transitions, terminal-state lock', () => {
  test('scheduled -> completed is allowed', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'interviews', f.ivA), { status: 'completed', updatedAt: serverTimestamp() }))
  })

  test('scheduled -> cancelled is allowed', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'interviews', f.ivA), { status: 'cancelled', updatedAt: serverTimestamp() }))
  })

  test('scheduled -> scheduled (a plain reschedule/notes edit) is allowed', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'interviews', f.ivA), { durationMinutes: 45, status: 'scheduled', updatedAt: serverTimestamp() }))
  })

  test('completed -> scheduled is DENIED (terminal, no reopening)', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'completed' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { status: 'scheduled', updatedAt: serverTimestamp() }))
  })

  test('cancelled -> scheduled is DENIED (terminal, no reopening)', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'cancelled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { status: 'scheduled', updatedAt: serverTimestamp() }))
  })

  test('completed -> cancelled is DENIED (terminal states have no lateral move either)', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'completed' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { status: 'cancelled', updatedAt: serverTimestamp() }))
  })

  test('employer cannot reassign an interview to a different application/candidate/job on update', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const other = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { applicationId: other.appA, status: 'scheduled', updatedAt: serverTimestamp() }))
  })

  test('a DIFFERENT employer cannot update someone else\'s interview', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empB).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { status: 'cancelled', updatedAt: serverTimestamp() }))
  })

  test('suspended employer cannot update their own interview', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled', empSuspended: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'interviews', f.ivA), { status: 'cancelled', updatedAt: serverTimestamp() }))
  })
})

describe('interviews.read -- cross-role access', () => {
  test('candidate can read their own interview via query', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDocs(query(collection(db, 'interviews'), where('candidateId', '==', f.candA))))
  })

  test('a DIFFERENT candidate cannot read via query', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(getDocs(query(collection(db, 'interviews'), where('candidateId', '==', f.candA))))
  })

  test('employer applicationId+employerId query is provably safe and works', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(
      getDocs(query(collection(db, 'interviews'), where('applicationId', '==', f.appA), where('employerId', '==', f.empA)))
    )
  })

  test('an applicationId-ONLY query (no employerId/candidateId) is denied -- rule cannot prove it', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(getDocs(query(collection(db, 'interviews'), where('applicationId', '==', f.appA))))
  })
})

describe('interviews.delete -- unconditionally denied', () => {
  test('never hard-deleted, not even by the owning employer', async () => {
    const f = await seedScenario({ appStatus: 'applied', interviewStatus: 'scheduled' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(deleteDoc(doc(db, 'interviews', f.ivA)))
  })
})
