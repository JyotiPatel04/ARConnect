import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
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
  await setDoc(ref, {
    ...fields,
    employerId,
    status: 'active',
    applicationCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
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
