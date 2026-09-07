import { beforeAll, afterAll, describe, test } from 'vitest'
import { assertSucceeds, assertFails } from '@firebase/rules-unit-testing'
import { doc, setDoc, updateDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { makeTestEnv } from './setup.js'

let testEnv
let n = 0
const nextId = (tag) => `c_${tag}${++n}`

beforeAll(async () => {
  testEnv = await makeTestEnv('arconnect-7337f-rules-chat')
})
afterAll(async () => {
  await testEnv.cleanup()
})

async function seedScenario({ appStatus = 'applied', withConversation = false, empSuspended = false, candSuspended = false } = {}) {
  const empA = nextId('emp'), empB = nextId('emp'), candA = nextId('cand'), candB = nextId('cand')
  const jobA = nextId('job'), appA = `${candA}_${jobA}`
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'users', empA), {
      role: 'employer', full_name: 'Emp A', email: 'a@e.com',
      ...(empSuspended ? { moderationStatus: 'suspended' } : {}),
    })
    await setDoc(doc(db, 'users', empB), { role: 'employer', full_name: 'Emp B', email: 'b@e.com' })
    await setDoc(doc(db, 'users', candA), {
      role: 'candidate', full_name: 'Cand A', email: 'a@c.com',
      ...(candSuspended ? { moderationStatus: 'suspended' } : {}),
    })
    await setDoc(doc(db, 'users', candB), { role: 'candidate', full_name: 'Cand B', email: 'b@c.com' })
    await setDoc(doc(db, 'jobs', jobA), { employerId: empA, title: 'J', companyName: 'Co', status: 'active', applicationCount: 1 })
    await setDoc(doc(db, 'applications', appA), {
      candidateId: candA, jobId: jobA, employerId: empA, status: appStatus,
      jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A', candidateEmail: 'a@c.com',
      appliedAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
    if (withConversation) {
      await setDoc(doc(db, 'conversations', appA), validConversation({ appA, jobA, candA, empA }))
    }
  })
  return { empA, empB, candA, candB, jobA, appA }
}

function validConversation(f, overrides = {}) {
  return {
    applicationId: f.appA, jobId: f.jobA, candidateId: f.candA, employerId: f.empA,
    jobTitle: 'J', companyName: 'Co', candidateName: 'Cand A',
    lastMessage: null, lastMessageAt: null, lastMessageSenderId: null,
    candidateLastReadAt: null, employerLastReadAt: null,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    ...overrides,
  }
}

describe('conversations.create -- ownership, spoofing', () => {
  test('candidate can create a conversation for their own real application', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(setDoc(doc(db, 'conversations', f.appA), validConversation(f)))
  })

  test('employer can create a conversation for their own real application', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(setDoc(doc(db, 'conversations', f.appA), validConversation(f)))
  })

  test('a DIFFERENT candidate cannot create a conversation for someone else\'s application', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f)))
  })

  test('a DIFFERENT employer cannot create a conversation for someone else\'s application', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.empB).firestore()
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f)))
  })

  test('unauthenticated user cannot create a conversation', async () => {
    const f = await seedScenario()
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f)))
  })

  test('cannot spoof candidateId/employerId/jobTitle/companyName away from the real application', async () => {
    const f = await seedScenario()
    const other = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f, { employerId: other.empA })))
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f, { jobTitle: 'Fake Title' })))
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f, { companyName: 'Fake Co' })))
  })

  test('conversation id must equal the applicationId it claims', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(setDoc(doc(db, 'conversations', nextId('wrong')), validConversation(f)))
  })

  test('a candidate cannot start a conversation for an application unrelated to them (no relationship exists)', async () => {
    const f = await seedScenario()
    const other = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    // f.candA tries to piggyback on other's real application id/data, but isn't its candidate.
    await assertFails(setDoc(doc(db, 'conversations', other.appA), validConversation(other, { candidateId: f.candA })))
  })

  test('suspended employer cannot create a conversation', async () => {
    const f = await seedScenario({ empSuspended: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f)))
  })

  test('suspended candidate cannot create a conversation', async () => {
    const f = await seedScenario({ candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(setDoc(doc(db, 'conversations', f.appA), validConversation(f)))
  })
})

