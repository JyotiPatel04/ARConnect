import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { createNotification } from './notificationService'
import { hasUnreadMessage } from '../lib/chatUnread'
import { prepareMessageText } from '../lib/chatMessage'

const conversationsRef = collection(db, 'conversations')
const messagesRef = collection(db, 'messages')

// A conversation's document id is always the id of the application it's
// tied to (see firestore.rules -- this is what lets every authorization
// check reuse the existing applicationFor() trust helper instead of a new
// one). No separate id scheme, no possibility of two conversations
// existing for the same application.

// `{ serverTimestamps: 'estimate' }` on every .data() call below matters a
// lot more here than it would elsewhere in this app: the very next write
// this data can trigger (markConversationRead, driven by hasUnreadMessage)
// depends on candidateLastReadAt/employerLastReadAt/lastMessageAt being
// resolved timestamps. Without 'estimate', a just-written serverTimestamp()
// reads back as null in its own optimistic local echo (the real value
// isn't known until the server acks) -- hasUnreadMessage would then see
// "no read pointer yet", conclude the conversation is STILL unread, and
// fire markConversationRead again, whose write produces another
// null-then-resolved echo, looping rapidly until the server ack finally
// lands. 'estimate' reads the pending write's local timestamp immediately,
// so the guard sees a real value on the very first echo and never loops.

// Realtime — fires immediately with the current list, then again on every
// change. Sorted client-side by most-recently-active (same index-avoidance
// convention as every other list query in this app: a single equality
// where() with no orderBy needs no composite index).
export function subscribeToConversations(uid, role, onData, onError) {
  const field = role === 'employer' ? 'employerId' : 'candidateId'
  const q = query(conversationsRef, where(field, '==', uid))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))
      list.sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0))
      onData(list)
    },
    onError
  )
}

export function subscribeToConversation(applicationId, onData, onError) {
  return onSnapshot(
    doc(db, 'conversations', applicationId),
    (snap) => onData(snap.exists() ? { id: snap.id, ...snap.data({ serverTimestamps: 'estimate' }) } : null),
    onError
  )
}

export function subscribeToMessages(applicationId, onData, onError) {
  const q = query(messagesRef, where('conversationId', '==', applicationId))
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0))
      onData(list)
    },
    onError
  )
}

// Lazily creates the conversation for this application the first time
// either participant opens it -- every field is copied straight from the
// real, already-loaded application object (never a client guess), which
// is exactly what the create rule independently re-verifies against that
// same application document.
//
// Tries the create FIRST rather than reading-then-creating: a
// conversation's read rule can only ever grant access based on the
// document's own candidateId/employerId, which don't exist yet for a
// brand-new conversation -- there's no way to "check first" without a
// read that's structurally unauthorizable before creation happens. This
// mirrors applicationService.js's applyToJob(), which resolves the exact
// same "does this already exist" question the same way: attempt the
// write, and treat a permission-denied as "it must already exist" only
// once it's safe to read (i.e., after create is what failed).
export async function getOrCreateConversation(application) {
  const ref = doc(db, 'conversations', application.id)
  const data = {
    applicationId: application.id,
    jobId: application.jobId,
    candidateId: application.candidateId,
    employerId: application.employerId,
    jobTitle: application.jobTitle,
    companyName: application.companyName,
    candidateName: application.candidateName,
    lastMessage: null,
    lastMessageAt: null,
    lastMessageSenderId: null,
    candidateLastReadAt: null,
    employerLastReadAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  try {
    await setDoc(ref, data)
    return { id: application.id, ...data }
  } catch (err) {
    if (err.code === 'permission-denied') {
      const existing = await getDoc(ref)
      if (existing.exists()) return { id: existing.id, ...existing.data() }
    }
    throw err
  }
}

// Sends a message and bumps the conversation's preview fields in one
// atomic batch -- both writes are independently validated by their own
// rules (see firestore.rules' messages.create and conversations.update).
// A best-effort notification to the OTHER participant follows separately,
// after the batch has committed, same pattern as every other notification
// in this app: a failure here never undoes or blocks the message itself.
export async function sendMessage(conversation, senderId, senderRole, rawText) {
  const text = prepareMessageText(rawText)
  if (!text) throw new Error('Message cannot be empty.')

  const messageRef = doc(messagesRef)
  const conversationRef = doc(db, 'conversations', conversation.id)

  const batch = writeBatch(db)
  batch.set(messageRef, {
    conversationId: conversation.id,
    senderId,
    text,
    createdAt: serverTimestamp(),
  })
  batch.update(conversationRef, {
    lastMessage: text,
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: senderId,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  const recipientId = senderRole === 'candidate' ? conversation.employerId : conversation.candidateId
  createNotification({
    recipientId,
    type: 'new_message',
    title: 'New Message',
    message: `You have a new message about ${conversation.jobTitle}.`,
    relatedJobId: conversation.jobId,
    relatedApplicationId: conversation.id,
  }).catch((err) => {
    console.error('[chat] failed to notify recipient of new message', err)
  })

  return messageRef.id
}

// Moves the caller's own read pointer forward -- skipped entirely (no
// write at all) when there's nothing new to acknowledge, so re-opening an
// already-read conversation doesn't generate a Firestore write every time.
export async function markConversationRead(conversation, uid, role) {
  if (!hasUnreadMessage(conversation, uid)) return
  const field = role === 'candidate' ? 'candidateLastReadAt' : 'employerLastReadAt'
  await updateDoc(doc(db, 'conversations', conversation.id), { [field]: serverTimestamp() })
}
