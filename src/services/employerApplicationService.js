import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { createNotification } from './notificationService'

const applicationsRef = collection(db, 'applications')

export async function listApplicationsByEmployer(employerId) {
  const q = query(applicationsRef, where('employerId', '==', employerId))
  const snap = await getDocs(q)
  const applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  applications.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0))
  return applications
}

export const APPLICATION_STATUSES = ['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired']

const STATUS_LABELS = {
  applied: 'Applied',
  reviewing: 'In Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview',
  rejected: 'Not Selected',
  hired: 'Hired',
}

// Takes the full application object (the caller already has it in local
// state — see useEmployerApplications — so this needs no extra read) so
// the candidate's status-update notification can be built without a
// second Firestore round-trip. The security rules only allow this
// document's status (+ updatedAt) to change, and only by the employer who
// owns the job it belongs to — every other field, including
// candidateId/jobId, is permanently immutable.
export async function updateApplicationStatus(application, status) {
  await updateDoc(doc(db, 'applications', application.id), { status, updatedAt: serverTimestamp() })

  // The candidate's notification MUST reference the application AFTER
  // this update has committed (see firestore.rules — the create rule
  // validates recipientId against the already-persisted application). A
  // failure here doesn't undo or affect the status update itself, which
  // already succeeded; it's logged rather than surfaced so the employer's
  // successful status change is never blocked by a notification-only
  // failure.
  // `status` rides along on the notification document (in addition to the
  // human-readable message) purely so Phase 21's email Cloud Function can
  // tell "hired"/"rejected" apart from a generic status change without a
  // second Firestore read or fragile message-string parsing. The existing
  // create rule has no field allowlist, so this extra field doesn't need
  // any rules change; the existing update rule (mark-as-read) doesn't
  // reference it either, so it's preserved unchanged by Firestore's
  // merge-on-update semantics.
  createNotification({
    recipientId: application.candidateId,
    type: 'application_status_updated',
    title: 'Application Status Updated',
    message: `Your application for ${application.jobTitle} has been moved to ${STATUS_LABELS[status] || status}.`,
    relatedJobId: application.jobId,
    relatedApplicationId: application.id,
    status,
  }).catch((err) => {
    console.error('[notifications] failed to notify candidate of status change', err)
  })
}
