import { collection, doc, getDocs, limit, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'

const notificationsRef = collection(db, 'notifications')

// No orderBy — combining it with the where(recipientId==) equality filter
// would need a composite index (see firestore.indexes.json comment / the
// Phase 8 report for why none was added). Sorted client-side instead,
// same pattern already used throughout this app (jobService, applicationService).
// The limit keeps this from ever reading a user's entire notification
// history at once.
const NOTIFICATION_LIST_LIMIT = 100

// Always call this AFTER the real action it documents (application
// create, status update) has already committed — never in the same
// batch. See firestore.rules for why: the create rule validates
// recipientId against an already-persisted application document, which
// only exists once that prior write has actually landed.
export async function createNotification({
  recipientId,
  type,
  title,
  message,
  relatedJobId = null,
  relatedApplicationId = null,
  relatedInterviewId = null,
  status = null,
}) {
  const ref = doc(notificationsRef)
  const data = {
    recipientId,
    type,
    title,
    message,
    relatedJobId,
    relatedApplicationId,
    read: false,
    createdAt: serverTimestamp(),
  }
  // Only ever set on Phase 10's interview notification types — omitted
  // entirely (not even written as null) for every existing Phase 8 type,
  // so those documents are byte-for-byte unchanged from before this phase.
  if (relatedInterviewId != null) data.relatedInterviewId = relatedInterviewId
  // Only ever set on 'application_status_updated' (Phase 21: lets the
  // email Cloud Function distinguish hired/rejected/generic) — same
  // omit-if-absent treatment, so every other notification type is
  // unaffected.
  if (status != null) data.status = status
  await setDoc(ref, data)
  return ref.id
}

export async function listMyNotifications(uid) {
  const q = query(notificationsRef, where('recipientId', '==', uid), limit(NOTIFICATION_LIST_LIMIT))
  const snap = await getDocs(q)
  const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  notifications.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  return notifications
}

// `read` is the only field the update rule ever allows to change — every
// other field is permanently immutable once a notification is created.
export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true })
}

export async function markAllNotificationsRead(notificationIds) {
  if (notificationIds.length === 0) return
  const batch = writeBatch(db)
  notificationIds.forEach((id) => batch.update(doc(db, 'notifications', id), { read: true }))
  await batch.commit()
}
