import { collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db } from '../lib/firebase'

const applicationsRef = collection(db, 'applications')

export async function listApplicationsByEmployer(employerId) {
  const q = query(applicationsRef, where('employerId', '==', employerId))
  const snap = await getDocs(q)
  const applications = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  applications.sort((a, b) => (b.appliedAt?.toMillis?.() ?? 0) - (a.appliedAt?.toMillis?.() ?? 0))
  return applications
}

export const APPLICATION_STATUSES = ['applied', 'reviewing', 'shortlisted', 'interview', 'rejected', 'hired']

// The security rules only allow this document's status (+ updatedAt) to
// change, and only by the employer who owns the job it belongs to — every
// other field, including candidateId/jobId, is permanently immutable.
export async function updateApplicationStatus(applicationId, status) {
  await updateDoc(doc(db, 'applications', applicationId), { status, updatedAt: serverTimestamp() })
}
