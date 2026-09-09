import { collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { createNotification } from './notificationService'

const usersRef = collection(db, 'users')
const jobsRef = collection(db, 'jobs')
const reportsRef = collection(db, 'reports')
const moderationLogsRef = collection(db, 'moderationLogs')
const companyProfilesRef = collection(db, 'companyProfiles')
const companySummariesRef = collection(db, 'companySummaries')

// Every moderation action is one atomic batch: the target document change
// plus the audit log entry, together. Unlike Phase 8's notifications, the
// moderationLogs create rule needs no cross-document get() at all, so
// there's no same-batch validation problem here — a log exists if and
// only if the action it documents actually happened.
function logEntry(adminId, action, targetType, targetId, reason) {
  return {
    adminId,
    action,
    targetType,
    targetId,
    reason: reason.trim(),
    createdAt: serverTimestamp(),
  }
}

export async function setUserModerationStatus(adminId, targetUserId, status, reason) {
  const batch = writeBatch(db)
  batch.update(doc(usersRef, targetUserId), { moderationStatus: status, updated_at: serverTimestamp() })
  batch.set(doc(moderationLogsRef), logEntry(adminId, status === 'suspended' ? 'user_suspended' : 'user_unsuspended', 'user', targetUserId, reason))
  await batch.commit()
}

export async function setJobModerationStatus(adminId, jobId, status, reason) {
  const batch = writeBatch(db)
  batch.update(doc(jobsRef, jobId), { status, updatedAt: serverTimestamp() })
  batch.set(doc(moderationLogsRef), logEntry(adminId, status === 'closed' ? 'job_closed' : 'job_reopened', 'job', jobId, reason))
  await batch.commit()
}

// `status` is 'verified' or 'rejected' -- the ONLY two an admin can set
// (the third state, 'pending', is never written by anyone; it's just what
// a missing/fresh field defaults to, per firestore.rules and
// companyProfileService). Reads the real profile first, both to fail
// clearly if this employer has no company profile yet (nothing to
// verify) and to build a real notification message -- never trusts a
// client-supplied company name. companySummaries.verified is the ONLY
// thing candidate-facing UI ever reads (see companyProfileService), so
// this batch is what actually turns the Verified Employer badge on/off
// for jobs posted AFTER this point -- existing jobs are deliberately left
// untouched (see employerJobService.createJob's creation-time snapshot).
export async function setEmployerVerificationStatus(adminId, employerId, status, reason) {
  const profileRef = doc(companyProfilesRef, employerId)
  const profileSnap = await getDoc(profileRef)
  if (!profileSnap.exists()) {
    throw new Error('This employer has not created a company profile yet.')
  }

  const verified = status === 'verified'
  const trimmedReason = reason.trim()
  const companyName = profileSnap.data().companyName || 'Your company'

  const batch = writeBatch(db)
  batch.update(profileRef, {
    verificationStatus: status,
    verificationNote: trimmedReason,
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(companySummariesRef, employerId), { verified, updatedAt: serverTimestamp() })
  batch.set(
    doc(moderationLogsRef),
    logEntry(adminId, verified ? 'employer_verified' : 'employer_rejected', 'company', employerId, reason)
  )
  await batch.commit()

  createNotification({
    recipientId: employerId,
    type: verified ? 'employer_verification_approved' : 'employer_verification_rejected',
    title: verified ? 'Company Verified' : 'Verification Rejected',
    message: verified
      ? `${companyName} has been verified. New job posts will now show a Verified Employer badge.`
      : `${companyName}'s verification was rejected: ${trimmedReason}`,
  }).catch((err) => console.error('[notifications] failed to notify employer of verification decision', err))
}

export async function reviewReport(adminId, reportId, status, reason) {
  const batch = writeBatch(db)
  batch.update(doc(reportsRef, reportId), {
    status,
    reviewedBy: adminId,
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(moderationLogsRef), logEntry(adminId, status === 'reviewed' ? 'report_reviewed' : 'report_dismissed', 'report', reportId, reason))
  await batch.commit()
}

// No orderBy combined with the equality filter below — same reasoning as
// every other admin list in this app (see adminService.js): avoids
// needing a composite index. Sorted client-side instead.
export async function listModerationLogs() {
  const snap = await getDocs(query(moderationLogsRef, orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
