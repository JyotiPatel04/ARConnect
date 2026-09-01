import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const jobsRef = collection(db, 'jobs')

// Sorting/search/filtering happens client-side (see useJobs) rather than an
// orderBy() here — combining an equality filter with orderBy on a different
// field needs a composite index that doesn't exist, and at this data scale
// (bounded by the limit below) client-side sort is simpler and index-free.
export async function listActiveJobs() {
  const q = query(jobsRef, where('status', '==', 'active'), limit(100))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getJobById(jobId) {
  if (!jobId) return null
  const snap = await getDoc(doc(db, 'jobs', jobId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}
