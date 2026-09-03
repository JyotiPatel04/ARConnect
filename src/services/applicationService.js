import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { createNotification } from './notificationService'

const applicationsRef = collection(db, 'applications')

function applicationDocId(candidateId, jobId) {
  return `${candidateId}_${jobId}`
}

export async function getApplicationForJob(candidateId, jobId) {
  if (!candidateId || !jobId) return null
  const snap = await getDoc(doc(db, 'applications', applicationDocId(candidateId, jobId)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Fetches every application the candidate has ever made in one query, so
// callers can build a jobId -> application lookup once instead of doing an
// individual read per job card.
export async function listMyApplications(candidateId) {
  const q = query(applicationsRef, where('candidateId', '==', candidateId))
  const snap = await getDocs(q)
  const applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  applications.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0))
  return applications
}

export async function applyToJob({ job, candidateId, candidateName, candidateEmail }) {
  const id = applicationDocId(candidateId, job.id)
  const ref = doc(db, 'applications', id)

  try {
    // Batched so the application is created and the job's applicationCount
    // is incremented atomically — that counter is what lets the employer
    // delete rule guarantee "only when zero applications" server-side,
    // not just as a client-side check. The candidate's own confirmation
    // notification rides in the SAME batch (its create rule only checks
    // request.auth.uid, no cross-document dependency, so batch timing
    // doesn't matter for it) — application, counter, and confirmation
    // either all happen or none do.
    const batch = writeBatch(db)
    batch.set(ref, {
      candidateId,
      jobId: job.id,
      employerId: job.employerId,
      candidateName,
      candidateEmail,
      jobTitle: job.title,
      companyName: job.companyName,
      status: 'applied',
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.update(doc(db, 'jobs', job.id), { applicationCount: increment(1) })
    batch.set(doc(collection(db, 'notifications')), {
      recipientId: candidateId,
      type: 'application_submitted_confirmation',
      title: 'Application Submitted',
      message: `Your application for ${job.title} was submitted successfully.`,
      relatedJobId: job.id,
      relatedApplicationId: id,
      read: false,
      createdAt: serverTimestamp(),
    })
    await batch.commit()
  } catch (err) {
    // The security rules only permit *creating* this doc, never updating
    // it — so if it already exists, Firestore treats the write as an
    // update and rejects it with permission-denied. That's the server-side
    // duplicate-application guard; surface it as a clear, specific error.
    if (err.code === 'permission-denied') {
      const existing = await getApplicationForJob(candidateId, job.id)
      if (existing) {
        throw new Error('You have already applied to this job.', { cause: err })
      }
    }
    throw err
  }

  // The employer's "new application" notification MUST reference an
  // already-persisted application (see firestore.rules) — it can only be
  // written now, after the batch above has actually committed. A failure
  // here doesn't undo or affect the application itself, which already
  // succeeded; it's logged rather than surfaced so the candidate's
  // successful apply is never blocked by a notification-only failure.
  createNotification({
    recipientId: job.employerId,
    type: 'new_application',
    title: 'New Application',
    message: `A candidate has applied for your ${job.title} job.`,
    relatedJobId: job.id,
    relatedApplicationId: id,
  }).catch((err) => {
    console.error('[notifications] failed to notify employer of new application', err)
  })

  return getApplicationForJob(candidateId, job.id)
}

// Only ever called on the candidate's own application, and only while it's
// still in an open state (see firestore.rules — the rule independently
// re-verifies both of those, this isn't a trust boundary). Every field
// except status/updatedAt is left untouched, exactly like the employer's
// updateApplicationStatus below.
export async function withdrawApplication(application) {
  await updateDoc(doc(db, 'applications', application.id), { status: 'withdrawn', updatedAt: serverTimestamp() })

  // Same pattern as every other notification in this app: written as a
  // SEPARATE call after the real action has already committed, and a
  // failure here never undoes or blocks the withdrawal itself.
  createNotification({
    recipientId: application.employerId,
    type: 'application_withdrawn',
    title: 'Application Withdrawn',
    message: `${application.candidateName} withdrew their application for ${application.jobTitle}.`,
    relatedJobId: application.jobId,
    relatedApplicationId: application.id,
  }).catch((err) => {
    console.error('[notifications] failed to notify employer of withdrawal', err)
  })
}
