import { EMAIL_NOTIFICATION_TYPES, buildEmailForNotification } from './buildEmail.js'
import { sendEmail } from './resendClient.js'

function isAlreadyExistsError(err) {
  return err && (err.code === 6 || err.code === 'already-exists' || /ALREADY_EXISTS/i.test(String(err.message || '')))
}

// Orchestrates one notification -> (at most one) email, given the
// dependencies it needs (db, FieldValue) rather than importing
// firebase-admin directly — this is what lets every branch below be
// exercised with a lightweight in-memory fake in tests, no emulator
// required. Called by the onDocumentCreated trigger in index.js.
//
// Never throws: every failure path (bad data, provider error, Firestore
// error while logging) is caught and turned into a returned status object,
// so a broken email never surfaces as a Cloud Functions error/retry, and
// can never affect the application/interview write that already
// committed before this ever runs.
export async function handleNotificationEmail({ db, FieldValue, notificationId, notification }) {
  if (!EMAIL_NOTIFICATION_TYPES.includes(notification.type)) {
    return { status: 'skipped', reason: 'not-an-email-event' }
  }

  const logRef = db.collection('emailLog').doc(notificationId)

  // Idempotency lock: .create() fails if the document already exists, so
  // two overlapping/retried invocations for the same notification can
  // never both proceed past this point — whichever loses the race skips
  // entirely rather than risking a duplicate send.
  try {
    await logRef.create({
      status: 'processing',
      notificationType: notification.type,
      createdAt: FieldValue.serverTimestamp(),
    })
  } catch (err) {
    if (isAlreadyExistsError(err)) {
      return { status: 'skipped', reason: 'already-processed' }
    }
    throw err
  }

  const markSkipped = async (reason) => {
    await logRef.update({ status: 'skipped', reason, updatedAt: FieldValue.serverTimestamp() })
    return { status: 'skipped', reason }
  }

  try {
    const recipientSnap = await db.collection('users').doc(notification.recipientId).get()
    if (!recipientSnap.exists) return await markSkipped('recipient-not-found')

    const recipient = recipientSnap.data()
    if (recipient.moderationStatus === 'suspended') return await markSkipped('recipient-suspended')
    if (!recipient.email) return await markSkipped('recipient-missing-email')

    let application = null
    if (notification.relatedApplicationId) {
      const appSnap = await db.collection('applications').doc(notification.relatedApplicationId).get()
      application = appSnap.exists ? appSnap.data() : null
    }

    let interview = null
    if (notification.relatedInterviewId) {
      const ivSnap = await db.collection('interviews').doc(notification.relatedInterviewId).get()
      if (ivSnap.exists) {
        const raw = ivSnap.data()
        interview = { ...raw, scheduledAt: raw.scheduledAt?.toDate ? raw.scheduledAt.toDate() : raw.scheduledAt }
      }
    }

    const email = buildEmailForNotification(notification, {
      application,
      interview,
      recipientEmail: recipient.email,
      recipientName: recipient.full_name,
    })
    if (!email) return await markSkipped('missing-or-invalid-related-data')

    const result = await sendEmail(email)
    await logRef.update({
      status: 'sent',
      provider: result.source,
      providerId: result.id,
      updatedAt: FieldValue.serverTimestamp(),
    })
    return { status: 'sent' }
  } catch (err) {
    await logRef
      .update({ status: 'failed', error: String(err.message || err), updatedAt: FieldValue.serverTimestamp() })
      .catch(() => {})
    return { status: 'failed', error: String(err.message || err) }
  }
}
