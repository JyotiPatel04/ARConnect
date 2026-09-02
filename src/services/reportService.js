import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const reportsRef = collection(db, 'reports')

export async function createReport({ reporterId, targetType, targetId, reason, description }) {
  const ref = doc(reportsRef)
  await setDoc(ref, {
    reporterId,
    targetType,
    targetId,
    reason: reason.trim(),
    description: (description || '').trim(),
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    reviewedBy: null,
    reviewedAt: null,
  })
  return ref.id
}

// Admin-only read (enforced by firestore.rules, not just by never calling
// this from a non-admin page). No orderBy combined with the status filter
// — same index-avoidance reasoning as every other admin list in this app
// — sorted client-side instead.
export async function listReports(statusFilter) {
  const q = statusFilter && statusFilter !== 'all' ? query(reportsRef, where('status', '==', statusFilter)) : reportsRef
  const snap = await getDocs(q)
  const reports = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  reports.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  return reports
}
