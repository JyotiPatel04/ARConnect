import { beforeAll, afterAll, describe, test, expect } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'
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

// resumeFileUrl/resumeFileName are optional (many candidates have no
// resume) and, when present, must exactly match the caller's OWN
// candidateProfiles doc (candidateProfileFor() in firestore.rules) --
// same jobFor()-style cross-verification as every other denormalized
// field on this collection.
async function seedCandidateResume(candidateId, { resumeFileUrl = 'https://storage.example.com/resumes/x?token=abc', resumeFileName = 'resume.pdf' } = {}) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'candidateProfiles', candidateId), {
      candidateId, resumeFileUrl, resumeFileName,
    })
  })
}

describe('applications.create -- resumeFileUrl/resumeFileName', () => {
  test('candidate can create an application with their own resume reference', async () => {
    const f = await seedScenario({ appStatus: null })
    await seedCandidateResume(f.candA)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        resumeFileUrl: 'https://storage.example.com/resumes/x?token=abc', resumeFileName: 'resume.pdf',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('candidate can create an application without a resume (fields omitted)', async () => {
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

  test('candidate can create an application without a resume (fields explicitly null)', async () => {
    const f = await seedScenario({ appStatus: null })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        resumeFileUrl: null, resumeFileName: null,
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('candidate CANNOT create an application using another candidate\'s resume reference', async () => {
    const f = await seedScenario({ appStatus: null })
    await seedCandidateResume(f.candB, { resumeFileUrl: 'https://storage.example.com/resumes/other?token=zzz', resumeFileName: 'other.pdf' })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        resumeFileUrl: 'https://storage.example.com/resumes/other?token=zzz', resumeFileName: 'other.pdf',
        appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
    )
  })

  test('candidate with NO candidateProfiles doc at all cannot claim a resume reference', async () => {
    const f = await seedScenario({ appStatus: null })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(db, 'applications', f.appA), {
        candidateId: f.candA, jobId: f.jobA, employerId: f.empA, status: 'applied',
        jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
        resumeFileUrl: 'https://storage.example.com/resumes/made-up?token=fake', resumeFileName: 'fake.pdf',
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

  test('employer cannot modify resumeFileUrl during a status update', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'applications', f.appA), {
        resumeFileUrl: 'https://storage.example.com/resumes/x?token=abc', resumeFileName: 'resume.pdf',
      })
    })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      updateDoc(doc(db, 'applications', f.appA), {
        status: 'reviewing', resumeFileUrl: 'https://storage.example.com/resumes/tampered?token=zzz',
      })
    )
  })

  test('employer cannot modify resumeFileName during a status update', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'applications', f.appA), {
        resumeFileUrl: 'https://storage.example.com/resumes/x?token=abc', resumeFileName: 'resume.pdf',
      })
    })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'reviewing', resumeFileName: 'tampered.pdf' }))
  })

  test('a normal status update on an application with NO resume fields (pre-existing shape) still succeeds', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'applications', f.appA), { status: 'shortlisted', updatedAt: serverTimestamp() }))
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

  test('candidate cannot modify resumeFileUrl while withdrawing', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'applications', f.appA), {
        resumeFileUrl: 'https://storage.example.com/resumes/x?token=abc', resumeFileName: 'resume.pdf',
      })
    })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      updateDoc(doc(db, 'applications', f.appA), {
        status: 'withdrawn', resumeFileUrl: 'https://storage.example.com/resumes/tampered?token=zzz',
      })
    )
  })

  test('candidate cannot modify resumeFileName while withdrawing', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await updateDoc(doc(ctx.firestore(), 'applications', f.appA), {
        resumeFileUrl: 'https://storage.example.com/resumes/x?token=abc', resumeFileName: 'resume.pdf',
      })
    })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'applications', f.appA), { status: 'withdrawn', resumeFileName: 'tampered.pdf' }))
  })
})

describe('applications.delete -- unconditionally denied', () => {
  test('neither candidate nor employer can delete an application', async () => {
    const f = await seedScenario({ appStatus: 'applied' })
    await assertFails(deleteDoc(doc(testEnv.authenticatedContext(f.candA).firestore(), 'applications', f.appA)))
    await assertFails(deleteDoc(doc(testEnv.authenticatedContext(f.empA).firestore(), 'applications', f.appA)))
  })
})

// adminService.getPlatformStats() counts applications per status via
// getCountFromServer(query(applicationsRef, where('status', '==', X))) --
// the admin branch of applications.read doesn't depend on resource.data at
// all (unlike the candidate/employer branches), so this must hold for a
// status-filtered query exactly the same way it already does for a direct
// doc read.
describe('applications -- admin can query/count by status (platform statistics)', () => {
  async function seedAdmin() {
    const adminA = nextId('admin')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', adminA), { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    })
    return adminA
  }

  test('admin can run a status-filtered query across all applications', async () => {
    const f = await seedScenario({ appStatus: 'hired' })
    const adminA = await seedAdmin()
    const db = testEnv.authenticatedContext(adminA).firestore()
    const snap = await assertSucceeds(getDocs(query(collection(db, 'applications'), where('status', '==', 'hired'))))
    expect(snap.docs.some((d) => d.id === f.appA)).toBe(true)
  })

  test('a non-admin cannot run the same platform-wide status query', async () => {
    await seedScenario({ appStatus: 'hired' })
    const other = await seedScenario({ appStatus: 'applied' })
    const db = testEnv.authenticatedContext(other.empB).firestore()
    await assertFails(getDocs(query(collection(db, 'applications'), where('status', '==', 'hired'))))
  })
})
