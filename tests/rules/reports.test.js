import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `r_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-reports')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedUsers({ reporterSuspended = false } = {}) {
  const reporter = nextId('cand'), admin = nextId('admin'), otherUser = nextId('other')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', reporter), {
      role: 'candidate', full_name: 'Reporter', email: 'r@x.com',
      ...(reporterSuspended ? { moderationStatus: 'suspended' } : {}),
    })
    await setDoc(doc(db, 'users', admin), { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    await setDoc(doc(db, 'users', otherUser), { role: 'candidate', full_name: 'Other', email: 'o@x.com' })
  })
  return { reporter, admin, otherUser }
}

function validReportPayload(reporterId, targetType, targetId) {
  return {
    reporterId, targetType, targetId,
    status: 'open',
    reason: 'Inappropriate content',
    description: 'Some extra detail.',
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null,
  }
}

describe('reports.create -- ownership, suspension, and duplicate/spam protection (Phase 17 P2 fix)', () => {
  test('a signed-in user can report a job, using the composite doc id', async () => {
    const { reporter } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    const reportId = `${reporter}_job_job123`
    await assertSucceeds(setDoc(doc(db, 'reports', reportId), validReportPayload(reporter, 'job', 'job123')))
  })

  test('a signed-in user can report a user, using the composite doc id', async () => {
    const { reporter, otherUser } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    const reportId = `${reporter}_user_${otherUser}`
    await assertSucceeds(setDoc(doc(db, 'reports', reportId), validReportPayload(reporter, 'user', otherUser)))
  })

  test('cannot spoof reporterId to someone else', async () => {
    const { reporter, otherUser } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    const reportId = `${otherUser}_job_job123`
    await assertFails(setDoc(doc(db, 'reports', reportId), validReportPayload(otherUser, 'job', 'job123')))
  })

  test('the doc id must exactly match reporterId_targetType_targetId (cannot use an arbitrary id)', async () => {
    const { reporter } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    await assertFails(setDoc(doc(db, 'reports', 'not-the-right-shape'), validReportPayload(reporter, 'job', 'job123')))
  })

  test('a SUSPENDED user cannot create a report (isNotSuspended fix)', async () => {
    const { reporter } = await seedUsers({ reporterSuspended: true })
    const db = testEnv.authenticatedContext(reporter).firestore()
    const reportId = `${reporter}_job_job123`
    await assertFails(setDoc(doc(db, 'reports', reportId), validReportPayload(reporter, 'job', 'job123')))
  })

  test('an invalid targetType is rejected', async () => {
    const { reporter } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    const reportId = `${reporter}_application_app123`
    await assertFails(setDoc(doc(db, 'reports', reportId), validReportPayload(reporter, 'application', 'app123')))
  })

  test('a too-short reason is rejected', async () => {
    const { reporter } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    const reportId = `${reporter}_job_job123`
    await assertFails(setDoc(doc(db, 'reports', reportId), { ...validReportPayload(reporter, 'job', 'job123'), reason: 'hi' }))
  })

  test('duplicate: the SAME reporter cannot report the SAME target twice', async () => {
    const { reporter } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    const reportId = `${reporter}_job_job123`
    await assertSucceeds(setDoc(doc(db, 'reports', reportId), validReportPayload(reporter, 'job', 'job123')))
    await assertFails(setDoc(doc(db, 'reports', reportId), validReportPayload(reporter, 'job', 'job123')))
  })

  test('the SAME reporter CAN report two DIFFERENT targets', async () => {
    const { reporter } = await seedUsers()
    const db = testEnv.authenticatedContext(reporter).firestore()
    await assertSucceeds(setDoc(doc(db, 'reports', `${reporter}_job_jobA`), validReportPayload(reporter, 'job', 'jobA')))
    await assertSucceeds(setDoc(doc(db, 'reports', `${reporter}_job_jobB`), validReportPayload(reporter, 'job', 'jobB')))
  })

  test('TWO DIFFERENT reporters can each report the SAME target once', async () => {
    const { reporter, otherUser } = await seedUsers()
    const dbA = testEnv.authenticatedContext(reporter).firestore()
    const dbB = testEnv.authenticatedContext(otherUser).firestore()
    await assertSucceeds(setDoc(doc(dbA, 'reports', `${reporter}_job_job123`), validReportPayload(reporter, 'job', 'job123')))
    await assertSucceeds(setDoc(doc(dbB, 'reports', `${otherUser}_job_job123`), validReportPayload(otherUser, 'job', 'job123')))
  })

  test('unauthenticated cannot create a report', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'reports', 'anon_job_job123'), validReportPayload('anon', 'job', 'job123')))
  })
})

describe('reports.read -- admin only', () => {
  test('the reporter cannot read back their own report', async () => {
    const { reporter } = await seedUsers()
    const reportId = `${reporter}_job_job123`
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'reports', reportId), validReportPayload(reporter, 'job', 'job123'))
    })
    const db = testEnv.authenticatedContext(reporter).firestore()
    await assertFails(getDoc(doc(db, 'reports', reportId)))
  })

  test('admin can read any report', async () => {
    const { reporter, admin } = await seedUsers()
    const reportId = `${reporter}_job_job123`
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'reports', reportId), validReportPayload(reporter, 'job', 'job123'))
    })
    const db = testEnv.authenticatedContext(admin).firestore()
    await assertSucceeds(getDoc(doc(db, 'reports', reportId)))
  })
})

describe('reports.update / delete -- admin-only status change, delete always denied', () => {
  test('the reporter cannot update their own report (also covers the duplicate-create-as-update path)', async () => {
    const { reporter } = await seedUsers()
    const reportId = `${reporter}_job_job123`
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'reports', reportId), validReportPayload(reporter, 'job', 'job123'))
    })
    const db = testEnv.authenticatedContext(reporter).firestore()
    await assertFails(updateDoc(doc(db, 'reports', reportId), { status: 'dismissed' }))
  })

  test('admin can move status to reviewed/dismissed', async () => {
    const { reporter, admin } = await seedUsers()
    const reportId = `${reporter}_job_job123`
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'reports', reportId), validReportPayload(reporter, 'job', 'job123'))
    })
    const db = testEnv.authenticatedContext(admin).firestore()
    await assertSucceeds(updateDoc(doc(db, 'reports', reportId), { status: 'dismissed', reviewedBy: admin }))
  })

  test('nobody can delete a report, not even admin', async () => {
    const { reporter, admin } = await seedUsers()
    const reportId = `${reporter}_job_job123`
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'reports', reportId), validReportPayload(reporter, 'job', 'job123'))
    })
    const db = testEnv.authenticatedContext(admin).firestore()
    await assertFails(deleteDoc(doc(db, 'reports', reportId)))
  })
})
