import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `n_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-notifications')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ withInterview = false } = {}) {
  const empA = nextId('emp'), empB = nextId('emp'), candA = nextId('cand'), candB = nextId('cand')
  const jobA = nextId('job'), appA = `${candA}_${jobA}`, ivA = nextId('iv')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', empA), { role: 'employer', full_name: 'Emp A', email: 'a@e.com' })
    await setDoc(doc(db, 'users', empB), { role: 'employer', full_name: 'Emp B', email: 'b@e.com' })
    await setDoc(doc(db, 'users', candA), { role: 'candidate', full_name: 'Cand A', email: 'a@c.com' })
    await setDoc(doc(db, 'users', candB), { role: 'candidate', full_name: 'Cand B', email: 'b@c.com' })
    await setDoc(doc(db, 'jobs', jobA), { employerId: empA, title: 'J', companyName: 'Co', status: 'active', applicationCount: 1 })
    await setDoc(doc(db, 'applications', appA), {
      candidateId: candA, jobId: jobA, employerId: empA, status: 'applied',
      jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
      appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
    if (withInterview) {
      await setDoc(doc(db, 'interviews', ivA), {
        applicationId: appA, jobId: jobA, candidateId: candA, employerId: empA,
        scheduledAt: Timestamp.fromDate(new Date(Date.now() + 86400000)), durationMinutes: 30,
        interviewType: 'online', meetingLink: 'https://meet.example.com/x', location: '', notes: '',
        status: 'scheduled', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    }
  })
  return { empA, empB, candA, candB, jobA, appA, ivA }
}

describe('notifications.create -- branch 1: self-confirmation', () => {
  test('a candidate can confirm their own application submission', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candA, type: 'application_submitted_confirmation', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('a candidate cannot send this confirmation type to someone else', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candB, type: 'application_submitted_confirmation', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })
})

describe('notifications.create -- branch 2: candidate notifies the real employer', () => {
  test('candidate can notify the real employer of their real application', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.empA, type: 'new_application', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('candidate cannot spoof recipientId to an arbitrary employer', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.empB, type: 'new_application', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('candidate cannot cite an application they don\'t own', async () => {
    const f = await seedScenario()
    const other = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: other.empA, type: 'new_application', title: 'x', message: 'y',
        relatedJobId: other.jobA, relatedApplicationId: other.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })
})

describe('notifications.create -- branch 3: employer notifies the real candidate', () => {
  test('employer can notify the real candidate of a real application they own', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candA, type: 'application_status_updated', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('employer cannot spoof recipientId to an arbitrary candidate', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candB, type: 'application_status_updated', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('employer cannot cite an application they don\'t own', async () => {
    const f = await seedScenario()
    const other = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: other.candA, type: 'application_status_updated', title: 'x', message: 'y',
        relatedJobId: other.jobA, relatedApplicationId: other.appA, read: false, createdAt: serverTimestamp(),
      })
    )
  })
})

describe('notifications.create -- branch 4/5: interview types', () => {
  test('employer can notify the real candidate of a real interview they own', async () => {
    const f = await seedScenario({ withInterview: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candA, type: 'interview_scheduled', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, relatedInterviewId: f.ivA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('employer cannot notify about an interview belonging to a DIFFERENT employer', async () => {
    const f = await seedScenario({ withInterview: true })
    const other = await seedScenario({ withInterview: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: other.candA, type: 'interview_scheduled', title: 'x', message: 'y',
        relatedJobId: other.jobA, relatedApplicationId: other.appA, relatedInterviewId: other.ivA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('candidate cannot create an interview notification at all', async () => {
    const f = await seedScenario({ withInterview: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candA, type: 'interview_scheduled', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, relatedInterviewId: f.ivA, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('employer cannot spoof recipientId on an interview notification', async () => {
    const f = await seedScenario({ withInterview: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candB, type: 'interview_scheduled', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, relatedInterviewId: f.ivA, read: false, createdAt: serverTimestamp(),
      })
    )
  })
})

describe('notifications.read / update -- recipient-only, field pinning', () => {
  async function seedNotification(f) {
    const notifId = nextId('notif')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'notifications', notifId), {
        recipientId: f.candA, type: 'application_submitted_confirmation', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: f.appA, read: false, createdAt: serverTimestamp(),
      })
    })
    return notifId
  }

  test('recipient can read their own notification', async () => {
    const f = await seedScenario()
    const notifId = await seedNotification(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDoc(doc(db, 'notifications', notifId)))
  })

  test('a different user cannot read someone else\'s notification', async () => {
    const f = await seedScenario()
    const notifId = await seedNotification(f)
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(getDoc(doc(db, 'notifications', notifId)))
  })

  test('recipient can flip the read field', async () => {
    const f = await seedScenario()
    const notifId = await seedNotification(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'notifications', notifId), { read: true }))
  })

  test('recipient CANNOT change title/message/type/relatedApplicationId while toggling read', async () => {
    const f = await seedScenario()
    const notifId = await seedNotification(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'notifications', notifId), { read: true, title: 'Hacked' }))
    await assertFails(updateDoc(doc(db, 'notifications', notifId), { read: true, relatedApplicationId: 'somethingElse' }))
  })

  test('a non-recipient cannot update the notification at all', async () => {
    const f = await seedScenario()
    const notifId = await seedNotification(f)
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(updateDoc(doc(db, 'notifications', notifId), { read: true }))
  })
})
