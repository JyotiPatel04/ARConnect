import { httpsCallable } from 'firebase/functions'
import { functions } from '../lib/firebase'

const computeMatchCallable = httpsCallable(functions, 'computeMatch')

/**
 * Calls the computeMatch Cloud Function. candidateId is optional — omit it
 * when a candidate is requesting their own match; an employer passes it
 * explicitly to view a specific applicant's match for one of their jobs.
 * The score itself is always deterministic and rule-based — this function
 * never computes anything client-side, it only asks the trusted backend.
 */
export async function getMatch({ jobId, candidateId } = {}) {
  const { data } = await computeMatchCallable({ jobId, candidateId })
  return data
}
