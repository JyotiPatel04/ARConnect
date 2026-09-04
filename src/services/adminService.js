// Admin-only reads. Every query here is only reachable in the UI behind
// /admin/* (ProtectedRoute allowedRoles=['admin']), and every one of them
// is only actually PERMITTED by firestore.rules for a caller whose own
// users/{uid}.role field — set once at signup and immutable to anything
// but 'candidate'/'employer' — reads 'admin'. There is no separate
// client-side admin flag anywhere in this file; the rules are the real
// gate, this is just the query layer behind it.
import { collection, getCountFromServer, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { ADMIN_LIST_LIMIT, isListTruncated } from '../lib/adminList'

const usersRef = collection(db, 'users')
const jobsRef = collection(db, 'jobs')
const applicationsRef = collection(db, 'applications')

// Aggregation queries (count-only, no documents downloaded) — cheap, and
// governed by the exact same security rules as any other read of these
// collections.
export async function getPlatformStats() {
  const [totalUsers, totalCandidates, totalEmployers, totalJobs, activeJobs, totalApplications] =
    await Promise.all([
      getCountFromServer(usersRef),
      getCountFromServer(query(usersRef, where('role', '==', 'candidate'))),
      getCountFromServer(query(usersRef, where('role', '==', 'employer'))),
      getCountFromServer(jobsRef),
      getCountFromServer(query(jobsRef, where('status', '==', 'active'))),
      getCountFromServer(applicationsRef),
    ])

  return {
    totalUsers: totalUsers.data().count,
    totalCandidates: totalCandidates.data().count,
    totalEmployers: totalEmployers.data().count,
    totalJobs: totalJobs.data().count,
    activeJobs: activeJobs.data().count,
    totalApplications: totalApplications.data().count,
  }
}

// Phase 17 P2: capped at ADMIN_LIST_LIMIT (see src/lib/adminList.js) rather
// than truly unbounded. No orderBy is added alongside the cap deliberately
// -- combining orderBy with a field that's missing on some document would
// silently exclude that document from admin visibility entirely (Firestore
// drops docs lacking the ordered field from the result), and this console
// exists precisely so admins can see every record, malformed ones
// included. At today's realistic scale the cap never engages (identical
// behavior to before); `truncated` tells the caller when it has.
export async function listAllUsers() {
  const snap = await getDocs(query(usersRef, limit(ADMIN_LIST_LIMIT)))
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  users.sort((a, b) => (b.created_at?.toMillis?.() ?? 0) - (a.created_at?.toMillis?.() ?? 0))
  return { items: users, truncated: isListTruncated(snap.size) }
}

export async function listAllJobs() {
  const snap = await getDocs(query(jobsRef, limit(ADMIN_LIST_LIMIT)))
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  jobs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  return { items: jobs, truncated: isListTruncated(snap.size) }
}

export async function listAllApplications() {
  const snap = await getDocs(query(applicationsRef, limit(ADMIN_LIST_LIMIT)))
  const applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  applications.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0))
  return { items: applications, truncated: isListTruncated(snap.size) }
}
