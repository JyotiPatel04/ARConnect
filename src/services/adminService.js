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
const companyProfilesRef = collection(db, 'companyProfiles')

// Aggregation queries (count-only, no documents downloaded) — cheap, and
// governed by the exact same security rules as any other read of these
// collections.
//
// Pending Verifications limitation: this counts documents where
// verificationStatus == 'pending' explicitly. Firestore has no query
// operator for "field is absent", so a companyProfiles doc written before
// this feature existed (no verificationStatus field at all) is NOT
// counted here, even though every other read path in this app treats a
// missing field as 'pending' (see firestore.rules' own .get(key,
// 'pending') default, and companyProfileService). Downloading the whole
// collection just to filter client-side would defeat the point of an
// aggregation query at any real scale, and a one-off backfill script was
// explicitly out of scope for this feature. In practice this self-heals:
// companyProfileService.upsertMyCompanyProfile now always writes an
// explicit verificationStatus on every save, so any pre-existing employer
// who edits their profile at all becomes counted from that point on.
export async function getPlatformStats() {
  const [totalUsers, totalCandidates, totalEmployers, totalJobs, activeJobs, totalApplications, pendingVerifications] =
    await Promise.all([
      getCountFromServer(usersRef),
      getCountFromServer(query(usersRef, where('role', '==', 'candidate'))),
      getCountFromServer(query(usersRef, where('role', '==', 'employer'))),
      getCountFromServer(jobsRef),
      getCountFromServer(query(jobsRef, where('status', '==', 'active'))),
      getCountFromServer(applicationsRef),
      getCountFromServer(query(companyProfilesRef, where('verificationStatus', '==', 'pending'))),
    ])

  return {
    totalUsers: totalUsers.data().count,
    totalCandidates: totalCandidates.data().count,
    totalEmployers: totalEmployers.data().count,
    totalJobs: totalJobs.data().count,
    activeJobs: activeJobs.data().count,
    totalApplications: totalApplications.data().count,
    pendingVerifications: pendingVerifications.data().count,
  }
}

// Same cap-and-sort-client-side shape as listAllUsers/listAllJobs/
// listAllApplications below. Same missing-field limitation as the count
// above -- see getPlatformStats' comment.
export async function listPendingEmployerVerifications() {
  const snap = await getDocs(
    query(companyProfilesRef, where('verificationStatus', '==', 'pending'), limit(ADMIN_LIST_LIMIT))
  )
  const profiles = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  profiles.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  return { items: profiles, truncated: isListTruncated(snap.size) }
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
