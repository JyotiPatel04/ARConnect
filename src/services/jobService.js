import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const jobsRef = collection(db, 'jobs')

// Filtering/searching beyond this still happens client-side (see useJobs /
// lib/jobFilters.js) — this orderBy is only here so the 100-job cap is a
// deterministic "100 most recent", not an arbitrary 100. An equality filter
// (status) combined with an orderBy on a different field (createdAt) is one
// of the query shapes Firestore's automatic single-field indexes already
// cover without a composite index — verified against the local emulator
// before relying on it here.
export async function listActiveJobs() {
  const q = query(jobsRef, where('status', '==', 'active'), orderBy('createdAt', 'desc'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getJobById(jobId) {
  if (!jobId) return null
  const snap = await getDoc(doc(db, 'jobs', jobId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
