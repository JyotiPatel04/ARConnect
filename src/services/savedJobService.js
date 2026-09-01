import { collection, deleteDoc, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const savedJobsRef = collection(db, 'savedJobs')

function savedJobDocId(candidateId, jobId) {
  return `${candidateId}_${jobId}`
}

export async function listSavedJobs(candidateId) {
  const q = query(savedJobsRef, where('candidateId', '==', candidateId))
  const snap = await getDocs(q)
  const saved = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  saved.sort((a, b) => (b.savedAt?.toMillis?.() ?? 0) - (a.savedAt?.toMillis?.() ?? 0))
  return saved
}

export async function saveJob({ candidateId, job }) {
  const id = savedJobDocId(candidateId, job.id)
  await setDoc(doc(db, 'savedJobs', id), {
    candidateId,
    jobId: job.id,
    jobTitle: job.title,
    companyName: job.companyName,
    salaryMin: job.salaryMin ?? null,
    salaryMax: job.salaryMax ?? null,
    location: job.location,
    employerVerified: Boolean(job.employerVerified),
    savedAt: serverTimestamp(),
  })
}

export async function unsaveJob({ candidateId, jobId }) {
  await deleteDoc(doc(db, 'savedJobs', savedJobDocId(candidateId, jobId)))
}
