// Admin-only reads. Every query here is only reachable in the UI behind
// /admin/* (ProtectedRoute allowedRoles=['admin']), and every one of them
// is only actually PERMITTED by firestore.rules for a caller whose own
// users/{uid}.role field — set once at signup and immutable to anything
// but 'candidate'/'employer' — reads 'admin'. There is no separate
// client-side admin flag anywhere in this file; the rules are the real
// gate, this is just the query layer behind it.
import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

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

export async function listAllUsers() {
  const snap = await getDocs(usersRef)
  const users = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  users.sort((a, b) => (b.created_at?.toMillis?.() ?? 0) - (a.created_at?.toMillis?.() ?? 0))
  return users
}

export async function listAllJobs() {
  const snap = await getDocs(jobsRef)
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  jobs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  return jobs
}

export async function listAllApplications() {
  const snap = await getDocs(applicationsRef)
  const applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  applications.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0))
  return applications
}
