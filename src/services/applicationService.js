import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const applicationsRef = collection(db, 'applications')

function applicationDocId(candidateId, jobId) {
  return `${candidateId}_${jobId}`
}

export async function getApplicationForJob(candidateId, jobId) {
  if (!candidateId || !jobId) return null
  const snap = await getDoc(doc(db, 'applications', applicationDocId(candidateId, jobId)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// Fetches every application the candidate has ever made in one query, so
// callers can build a jobId -> application lookup once instead of doing an
// individual read per job card.
export async function listMyApplications(candidateId) {
  const q = query(applicationsRef, where('candidateId', '==', candidateId))
  const snap = await getDocs(q)
  const applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  applications.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0))
  return applications
}

export async function applyToJob({ job, candidateId, candidateName, candidateEmail }) {
  const id = applicationDocId(candidateId, job.id)
  const ref = doc(db, 'applications', id)

  try {
    await setDoc(ref, {
      candidateId,
      jobId: job.id,
      employerId: job.employerId,
      candidateName,
      candidateEmail,
      jobTitle: job.title,
      companyName: job.companyName,
      status: 'applied',
      appliedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    // The security rules only permit *creating* this doc, never updating
    // it — so if it already exists, Firestore treats the write as an
    // update and rejects it with permission-denied. That's the server-side
    // duplicate-application guard; surface it as a clear, specific error.
    if (err.code === 'permission-denied') {
      const existing = await getApplicationForJob(candidateId, job.id)
      if (existing) {
        throw new Error('You have already applied to this job.', { cause: err })
      }
    }
    throw err
  }

  return getApplicationForJob(candidateId, job.id)
}