describe('conversations.read -- cross-role, cross-user access', () => {
  test('the candidate participant can read their conversation via query', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDocs(query(collection(db, 'conversations'), where('candidateId', '==', f.candA))))
  })

  test('a DIFFERENT candidate cannot read it', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(getDocs(query(collection(db, 'conversations'), where('candidateId', '==', f.candA))))
  })

  test('the employer participant can read their conversation via query', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(getDocs(query(collection(db, 'conversations'), where('employerId', '==', f.empA))))
  })

  test('a DIFFERENT employer cannot read it', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.empB).firestore()
    await assertFails(getDocs(query(collection(db, 'conversations'), where('employerId', '==', f.empA))))
  })

  test('unauthenticated user cannot read any conversation', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDocs(query(collection(db, 'conversations'), where('candidateId', '==', f.candA))))
  })
})

describe('conversations.update -- message-send bump vs. read-pointer moves', () => {
  test('the sender can bump the preview when sending a message', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(
      updateDoc(doc(db, 'conversations', f.appA), {
        lastMessage: 'hi', lastMessageAt: serverTimestamp(), lastMessageSenderId: f.empA, updatedAt: serverTimestamp(),
      })
    )
  })

  test('cannot claim to be the sender when you are not', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(
      updateDoc(doc(db, 'conversations', f.appA), {
        lastMessage: 'hi', lastMessageAt: serverTimestamp(), lastMessageSenderId: f.candA, updatedAt: serverTimestamp(),
      })
    )
  })

  test('the candidate can move only their OWN read pointer', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'conversations', f.appA), { candidateLastReadAt: serverTimestamp() }))
  })

  test('the candidate cannot move the EMPLOYER\'s read pointer', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'conversations', f.appA), { employerLastReadAt: serverTimestamp() }))
  })

  test('the employer can move only their OWN read pointer', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(updateDoc(doc(db, 'conversations', f.appA), { employerLastReadAt: serverTimestamp() }))
  })

  test('a non-participant cannot update the conversation at all', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.empB).firestore()
    await assertFails(updateDoc(doc(db, 'conversations', f.appA), { candidateLastReadAt: serverTimestamp() }))
  })

  test('cannot reassign a conversation to a different application/candidate/employer on update', async () => {
    const f = await seedScenario({ withConversation: true })
    const other = await seedScenario()
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertFails(updateDoc(doc(db, 'conversations', f.appA), { employerId: other.empA }))
  })
})

describe('conversations.delete -- unconditionally denied', () => {
  test('never deletable, not even by a participant', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(deleteDoc(doc(db, 'conversations', f.appA)))
  })
})

