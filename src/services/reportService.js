import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const reportsRef = collection(db, 'reports')

// Phase 17 P2: composite id (candidate/savedJobs-style) — a given reporter
// can only ever have one report on file against a given target. A repeat
// attempt is evaluated by Firestore as an update to the existing doc, which
// firestore.rules' reports.update only ever permits for admin, never the
// reporter — so it fails with permission-denied.
//
// Unlike applicationService.js's analogous duplicate check, this can't
// re-fetch the document to confirm that's really what happened: reports.read
// is admin-only, so the reporter can never read their own report back
// either. permission-denied here could also mean a suspended account (the
// SuspendedBanner already warns about that separately) — so the message is
// deliberately hedged rather than confidently asserting the duplicate case.
function reportDocId(reporterId, targetType, targetId) {
  return `${reporterId}_${targetType}_${targetId}`
}

export async function createReport({ reporterId, targetType, targetId, reason, description }) {
  const ref = doc(reportsRef, reportDocId(reporterId, targetType, targetId))
  try {
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
  } catch (err) {
    if (err.code === 'permission-denied') {
      throw new Error("Couldn't submit this report — you may have already reported this.", { cause: err })
    }
    throw err
  }
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
