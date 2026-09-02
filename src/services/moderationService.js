import { collection, doc, getDocs, orderBy, query, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'

const usersRef = collection(db, 'users')
const jobsRef = collection(db, 'jobs')
const reportsRef = collection(db, 'reports')
const moderationLogsRef = collection(db, 'moderationLogs')

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
