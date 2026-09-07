import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { computeScore } from './src/matching/scoreCandidate.js'
import { computeInputHash } from './src/matching/inputHash.js'
import { generateExplanation } from './src/matching/explanation.js'

initializeApp()
const db = getFirestore()

const DAILY_COMPUTE_LIMIT = 100

async function checkAndIncrementRateLimit(uid) {
  const today = new Date().toISOString().slice(0, 10)
  const ref = db.collection('rateLimits').doc(uid)

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const data = snap.exists ? snap.data() : null

    if (!data || data.date !== today) {
      tx.set(ref, { date: today, count: 1 })
      return
    }

    if (data.count >= DAILY_COMPUTE_LIMIT) {
      throw new HttpsError(
        'resource-exhausted',
        'Daily match-computation limit reached. Cached matches are unaffected — try again tomorrow.'
      )
    }

    tx.update(ref, { count: FieldValue.increment(1) })
  })
}

/**
 * computeMatch — callable function. Input: { jobId: string, candidateId?: string }.
 * candidateId defaults to the caller's own uid (a candidate viewing their
 * own match); an employer may pass a specific candidateId to view a
 * ranked applicant's match, but only for a job they actually own.
 *
 * Lives in its own Cloud Functions codebase ("match", source
 * functions-match/) separate from the "default" codebase (source
 * functions/, sendNotificationEmail) specifically so this function can be
 * deployed independently of RESEND_API_KEY — Cloud Functions v2 resolves
 * every defineSecret() declared anywhere in a codebase during deploy-time
 * discovery, even ones bound to a different function than the one being
 * targeted by `--only`, so the two functions could not coexist in one
 * codebase without both secrets being required for either to deploy.
 * See functions-match/README or the project's deployment history for the
 * full reasoning. src/matching/ was moved here wholesale (not duplicated)
 * since sendNotificationEmail never depended on it.
 */
// region: 'asia-south1' — matches this project's Firestore database and
// Storage bucket location, both already in asia-south1.
//
// No ANTHROPIC_API_KEY secret is declared anywhere in this codebase.
// generateExplanation() (./src/matching/explanation.js) already falls back
// to a free, offline stub whenever ANTHROPIC_API_KEY isn't present in this
// function's environment, which is exactly what happens with no secret
// declared at all — the deterministic score never depended on this either
// way. To re-enable real Claude explanations later: create the
// ANTHROPIC_API_KEY secret in Secret Manager, add `import { defineSecret }
// from 'firebase-functions/params'`, declare `const anthropicApiKey =
// defineSecret('ANTHROPIC_API_KEY')`, bind it via `secrets: [anthropicApiKey]`
// below, then redeploy this codebase. No matching/scoring or
// explanation-fallback code changes are needed to do that.
export const computeMatch = onCall({ region: 'asia-south1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'You must be signed in.')
  }

  const { jobId, candidateId: requestedCandidateId } = request.data || {}
  if (!jobId || typeof jobId !== 'string') {
    throw new HttpsError('invalid-argument', 'jobId is required.')
  }

  const callerUid = request.auth.uid
  const candidateId = requestedCandidateId || callerUid

  const callerProfileSnap = await db.collection('users').doc(callerUid).get()
  const callerRole = callerProfileSnap.exists ? callerProfileSnap.data().role : null

  const jobSnap = await db.collection('jobs').doc(jobId).get()
  if (!jobSnap.exists) {
    throw new HttpsError('not-found', 'Job not found.')
  }
  const job = jobSnap.data()

  // Authorization: either the candidate requesting their own match, or the
  // employer who owns this specific job requesting an applicant's match.
  const isSelfRequest = candidateId === callerUid && callerRole === 'candidate'
  const isOwningEmployerRequest = callerRole === 'employer' && job.employerId === callerUid
  if (!isSelfRequest && !isOwningEmployerRequest) {
    throw new HttpsError('permission-denied', 'You are not allowed to view this match.')
  }

  const profileSnap = await db.collection('candidateProfiles').doc(candidateId).get()
  if (!profileSnap.exists) {
    throw new HttpsError(
      'failed-precondition',
      'This candidate has not completed their profile yet, so no match can be computed.'
    )
  }
  const candidateProfile = profileSnap.data()

  const matchId = `${candidateId}_${jobId}`
  const matchRef = db.collection('matches').doc(matchId)
  const inputHash = computeInputHash(candidateProfile, job)

  const existingSnap = await matchRef.get()
  if (existingSnap.exists && existingSnap.data().inputHash === inputHash) {
    // Cache hit — nothing scoring-relevant has changed since this was last
    // computed. No rate-limit cost, no recomputation, no explanation call.
    const cached = existingSnap.data()
    return {
      score: cached.score,
      breakdown: cached.breakdown,
      explanation: cached.explanation,
      explanationSource: cached.explanationSource,
      cached: true,
    }
  }

  await checkAndIncrementRateLimit(callerUid)

  const { score, breakdown } = computeScore(candidateProfile, job)
  const { text: explanation, source: explanationSource } = await generateExplanation({
    score,
    breakdown,
    jobTitle: job.title,
    companyName: job.companyName,
  })

  await matchRef.set({
    candidateId,
    jobId,
    employerId: job.employerId,
    score,
    breakdown,
    explanation,
    explanationSource,
    algorithmVersion: 'rule-v1',
    inputHash,
    computedAt: FieldValue.serverTimestamp(),
  })

  return { score, breakdown, explanation, explanationSource, cached: false }
})
