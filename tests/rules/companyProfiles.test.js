import { beforeAll, afterAll, describe, test, expect } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

// companyProfiles/companySummaries had NO dedicated rules coverage before
// the Employer Verification feature -- this file covers both the
// pre-existing owner-only behavior (never tested until now) and the new
// admin verification branch, so a future change to either can't silently
// regress the other.
let testEnv
let n = 0
const nextId = (tag) => `cp_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-company-profiles')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ verificationStatus = 'pending', verificationNote = null, empSuspended = false } = {}) {
  const empA = nextId('emp'), empB = nextId('emp'), adminA = nextId('admin'), candA = nextId('cand')
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', empA), {
      role: 'employer', full_name: 'Emp A', email: 'a@e.com', ...(empSuspended ? { moderationStatus: 'suspended' } : {}),
    })
    await setDoc(doc(db, 'users', empB), { role: 'employer', full_name: 'Emp B', email: 'b@e.com' })
    await setDoc(doc(db, 'users', adminA), { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    await setDoc(doc(db, 'users', candA), { role: 'candidate', full_name: 'Cand', email: 'c@x.com' })
    await setDoc(doc(db, 'companyProfiles', empA), profilePayload({ employerId: empA, verificationStatus, verificationNote }))
    await setDoc(doc(db, 'companySummaries', empA), summaryPayload({ employerId: empA, verified: verificationStatus === 'verified' }))
  })
  return { empA, empB, adminA, candA }
}

function profilePayload(overrides = {}) {
  return {
    employerId: overrides.employerId ?? 'placeholder',
    companyName: 'Acme', companyLogoUrl: '', industry: 'Tech', companySize: '11-50',
    location: 'Delhi', website: 'https://acme.example.com', about: 'We build things.',
    contactEmail: 'contact@acme.example.com', contactPhone: '9999999999', foundedYear: 2020,
    profileComplete: true, verificationStatus: 'pending', verificationNote: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    ...overrides,
  }
}

function summaryPayload(overrides = {}) {
  return {
    employerId: overrides.employerId ?? 'placeholder',
    companyName: 'Acme', companyLogoUrl: '', industry: 'Tech', companySize: '11-50',
    location: 'Delhi', website: 'https://acme.example.com', about: 'We build things.', foundedYear: 2020,
    verified: false, updatedAt: serverTimestamp(),
    ...overrides,
  }
}

describe('companyProfiles.create -- pre-existing owner-only behavior', () => {
  test('an employer can create their own company profile', async () => {
    const empA = nextId('emp')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', empA), { role: 'employer', full_name: 'Emp', email: 'e@x.com' })
    })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(setDoc(doc(db, 'companyProfiles', empA), profilePayload({ employerId: empA })))
  })

  test('an employer cannot create a company profile for a different uid', async () => {
    const empA = nextId('emp'), empB = nextId('emp')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', empA), { role: 'employer', full_name: 'Emp', email: 'e@x.com' })
    })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(setDoc(doc(db, 'companyProfiles', empB), profilePayload({ employerId: empB })))
  })

  test('a candidate cannot create a company profile', async () => {
    const candA = nextId('cand')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', candA), { role: 'candidate', full_name: 'Cand', email: 'c@x.com' })
    })
    const db = testEnv.authenticatedContext(candA).firestore()
    await assertFails(setDoc(doc(db, 'companyProfiles', candA), profilePayload({ employerId: candA })))
  })

  test('a suspended employer cannot create a company profile', async () => {
    const empA = nextId('emp')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users', empA), { role: 'employer', full_name: 'Emp', email: 'e@x.com', moderationStatus: 'suspended' })
    })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(setDoc(doc(db, 'companyProfiles', empA), profilePayload({ employerId: empA })))
  })

  test('an unauthenticated caller cannot create a company profile', async () => {
    const empA = nextId('emp')
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'companyProfiles', empA), profilePayload({ employerId: empA })))
  })
})

describe('companyProfiles.read -- owner and admin only, never public', () => {
  test('the owning employer can read their own profile', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(getDoc(doc(db, 'companyProfiles', empA)))
  })

  test('a DIFFERENT employer cannot read another employer\'s profile', async () => {
    const { empA, empB } = await seedScenario()
    const db = testEnv.authenticatedContext(empB).firestore()
    await assertFails(getDoc(doc(db, 'companyProfiles', empA)))
  })

  test('a candidate cannot read a company profile (contact details are private)', async () => {
    const { empA, candA } = await seedScenario()
    const db = testEnv.authenticatedContext(candA).firestore()
    await assertFails(getDoc(doc(db, 'companyProfiles', empA)))
  })

  test('an unauthenticated caller cannot read a company profile', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'companyProfiles', empA)))
  })

  test('admin CAN read any employer\'s company profile (needed to review verification)', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(getDoc(doc(db, 'companyProfiles', empA)))
  })
})

describe('companyProfiles.update -- owner branch preserved, verification is admin-only', () => {
  test('the owner can still update ordinary company fields', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'companyProfiles', empA), { companyName: 'Acme Corp', about: 'Updated about.', updatedAt: serverTimestamp() })
    )
  })

  test('the owner\'s update preserves an existing verificationStatus/verificationNote unchanged', async () => {
    const { empA } = await seedScenario({ verificationStatus: 'rejected', verificationNote: 'Missing website' })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'companyProfiles', empA), {
        companyName: 'Acme Corp', verificationStatus: 'rejected', verificationNote: 'Missing website', updatedAt: serverTimestamp(),
      })
    )
  })

  test('the owner CANNOT self-verify by setting verificationStatus on their own update', async () => {
    const { empA } = await seedScenario({ verificationStatus: 'pending' })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified' }))
  })

  test('the owner CANNOT clear their own rejection note', async () => {
    const { empA } = await seedScenario({ verificationStatus: 'rejected', verificationNote: 'Missing website' })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationNote: null }))
  })

  test('a suspended employer cannot update their own company profile', async () => {
    const { empA } = await seedScenario({ empSuspended: true })
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { companyName: 'New Name' }))
  })

  test('a DIFFERENT (non-admin) employer cannot update someone else\'s profile at all', async () => {
    const { empA, empB } = await seedScenario()
    const db = testEnv.authenticatedContext(empB).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { companyName: 'Hijacked' }))
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified' }))
  })

  test('a candidate cannot perform verification', async () => {
    const { empA, candA } = await seedScenario()
    const db = testEnv.authenticatedContext(candA).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified' }))
  })

  test('admin can approve: verificationStatus -> verified, with a note', async () => {
    const { empA, adminA } = await seedScenario({ verificationStatus: 'pending' })
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified', verificationNote: 'Looks good', updatedAt: serverTimestamp() })
    )
  })

  test('admin can reject: verificationStatus -> rejected, with a note', async () => {
    const { empA, adminA } = await seedScenario({ verificationStatus: 'pending' })
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'rejected', verificationNote: 'Invalid website', updatedAt: serverTimestamp() })
    )
  })

  test('admin cannot set verificationStatus to an arbitrary value (only verified/rejected)', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'pending' }))
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'made-up' }))
  })

  test('admin CANNOT modify unrelated company fields (name, contact details, etc.)', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified', companyName: 'Renamed by admin' }))
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified', contactEmail: 'admin@intercepted.com' }))
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified', contactPhone: '0000000000' }))
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified', about: 'rewritten' }))
  })

  test('admin cannot reassign a profile to a different employerId', async () => {
    const { empA, empB, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertFails(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified', employerId: empB }))
  })

  test('a suspended employer still shows up correctly for admin verification (moderation and verification are independent)', async () => {
    const { empA, adminA } = await seedScenario({ empSuspended: true })
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'companyProfiles', empA), { verificationStatus: 'verified', updatedAt: serverTimestamp() }))
  })
})

describe('companyProfiles.delete -- never allowed', () => {
  test('not even the owner can delete a company profile', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(deleteDoc(doc(db, 'companyProfiles', empA)))
  })
})

describe('companySummaries -- public read preserved, verification write protected', () => {
  test('companySummaries remains publicly readable, even unauthenticated', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.unauthenticatedContext().firestore()
    await assertSucceeds(getDoc(doc(db, 'companySummaries', empA)))
  })

  test('the owner can still create/update their own summary as before', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'companySummaries', empA), { companyName: 'Acme Corp', updatedAt: serverTimestamp() }))
  })

  test('the owner still cannot smuggle contactEmail/contactPhone into their summary', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'companySummaries', empA), { contactEmail: 'leak@x.com' }))
    await assertFails(updateDoc(doc(db, 'companySummaries', empA), { contactPhone: '1234567890' }))
  })

  test('the owner CANNOT self-set verified on their own summary update', async () => {
    const { empA } = await seedScenario()
    const db = testEnv.authenticatedContext(empA).firestore()
    await assertFails(updateDoc(doc(db, 'companySummaries', empA), { verified: true }))
  })

  test('admin can flip companySummaries.verified to true', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'companySummaries', empA), { verified: true, updatedAt: serverTimestamp() }))
  })

  test('admin can flip companySummaries.verified to false (rejection)', async () => {
    const { empA, adminA } = await seedScenario({ verificationStatus: 'verified' })
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'companySummaries', empA), { verified: false, updatedAt: serverTimestamp() }))
  })

  test('admin CANNOT modify unrelated summary fields', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertFails(updateDoc(doc(db, 'companySummaries', empA), { verified: true, companyName: 'Renamed' }))
  })

  test('admin cannot smuggle contactEmail/contactPhone into the summary via the verification path', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertFails(updateDoc(doc(db, 'companySummaries', empA), { verified: true, contactEmail: 'leak@x.com' }))
  })

  test('a non-owner, non-admin employer cannot update someone else\'s summary', async () => {
    const { empA, empB } = await seedScenario()
    const db = testEnv.authenticatedContext(empB).firestore()
    await assertFails(updateDoc(doc(db, 'companySummaries', empA), { verified: true }))
    await assertFails(updateDoc(doc(db, 'companySummaries', empA), { companyName: 'Hijacked' }))
  })
})

describe('companyProfiles -- list query used by the admin Pending Verifications page', () => {
  test('admin can query companyProfiles filtered by verificationStatus == pending', async () => {
    const { empA, adminA } = await seedScenario({ verificationStatus: 'pending' })
    const db = testEnv.authenticatedContext(adminA).firestore()
    const snap = await assertSucceeds(getDocs(query(collection(db, 'companyProfiles'), where('verificationStatus', '==', 'pending'))))
    expect(snap.docs.some((d) => d.id === empA)).toBe(true)
  })

  test('a non-admin cannot run the same pending-verifications query', async () => {
    const { empB } = await seedScenario()
    const db = testEnv.authenticatedContext(empB).firestore()
    await assertFails(getDocs(query(collection(db, 'companyProfiles'), where('verificationStatus', '==', 'pending'))))
  })
})

// moderationLogs itself has no other dedicated rules test file (it's only
// ever exercised indirectly, through the real app's batched moderation
// writes) -- this covers just the two new action values/targetType this
// feature adds, not a full audit of the pre-existing suspend/job actions.
describe('moderationLogs -- accepts the new employer verification actions', () => {
  test('admin can log an employer_verified entry against targetType company', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'moderationLogs', 'log1'), {
        adminId: adminA, action: 'employer_verified', targetType: 'company', targetId: empA,
        reason: 'Looks legitimate', createdAt: serverTimestamp(),
      })
    )
  })

  test('admin can log an employer_rejected entry against targetType company', async () => {
    const { empA, adminA } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertSucceeds(
      setDoc(doc(db, 'moderationLogs', 'log2'), {
        adminId: adminA, action: 'employer_rejected', targetType: 'company', targetId: empA,
        reason: 'Invalid website', createdAt: serverTimestamp(),
      })
    )
  })

  test('a non-admin cannot write an employer verification log entry', async () => {
    const { empA, empB } = await seedScenario()
    const db = testEnv.authenticatedContext(empB).firestore()
    await assertFails(
      setDoc(doc(db, 'moderationLogs', 'log3'), {
        adminId: empB, action: 'employer_verified', targetType: 'company', targetId: empA,
        reason: 'Looks legitimate', createdAt: serverTimestamp(),
      })
    )
  })

  test('admin cannot spoof adminId to someone else on a verification log entry', async () => {
    const { empA, adminA, empB } = await seedScenario()
    const db = testEnv.authenticatedContext(adminA).firestore()
    await assertFails(
      setDoc(doc(db, 'moderationLogs', 'log4'), {
        adminId: empB, action: 'employer_verified', targetType: 'company', targetId: empA,
        reason: 'Looks legitimate', createdAt: serverTimestamp(),
      })
    )
  })
})
