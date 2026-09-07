import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `ja_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-job-alerts')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ jobStatus = 'active', candSuspended = false } = {}) {
  const candA = nextId('cand'), candB = nextId('cand'), empA = nextId('emp')
  const jobA = nextId('job')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', candA), {
      role: 'candidate', full_name: 'Cand A', email: 'a@c.com',
      ...(candSuspended ? { moderationStatus: 'suspended' } : {}),
    })
    await setDoc(doc(db, 'users', candB), { role: 'candidate', full_name: 'Cand B', email: 'b@c.com' })
    await setDoc(doc(db, 'users', empA), { role: 'employer', full_name: 'Emp A', email: 'a@e.com' })
    await setDoc(doc(db, 'jobs', jobA), {
      employerId: empA, title: 'React Developer', companyName: 'XYZ Pvt Ltd',
      location: 'Noida', jobType: 'Full-time', workMode: 'Remote', experienceLevel: 'Fresher',
      skills: ['React'], status: jobStatus, applicationCount: 0,
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
  })
  return { candA, candB, empA, jobA }
}

function validPreferences(candidateId, overrides = {}) {
  return {
    candidateId,
    enabled: true,
    jobTypes: ['Full-time'],
    workModes: ['Remote'],
    locations: ['Noida'],
    skills: ['React'],
    experienceLevel: null,
    lastAlertCheckAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  }
}

describe('jobAlertPreferences.read -- owner only', () => {
  test('unauthenticated user cannot read preferences', async () => {
    const f = await seedScenario()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'jobAlertPreferences', f.candA), validPreferences(f.candA))
    })
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'jobAlertPreferences', f.candA)))
  })

  test('candidate can read their own preferences', async () => {
    const f = await seedScenario()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'jobAlertPreferences', f.candA), validPreferences(f.candA))
    })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDoc(doc(db, 'jobAlertPreferences', f.candA)))
  })

  test('candidate cannot read another candidate\'s preferences', async () => {
    const f = await seedScenario()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'jobAlertPreferences', f.candA), validPreferences(f.candA))
    })
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(getDoc(doc(db, 'jobAlertPreferences', f.candA)))
  })
})

describe('jobAlertPreferences.create -- ownership, suspension', () => {
  test('candidate can create their own preferences', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(setDoc(doc(db, 'jobAlertPreferences', f.candA), validPreferences(f.candA)))
  })

  test('candidate cannot create preferences for another user', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(setDoc(doc(db, 'jobAlertPreferences', f.candB), validPreferences(f.candB)))
  })

  test('candidate cannot create preferences with a mismatched candidateId', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(setDoc(doc(db, 'jobAlertPreferences', f.candA), validPreferences(f.candB)))
  })

  test('suspended candidate cannot create preferences', async () => {
    const f = await seedScenario({ candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(setDoc(doc(db, 'jobAlertPreferences', f.candA), validPreferences(f.candA)))
  })

  test('an employer cannot create job alert preferences', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(setDoc(doc(db, 'jobAlertPreferences', f.empA), validPreferences(f.empA)))
  })
})

describe('jobAlertPreferences.update -- ownership, suspension', () => {
  async function seedPrefs(candidateId) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'jobAlertPreferences', candidateId), validPreferences(candidateId))
    })
  }

  test('candidate can update their own preferences', async () => {
    const f = await seedScenario()
    await seedPrefs(f.candA)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'jobAlertPreferences', f.candA), { enabled: false, updatedAt: serverTimestamp() }))
  })

  test('candidate cannot update another candidate\'s preferences', async () => {
    const f = await seedScenario()
    await seedPrefs(f.candA)
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(updateDoc(doc(db, 'jobAlertPreferences', f.candA), { enabled: false }))
  })

  test('suspended candidate cannot update their own preferences', async () => {
    const f = await seedScenario({ candSuspended: true })
    await seedPrefs(f.candA)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'jobAlertPreferences', f.candA), { enabled: false }))
  })
})

describe('jobAlertPreferences.delete -- unconditionally denied', () => {
  test('never deletable, not even by the owner', async () => {
    const f = await seedScenario()
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'jobAlertPreferences', f.candA), validPreferences(f.candA))
    })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(deleteDoc(doc(db, 'jobAlertPreferences', f.candA)))
  })
})

describe('jobAlertMatches.create -- ownership, real/active job, dedup', () => {
  test('a candidate can create their own matching marker for a real, active job', async () => {
    const f = await seedScenario({ jobStatus: 'active' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'jobAlertMatches', `${f.candA}_${f.jobA}`), {
        candidateId: f.candA, jobId: f.jobA, createdAt: serverTimestamp(),
      })
    )
  })

  test('a candidate cannot create a marker claiming another candidate', async () => {
    const f = await seedScenario({ jobStatus: 'active' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'jobAlertMatches', `${f.candB}_${f.jobA}`), {
        candidateId: f.candB, jobId: f.jobA, createdAt: serverTimestamp(),
      })
    )
  })

  test('a candidate cannot create a marker for an inactive (closed) job', async () => {
    const f = await seedScenario({ jobStatus: 'closed' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'jobAlertMatches', `${f.candA}_${f.jobA}`), {
        candidateId: f.candA, jobId: f.jobA, createdAt: serverTimestamp(),
      })
    )
  })

  test('a candidate cannot create a marker for a non-existent job', async () => {
    const f = await seedScenario()
    const fakeJobId = nextId('ghost')
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'jobAlertMatches', `${f.candA}_${fakeJobId}`), {
        candidateId: f.candA, jobId: fakeJobId, createdAt: serverTimestamp(),
      })
    )
  })

  test('the document id must equal candidateId + "_" + jobId', async () => {
    const f = await seedScenario({ jobStatus: 'active' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'jobAlertMatches', nextId('mismatched')), {
        candidateId: f.candA, jobId: f.jobA, createdAt: serverTimestamp(),
      })
    )
  })

  test('suspended candidate cannot create a matching marker', async () => {
    const f = await seedScenario({ jobStatus: 'active', candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'jobAlertMatches', `${f.candA}_${f.jobA}`), {
        candidateId: f.candA, jobId: f.jobA, createdAt: serverTimestamp(),
      })
    )
  })

  test('a duplicate marker for the same candidate+job is denied (create-only, already exists)', async () => {
    const f = await seedScenario({ jobStatus: 'active' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    const ref = doc(db, 'jobAlertMatches', `${f.candA}_${f.jobA}`)
    await assertSucceeds(setDoc(ref, { candidateId: f.candA, jobId: f.jobA, createdAt: serverTimestamp() }))
    await assertFails(setDoc(ref, { candidateId: f.candA, jobId: f.jobA, createdAt: serverTimestamp() }))
  })
})

describe('jobAlertMatches.update / delete -- immutable', () => {
  async function seedMarker(f) {
    const id = `${f.candA}_${f.jobA}`
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'jobAlertMatches', id), { candidateId: f.candA, jobId: f.jobA, createdAt: serverTimestamp() })
    })
    return id
  }

  test('a matching marker can never be updated', async () => {
    const f = await seedScenario({ jobStatus: 'active' })
    const id = await seedMarker(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'jobAlertMatches', id), { jobId: 'somethingElse' }))
  })

  test('a matching marker can never be deleted', async () => {
    const f = await seedScenario({ jobStatus: 'active' })
    const id = await seedMarker(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(deleteDoc(doc(db, 'jobAlertMatches', id)))
  })
})

describe('notifications.create -- job_alert_match branch', () => {
  test('a candidate can create their own job_alert_match notification', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candA, type: 'job_alert_match', title: 'New job matching your preferences',
        message: 'React Developer at XYZ Pvt Ltd matches your job alert preferences.',
        relatedJobId: f.jobA, relatedApplicationId: null, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('a candidate cannot create a job_alert_match notification for another recipient', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candB, type: 'job_alert_match', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: null, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('a non-candidate (employer) cannot create a job_alert_match notification', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.empA, type: 'job_alert_match', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: null, read: false, createdAt: serverTimestamp(),
      })
    )
  })

  test('a suspended candidate cannot create a job_alert_match notification', async () => {
    const f = await seedScenario({ candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'notifications', nextId('notif')), {
        recipientId: f.candA, type: 'job_alert_match', title: 'x', message: 'y',
        relatedJobId: f.jobA, relatedApplicationId: null, read: false, createdAt: serverTimestamp(),
      })
    )
  })
})
