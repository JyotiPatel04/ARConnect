import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `j_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-jobs')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedJob({ applicationCount = 0, status = 'active' } = {}) {
  const empA = nextId('emp'), empB = nextId('emp'), jobA = nextId('job')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', empA), { role: 'employer', full_name: 'Emp A', email: 'a@e.com' })
    await setDoc(doc(db, 'users', empB), { role: 'employer', full_name: 'Emp B', email: 'b@e.com' })
    await setDoc(doc(db, 'jobs', jobA), {
      employerId: empA, title: 'Sales Executive', companyName: 'Co', status, applicationCount,
    })
  })
  return { empA, empB, jobA }
}

// callerRole() reads the caller's OWN users/{uid} doc -- every jobs.create
// test needs one seeded first (as role: 'employer'), or callerRole() itself
// throws on a nonexistent doc before the email_verified check is ever
// reached, which would make an assertFails pass for the wrong reason.
async function seedEmployerUser(uid, email) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), { role: 'employer', full_name: 'Emp', email })
  })
}

describe('jobs.create -- ownership and email verification (Phase 17 P1 fix)', () => {
  test('a verified employer can create a job', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })

  test('an UNVERIFIED employer cannot create a job', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: false }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })

  test('an employer whose token carries no email_verified claim at all cannot create a job', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com' }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })

  test('cannot spoof employerId on create', async () => {
    const uid = nextId('emp'), otherUid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: otherUid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })

  test('a candidate cannot create a job', async () => {
    const uid = nextId('cand')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', uid), { role: 'candidate', full_name: 'C', email: 'c@x.com' })
    })
    const db = testEnv.authenticatedContext(uid, { email: 'c@x.com', email_verified: true }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })
})

// email_verified is deliberately NOT required here -- Phase 17 scopes
// verification enforcement to job CREATION only, so an employer who
// verified after posting their earlier jobs can still edit/close/reopen/
// delete them going forward without re-verifying anything.
describe('jobs.update -- employer branch: applicationCount/status pinning (Phase 17 P0 fix)', () => {
  test('employer can update allowed job fields (title, salary, location)', async () => {
    const { empA, jobA } = await seedJob()
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'jobs', jobA), { title: 'Senior Sales Executive', salaryMin: 20000, salaryMax: 30000, location: 'Mumbai' })
    )
  })

  test('employer cannot change applicationCount directly', async () => {
    const { empA, jobA } = await seedJob({ applicationCount: 3 })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { applicationCount: 4 }))
  })

  test('employer cannot spoof applicationCount: 0 to try to unlock delete', async () => {
    const { empA, jobA } = await seedJob({ applicationCount: 3 })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { applicationCount: 0 }))
  })

  test('after a spoof attempt, the employer still cannot hard-delete a job that has applications', async () => {
    const { empA, jobA } = await seedJob({ applicationCount: 3 })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { applicationCount: 0 }))
    await assertFails(deleteDoc(doc(db, 'jobs', jobA)))
  })

  test('employer cannot move status to a value outside the allowed enum', async () => {
    const { empA, jobA } = await seedJob({ status: 'active' })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { status: 'hired' }))
  })

  test('employer CAN still close and reopen their own job (legitimate status change preserved)', async () => {
    const { empA, jobA } = await seedJob({ status: 'active' })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'jobs', jobA), { status: 'closed' }))
    await assertSucceeds(updateDoc(doc(db, 'jobs', jobA), { status: 'active' }))
  })

  test('a different employer cannot update someone else\'s job (cross-owner denied)', async () => {
    const { empB, jobA } = await seedJob()
    const db = testEnv.authenticatedContext(empB).firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { title: 'Hijacked' }))
  })

  test('an unauthenticated caller cannot update a job', async () => {
    const { jobA } = await seedJob()
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { title: 'Hijacked' }))
  })
})

// Phase 17 P2: jobPostCounters/{employerId} is the lifetime posting
// backstop jobs.create checks via jobPostCountFor(). Seeded directly here
// (bypassing rules) to test the cap boundary itself, independent of
// whether app code correctly increments it.
async function seedCounter(uid, count) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'jobPostCounters', uid), { count })
  })
}

describe('jobs.create -- lifetime job-posting cap (Phase 17 P2 fix)', () => {
  test('an employer just under the cap can still create a job', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(uid, 999)
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })

  test('an employer AT the cap cannot create another job', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(uid, 1000)
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })

  test('an employer well past the cap cannot create another job', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(uid, 5000)
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })

  test('an employer with no counter doc yet (never posted) is treated as 0, not blocked', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })
})

describe('jobPostCounters -- ownership and monotonic increment (Phase 17 P2 fix)', () => {
  test('an employer can create their own counter starting at 1', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertSucceeds(setDoc(doc(db, 'jobPostCounters', uid), { count: 1 }))
  })

  test('cannot create their own counter starting anywhere but 1', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(setDoc(doc(db, 'jobPostCounters', uid), { count: 0 }))
    await assertFails(setDoc(doc(db, 'jobPostCounters', uid), { count: 5 }))
  })

  test('cannot create a counter doc for a DIFFERENT employer', async () => {
    const uid = nextId('emp'), otherUid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(setDoc(doc(db, 'jobPostCounters', otherUid), { count: 1 }))
  })

  test('owner can increment their own counter by exactly 1', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(uid, 3)
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertSucceeds(updateDoc(doc(db, 'jobPostCounters', uid), { count: 4 }))
  })

  test('owner cannot jump their counter by more than 1', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(uid, 3)
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(updateDoc(doc(db, 'jobPostCounters', uid), { count: 10 }))
  })

  test('owner cannot decrement or reset their own counter', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(uid, 5)
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(updateDoc(doc(db, 'jobPostCounters', uid), { count: 0 }))
    await assertFails(updateDoc(doc(db, 'jobPostCounters', uid), { count: 4 }))
  })

  test('a different employer cannot read or write someone else\'s counter', async () => {
    const uid = nextId('emp'), otherUid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(otherUid, 3)
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(getDoc(doc(db, 'jobPostCounters', otherUid)))
    await assertFails(updateDoc(doc(db, 'jobPostCounters', otherUid), { count: 4 }))
  })

  test('nobody can delete a job-post counter, not even its owner', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCounter(uid, 3)
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(deleteDoc(doc(db, 'jobPostCounters', uid)))
  })
})

// Employer Verification: employerVerified is a creation-time snapshot of
// companySummaries.verified (see companyVerifiedFor() in firestore.rules
// and employerJobService.createJob), never a client-supplied claim.
async function seedCompanySummary(uid, verified) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'companySummaries', uid), {
      employerId: uid, companyName: 'Co', verified,
    })
  })
}

describe('jobs.create -- employerVerified must match real company state', () => {
  test('a verified employer creating a job with employerVerified: true succeeds', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCompanySummary(uid, true)
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0, employerVerified: true,
      })
    )
  })

  test('an UNVERIFIED employer cannot claim employerVerified: true', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCompanySummary(uid, false)
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0, employerVerified: true,
      })
    )
  })

  test('a verified employer under-claiming employerVerified: false is also denied (must match exactly)', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    await seedCompanySummary(uid, true)
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0, employerVerified: false,
      })
    )
  })

  test('an employer with no company profile/summary at all defaults to unverified', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0, employerVerified: false,
      })
    )
    await assertFails(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0, employerVerified: true,
      })
    )
  })

  test('omitting employerVerified entirely still works for an unverified employer (backward-compatible default)', async () => {
    const uid = nextId('emp')
    await seedEmployerUser(uid, 'e@x.com')
    const db = testEnv.authenticatedContext(uid, { email: 'e@x.com', email_verified: true }).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'jobs', nextId('job')), {
        employerId: uid, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0,
      })
    )
  })
})

describe('jobs.update -- employerVerified is a permanent, immutable snapshot', () => {
  test('employer cannot flip their own existing job to employerVerified: true after becoming verified', async () => {
    const { empA, jobA } = await seedJob()
    await seedCompanySummary(empA, true)
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { employerVerified: true }))
  })

  test('employer editing unrelated fields on an already-verified job keeps succeeding (no accidental lock-out)', async () => {
    const empA = nextId('emp'), jobA = nextId('job')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore()
      await setDoc(doc(db, 'users', empA), { role: 'employer', full_name: 'Emp', email: 'e@x.com' })
      await setDoc(doc(db, 'jobs', jobA), {
        employerId: empA, title: 'Sales Executive', companyName: 'Co', status: 'active', applicationCount: 0, employerVerified: true,
      })
    })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'jobs', jobA), { title: 'Senior Sales Executive' }))
  })

  test('admin moderation (close/reopen) cannot change employerVerified either', async () => {
    const { jobA } = await seedJob()
    const adminUid = nextId('admin')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', adminUid), { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    })
    const db = testEnv.authenticatedContext(adminUid).firestore()
    await assertFails(updateDoc(doc(db, 'jobs', jobA), { status: 'closed', employerVerified: true }))
    await assertSucceeds(updateDoc(doc(db, 'jobs', jobA), { status: 'closed' }))
  })
})

describe('jobs.delete -- legitimate hard-delete behavior unchanged', () => {
  test('employer CAN hard-delete their own job once applicationCount is genuinely zero', async () => {
    const { empA, jobA } = await seedJob({ applicationCount: 0 })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(deleteDoc(doc(db, 'jobs', jobA)))
  })

  test('employer cannot hard-delete a job that genuinely has applications', async () => {
    const { empA, jobA } = await seedJob({ applicationCount: 2 })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(deleteDoc(doc(db, 'jobs', jobA)))
  })

  test('a different employer cannot delete someone else\'s job', async () => {
    const { empB, jobA } = await seedJob({ applicationCount: 0 })
    const db = testEnv.authenticatedContext(empB).firestore()
    await assertFails(deleteDoc(doc(db, 'jobs', jobA)))
  })
})
