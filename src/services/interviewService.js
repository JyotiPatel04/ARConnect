import { Timestamp, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { createNotification } from './notificationService'
import { updateApplicationStatus } from './employerApplicationService'

const interviewsRef = collection(db, 'interviews')

const STATUS_LABELS = { scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' }

// Scheduling should never silently move a pipeline stage backward or
// re-notify a stage it's already in: 'interview' is already there (e.g.
// scheduling a second interview after cancelling the first), and
// 'rejected'/'hired' are the employer's own final decisions — scheduling
// an interview against one of those (the UI does still allow it, for a
// candidate an employer wants to reconsider) must never overwrite that
// decision. 'withdrawn' is included for clarity even though the
// interviews.create rule already makes scheduling against a withdrawn
// application impossible, so this branch can never actually run for it.
const STATUSES_NOT_ADVANCED_TO_INTERVIEW = ['interview', 'rejected', 'hired', 'withdrawn']

// No orderBy combined with the equality filters below — same
// index-avoidance reasoning as every other list query in this app (see
// notificationService.js / adminService.js). Sorted client-side instead.
function sortByCreatedAtDesc(list) {
  return [...list].sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
}

export async function listInterviewsByCandidate(candidateId) {
  const snap = await getDocs(query(interviewsRef, where('candidateId', '==', candidateId)))
  return sortByCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}

export async function listInterviewsByEmployer(employerId) {
  const snap = await getDocs(query(interviewsRef, where('employerId', '==', employerId)))
  return sortByCreatedAtDesc(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
}

// `application` is the full application object the caller already has in
// local state (see useEmployerApplications) — candidateId/jobId/employerId
// come from it, never from a separate read. The security rules
// independently re-verify all three against the real application document
// via get(), so this isn't a trust boundary — just avoiding a redundant read.
export async function scheduleInterview(application, fields) {
  const ref = doc(interviewsRef)
  await setDoc(ref, {
    applicationId: application.id,
    jobId: application.jobId,
    candidateId: application.candidateId,
    employerId: application.employerId,
    scheduledAt: Timestamp.fromDate(fields.scheduledAt),
    durationMinutes: fields.durationMinutes,
    interviewType: fields.interviewType,
    meetingLink: fields.meetingLink || '',
    location: fields.location || '',
    notes: fields.notes || '',
    status: 'scheduled',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  // Keeps the application's own pipeline stage from silently lagging
  // behind the interview that was just scheduled against it (the bug this
  // sync fixes: Application = Shortlisted, Interview = Scheduled, shown
  // side by side on the same Applications page). Awaited — not
  // fire-and-forget like the notification below — so the caller's own
  // post-schedule refetch (see useApplicationInterviewActions) can never
  // observe the stale status.
  //
  // A failure here does NOT throw and does NOT undo the interview, which
  // already committed successfully above — a duplicate interview is a
  // worse outcome than a stale status label, and this app has no
  // idempotency guard that would stop an employer from creating a second
  // interview if a thrown error here sent them back to a "still open,
  // please retry" dialog. Instead, the failure is surfaced through the
  // return value (`statusSynced: false`) so the caller can tell this case
  // apart from a fully-clean schedule, without the primary operation ever
  // being reported as failed.
  let statusSynced = true
  if (!STATUSES_NOT_ADVANCED_TO_INTERVIEW.includes(application.status)) {
    statusSynced = await updateApplicationStatus(application, 'interview')
      .then(() => true)
      .catch((err) => {
        console.error(
          `[interviews] failed to advance application ${application.id} to 'interview' after scheduling interview ${ref.id}`,
          err
        )
        return false
      })
  }

  // Notification is created AFTER the interview above has committed —
  // its create rule validates recipientId against the now-persisted
  // interview document (see firestore.rules). A failure here doesn't
  // undo or affect the scheduled interview, which already succeeded.
  createNotification({
    recipientId: application.candidateId,
    type: 'interview_scheduled',
    title: 'Interview Scheduled',
    message: `An interview for ${application.jobTitle} has been scheduled.`,
    relatedJobId: application.jobId,
    relatedApplicationId: application.id,
    relatedInterviewId: ref.id,
  }).catch((err) => console.error('[notifications] failed to notify candidate of scheduled interview', err))

  return { id: ref.id, statusSynced }
}

export async function updateInterview(interview, fields) {
  await updateDoc(doc(db, 'interviews', interview.id), {
    scheduledAt: Timestamp.fromDate(fields.scheduledAt),
    durationMinutes: fields.durationMinutes,
    interviewType: fields.interviewType,
    meetingLink: fields.meetingLink || '',
    location: fields.location || '',
    notes: fields.notes || '',
    status: interview.status,
    updatedAt: serverTimestamp(),
  })

  createNotification({
    recipientId: interview.candidateId,
    type: 'interview_updated',
    title: 'Interview Updated',
    message: `Your interview details have been updated.`,
    relatedJobId: interview.jobId,
    relatedApplicationId: interview.applicationId,
    relatedInterviewId: interview.id,
  }).catch((err) => console.error('[notifications] failed to notify candidate of updated interview', err))
}

async function setInterviewStatus(interview, status, notificationTitle, notificationMessage) {
  await updateDoc(doc(db, 'interviews', interview.id), {
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
    interviewType: interview.interviewType,
    meetingLink: interview.meetingLink || '',
    location: interview.location || '',
    notes: interview.notes || '',
    status,
    updatedAt: serverTimestamp(),
  })

  createNotification({
    recipientId: interview.candidateId,
    type: status === 'cancelled' ? 'interview_cancelled' : 'interview_updated',
    title: notificationTitle,
    message: notificationMessage,
    relatedJobId: interview.jobId,
    relatedApplicationId: interview.applicationId,
    relatedInterviewId: interview.id,
  }).catch((err) => console.error(`[notifications] failed to notify candidate of interview ${status}`, err))
}

export async function cancelInterview(interview) {
  await setInterviewStatus(interview, 'cancelled', 'Interview Cancelled', 'Your scheduled interview has been cancelled.')
}

export async function completeInterview(interview) {
  await setInterviewStatus(interview, 'completed', 'Interview Updated', 'Your interview has been marked as completed.')
}

export { STATUS_LABELS }
