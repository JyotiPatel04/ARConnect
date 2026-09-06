import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage'
import { makeStorageTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `s_${tag}${++n}`

const SMALL_PDF = new Uint8Array([1, 2, 3, 4])
const OVERSIZED = new Uint8Array(5 * 1024 * 1024 + 1)

beforeAll(async () => {
  testEnv = await makeStorageTestEnv('arconnect-7337f-rules-storage')
})
afterAll(async () => {
  await testEnv.cleanup()
})

function resumeRef(storage, uid, fileName = 'resume.pdf') {
  return ref(storage, `resumes/${uid}/${fileName}`)
}

describe('resumes/{userId}/{fileName} -- write (upload)', () => {
  test('the owning candidate can upload their own resume as a valid PDF', async () => {
    const uid = nextId('cand')
    const storage = testEnv.authenticatedContext(uid).storage()
    await assertSucceeds(uploadBytes(resumeRef(storage, uid), SMALL_PDF, { contentType: 'application/pdf' }))
  })

  test('the owning candidate can upload a valid DOCX', async () => {
    const uid = nextId('cand')
    const storage = testEnv.authenticatedContext(uid).storage()
    await assertSucceeds(
      uploadBytes(resumeRef(storage, uid, 'resume.docx'), SMALL_PDF, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      })
    )
  })

  test('a different candidate CANNOT upload into someone else\'s resume path', async () => {
    const ownerUid = nextId('cand')
    const attackerUid = nextId('cand')
    const storage = testEnv.authenticatedContext(attackerUid).storage()
    await assertFails(uploadBytes(resumeRef(storage, ownerUid), SMALL_PDF, { contentType: 'application/pdf' }))
  })

  test('an unauthenticated caller CANNOT upload a resume', async () => {
    const uid = nextId('cand')
    const storage = testEnv.unauthenticatedContext().storage()
    await assertFails(uploadBytes(resumeRef(storage, uid), SMALL_PDF, { contentType: 'application/pdf' }))
  })

  test('a disallowed content type is rejected even from the owner', async () => {
    const uid = nextId('cand')
    const storage = testEnv.authenticatedContext(uid).storage()
    await assertFails(uploadBytes(resumeRef(storage, uid, 'resume.exe'), SMALL_PDF, { contentType: 'application/x-msdownload' }))
  })

  test('a file over the 5MB size cap is rejected even from the owner', async () => {
    const uid = nextId('cand')
    const storage = testEnv.authenticatedContext(uid).storage()
    await assertFails(uploadBytes(resumeRef(storage, uid), OVERSIZED, { contentType: 'application/pdf' }))
  })
})

describe('resumes/{userId}/{fileName} -- read', () => {
  test('the owning candidate can read their own resume back', async () => {
    const uid = nextId('cand')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(resumeRef(ctx.storage(), uid), SMALL_PDF, { contentType: 'application/pdf' })
    })
    const storage = testEnv.authenticatedContext(uid).storage()
    await assertSucceeds(getBytes(resumeRef(storage, uid)))
  })

  test('a different candidate CANNOT read someone else\'s resume', async () => {
    const ownerUid = nextId('cand')
    const otherUid = nextId('cand')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(resumeRef(ctx.storage(), ownerUid), SMALL_PDF, { contentType: 'application/pdf' })
    })
    const storage = testEnv.authenticatedContext(otherUid).storage()
    await assertFails(getBytes(resumeRef(storage, ownerUid)))
  })

  test('an unauthenticated caller CANNOT read any resume', async () => {
    const uid = nextId('cand')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(resumeRef(ctx.storage(), uid), SMALL_PDF, { contentType: 'application/pdf' })
    })
    const storage = testEnv.unauthenticatedContext().storage()
    await assertFails(getBytes(resumeRef(storage, uid)))
  })
})

describe('resumes/{userId}/{fileName} -- delete', () => {
  test('the owning candidate can delete their own resume', async () => {
    const uid = nextId('cand')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(resumeRef(ctx.storage(), uid), SMALL_PDF, { contentType: 'application/pdf' })
    })
    const storage = testEnv.authenticatedContext(uid).storage()
    await assertSucceeds(deleteObject(resumeRef(storage, uid)))
  })

  test('a different candidate CANNOT delete someone else\'s resume', async () => {
    const ownerUid = nextId('cand')
    const otherUid = nextId('cand')
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(resumeRef(ctx.storage(), ownerUid), SMALL_PDF, { contentType: 'application/pdf' })
    })
    const storage = testEnv.authenticatedContext(otherUid).storage()
    await assertFails(deleteObject(resumeRef(storage, ownerUid)))
  })
})

describe('default-deny for anything outside resumes/{userId}/', () => {
  test('an authenticated user cannot write to an unrelated path', async () => {
    const uid = nextId('cand')
    const storage = testEnv.authenticatedContext(uid).storage()
    await assertFails(uploadBytes(ref(storage, `other/${uid}/file.pdf`), SMALL_PDF, { contentType: 'application/pdf' }))
  })
})