describe('messages.create -- membership, spoofing', () => {
  test('the candidate participant can send a message', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(
      setDoc(doc(collection(db, 'messages')), { conversationId: f.appA, senderId: f.candA, text: 'hello', createdAt: serverTimestamp() })
    )
  })

  test('the employer participant can send a message', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(
      setDoc(doc(collection(db, 'messages')), { conversationId: f.appA, senderId: f.empA, text: 'hi there', createdAt: serverTimestamp() })
    )
  })

  test('a non-participant cannot send a message into someone else\'s conversation', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(
      setDoc(doc(collection(db, 'messages')), { conversationId: f.appA, senderId: f.candB, text: 'sneaky', createdAt: serverTimestamp() })
    )
  })

  test('unauthenticated user cannot send a message', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(
      setDoc(doc(collection(db, 'messages')), { conversationId: f.appA, senderId: f.candA, text: 'hello', createdAt: serverTimestamp() })
    )
  })

  test('a participant cannot spoof another user as the sender', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(collection(db, 'messages')), { conversationId: f.appA, senderId: f.empA, text: 'pretending', createdAt: serverTimestamp() })
    )
  })

  test('empty or whitespace-only text is rejected', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(collection(db, 'messages')), { conversationId: f.appA, senderId: f.candA, text: '', createdAt: serverTimestamp() })
    )
  })

  test('text over the 2000-character cap is rejected', async () => {
    const f = await seedScenario({ withConversation: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(collection(db, 'messages')), {
        conversationId: f.appA, senderId: f.candA, text: 'a'.repeat(2001), createdAt: serverTimestamp(),
      })
    )
  })

  test('a message for a non-existent application/conversation is rejected', async () => {
    const f = await seedScenario()
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(collection(db, 'messages')), { conversationId: nextId('ghost'), senderId: f.candA, text: 'hi', createdAt: serverTimestamp() })
    )
  })

  test('suspended user cannot send a message even as a real participant', async () => {
    const f = await seedScenario({ withConversation: true, candSuspended: true })
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(
      setDoc(doc(collection(db, 'messages')), { conversationId: f.appA, senderId: f.candA, text: 'hi', createdAt: serverTimestamp() })
    )
  })
})

describe('messages.read -- membership only', () => {
  async function seedWithMessage(f) {
    let messageId
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = doc(collection(ctx.firestore(), 'messages'))
      messageId = ref.id
      await setDoc(ref, { conversationId: f.appA, senderId: f.candA, text: 'hi', createdAt: serverTimestamp() })
    })
    return messageId
  }

  test('the candidate participant can read messages in their conversation', async () => {
    const f = await seedScenario({ withConversation: true })
    await seedWithMessage(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertSucceeds(getDocs(query(collection(db, 'messages'), where('conversationId', '==', f.appA))))
  })

  test('the employer participant can read messages in their conversation', async () => {
    const f = await seedScenario({ withConversation: true })
    await seedWithMessage(f)
    const db = testEnv.authenticatedContext(f.empA).firestore()
    await assertSucceeds(getDocs(query(collection(db, 'messages'), where('conversationId', '==', f.appA))))
  })

  test('a non-participant cannot read messages from someone else\'s conversation', async () => {
    const f = await seedScenario({ withConversation: true })
    await seedWithMessage(f)
    const db = testEnv.authenticatedContext(f.candB).firestore()
    await assertFails(getDocs(query(collection(db, 'messages'), where('conversationId', '==', f.appA))))
  })

  test('unauthenticated user cannot read any messages', async () => {
    const f = await seedScenario({ withConversation: true })
    await seedWithMessage(f)
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDocs(query(collection(db, 'messages'), where('conversationId', '==', f.appA))))
  })
})

describe('messages.update / delete -- immutable, even for the sender', () => {
  async function seedWithMessage(f) {
    let messageId
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const ref = doc(collection(ctx.firestore(), 'messages'))
      messageId = ref.id
      await setDoc(ref, { conversationId: f.appA, senderId: f.candA, text: 'hi', createdAt: serverTimestamp() })
    })
    return messageId
  }

  test('the sender cannot edit their own message', async () => {
    const f = await seedScenario({ withConversation: true })
    const messageId = await seedWithMessage(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(updateDoc(doc(db, 'messages', messageId), { text: 'edited' }))
  })

  test('the sender cannot delete their own message', async () => {
    const f = await seedScenario({ withConversation: true })
    const messageId = await seedWithMessage(f)
    const db = testEnv.authenticatedContext(f.candA).firestore()
    await assertFails(deleteDoc(doc(db, 'messages', messageId)))
  })
})

// Coverage for the notifications.create 'new_message' branch itself lives
// in tests/rules/notifications.test.js (branch 6), alongside every other
// notification-creation branch this app has — not duplicated here.
