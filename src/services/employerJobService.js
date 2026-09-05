import { collection, deleteDoc, doc, getDocs, increment, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'

const jobsRef = collection(db, 'jobs')

export async function listJobsByEmployer(employerId) {
  const q = query(jobsRef, where('employerId', '==', employerId))
  const snap = await getDocs(q)
  const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  jobs.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
  return jobs
}

export async function createJob({ employerId, ...fields }) {
  const ref = doc(jobsRef)

  // Batched with the job-post counter (Phase 17 P2, see firestore.rules'
  // jobPostCountFor()/jobPostCounters) so the counter that gates future
  // posts stays in sync with actual posts for this app's own UI.
  // set(..., {merge: true}) with increment() works whether the counter
  // doc already exists or not: Firestore treats a missing field (or a
  // missing document) as starting from 0 for increment() purposes, so this
  // single call covers both "first job ever" (evaluated by the rules as a
  // create, count becomes 1) and every job after (evaluated as an update,
  // count becomes prev + 1) without branching here.
  const batch = writeBatch(db)
  batch.set(ref, {
    ...fields,
    employerId,
    status: 'active',
    applicationCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.set(doc(db, 'jobPostCounters', employerId), { count: increment(1) }, { merge: true })
  await batch.commit()

  return ref.id
}

// employerId is deliberately never accepted here — ownership is set once at
// creation and the security rules reject any attempt to change it, so this
// function doesn't even offer a way to try.
export async function updateJob(jobId, fields) {
  await updateDoc(doc(db, 'jobs', jobId), {
    ...fields,
    updatedAt: serverTimestamp(),
  })
}

export async function setJobStatus(jobId, status) {
  await updateDoc(doc(db, 'jobs', jobId), { status, updatedAt: serverTimestamp() })
}

// Only ever succeeds when the job's applicationCount is 0 — enforced by
// firestore.rules, not just this client-side check, so this call failing
// with permission-denied is the expected, correct outcome for a job that
// already has applications, not a bug.
export async function deleteJob(jobId) {
  await deleteDoc(doc(db, 'jobs', jobId))
}
