import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `u_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-users')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedUser(uid, data) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'users', uid), data)
  })
}

describe('users.create -- role escalation prevention', () => {
  test('a user can create their own profile as candidate', async () => {
    const uid = nextId('cand')
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertSucceeds(setDoc(doc(db, 'users', uid), { role: 'candidate', full_name: 'A', email: 'a@x.com' }))
  })

  test('a user can create their own profile as employer', async () => {
    const uid = nextId('emp')
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertSucceeds(setDoc(doc(db, 'users', uid), { role: 'employer', full_name: 'A', email: 'a@x.com' }))
  })

  test('a user CANNOT self-declare role: admin -- no client path to admin, ever', async () => {
    const uid = nextId('spoof')
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(setDoc(doc(db, 'users', uid), { role: 'admin', full_name: 'A', email: 'a@x.com' }))
  })

  test('a user cannot create a profile document for a DIFFERENT uid', async () => {
    const uid = nextId('self')
    const otherUid = nextId('other')
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(setDoc(doc(db, 'users', otherUid), { role: 'candidate', full_name: 'A', email: 'a@x.com' }))
  })

  test('unauthenticated cannot create a user profile', async () => {
    const uid = nextId('anon')
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'users', uid), { role: 'candidate', full_name: 'A', email: 'a@x.com' }))
  })
})

describe('users.update -- owner path cannot touch role or moderationStatus', () => {
  test('owner can update their own non-role fields', async () => {
    const uid = nextId('cand')
    await seedUser(uid, { role: 'candidate', full_name: 'Old Name', email: 'a@x.com' })
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertSucceeds(updateDoc(doc(db, 'users', uid), { full_name: 'New Name', role: 'candidate' }))
  })

  test('owner CANNOT change their own role via update', async () => {
    const uid = nextId('cand')
    await seedUser(uid, { role: 'candidate', full_name: 'A', email: 'a@x.com' })
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(updateDoc(doc(db, 'users', uid), { role: 'employer' }))
  })

  test('owner CANNOT change their own moderationStatus via update (self-unsuspend / self-flag)', async () => {
    const uid = nextId('cand')
    await seedUser(uid, { role: 'candidate', full_name: 'A', email: 'a@x.com', moderationStatus: 'active' })
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(updateDoc(doc(db, 'users', uid), { role: 'candidate', moderationStatus: 'suspended' }))
  })

  test('a user cannot update a DIFFERENT user\'s profile', async () => {
    const uid = nextId('cand')
    const otherUid = nextId('other')
    await seedUser(otherUid, { role: 'candidate', full_name: 'A', email: 'a@x.com' })
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(updateDoc(doc(db, 'users', otherUid), { full_name: 'Hacked' }))
  })
})

describe('users.update -- admin moderation path', () => {
  test('admin can suspend a user (the ONLY field that changes)', async () => {
    const adminUid = nextId('admin')
    const targetUid = nextId('target')
    await seedUser(adminUid, { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    await seedUser(targetUid, { role: 'employer', full_name: 'Emp', email: 'emp@x.com', moderationStatus: 'active', created_at: serverTimestamp() })
    const db = testEnv.authenticatedContext(adminUid).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'users', targetUid), {
        moderationStatus: 'suspended', role: 'employer', full_name: 'Emp', email: 'emp@x.com',
      })
    )
  })

  test('admin can unsuspend a user back to active', async () => {
    const adminUid = nextId('admin')
    const targetUid = nextId('target')
    await seedUser(adminUid, { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    await seedUser(targetUid, { role: 'employer', full_name: 'Emp', email: 'emp@x.com', moderationStatus: 'suspended', created_at: serverTimestamp() })
    const db = testEnv.authenticatedContext(adminUid).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'users', targetUid), { moderationStatus: 'active', role: 'employer', full_name: 'Emp', email: 'emp@x.com' })
    )
  })

  test('admin CANNOT suspend themselves', async () => {
    const adminUid = nextId('admin')
    await seedUser(adminUid, { role: 'admin', full_name: 'Admin', email: 'admin@x.com', moderationStatus: 'active' })
    const db = testEnv.authenticatedContext(adminUid).firestore()
    await assertFails(
      updateDoc(doc(db, 'users', adminUid), { moderationStatus: 'suspended', role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    )
  })

  test('admin moderation path CANNOT change role, full_name, or email', async () => {
    const adminUid = nextId('admin')
    const targetUid = nextId('target')
    await seedUser(adminUid, { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    await seedUser(targetUid, { role: 'employer', full_name: 'Emp', email: 'emp@x.com' })
    const db = testEnv.authenticatedContext(adminUid).firestore()
    await assertFails(updateDoc(doc(db, 'users', targetUid), { moderationStatus: 'suspended', role: 'candidate' }))
    await assertFails(updateDoc(doc(db, 'users', targetUid), { moderationStatus: 'suspended', full_name: 'Renamed' }))
  })

  test('a non-admin cannot use the admin moderation path at all', async () => {
    const empUid = nextId('emp')
    const targetUid = nextId('target')
    await seedUser(empUid, { role: 'employer', full_name: 'Emp', email: 'emp@x.com' })
    await seedUser(targetUid, { role: 'employer', full_name: 'Other', email: 'other@x.com' })
    const db = testEnv.authenticatedContext(empUid).firestore()
    await assertFails(updateDoc(doc(db, 'users', targetUid), { moderationStatus: 'suspended' }))
  })
})

describe('users.read -- cross-role access', () => {
  test('a user can read their own profile', async () => {
    const uid = nextId('cand')
    await seedUser(uid, { role: 'candidate', full_name: 'A', email: 'a@x.com' })
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertSucceeds(getDoc(doc(db, 'users', uid)))
  })

  test('a non-admin CANNOT read another user\'s profile', async () => {
    const uid = nextId('cand')
    const otherUid = nextId('other')
    await seedUser(otherUid, { role: 'employer', full_name: 'A', email: 'a@x.com' })
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(getDoc(doc(db, 'users', otherUid)))
  })

  test('admin CAN read any user\'s profile', async () => {
    const adminUid = nextId('admin')
    const otherUid = nextId('other')
    await seedUser(adminUid, { role: 'admin', full_name: 'Admin', email: 'admin@x.com' })
    await seedUser(otherUid, { role: 'candidate', full_name: 'A', email: 'a@x.com' })
    const db = testEnv.authenticatedContext(adminUid).firestore()
    await assertSucceeds(getDoc(doc(db, 'users', otherUid)))
  })

  test('unauthenticated cannot read any profile', async () => {
    const otherUid = nextId('other')
    await seedUser(otherUid, { role: 'candidate', full_name: 'A', email: 'a@x.com' })
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'users', otherUid)))
  })
})

describe('users.delete -- unconditionally denied', () => {
  test('not even the owner can delete their own profile', async () => {
    const uid = nextId('cand')
    await seedUser(uid, { role: 'candidate', full_name: 'A', email: 'a@x.com' })
    const db = testEnv.authenticatedContext(uid).firestore()
    await assertFails(deleteDoc(doc(db, 'users', uid)))
  })
})
