import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { computeScore } from './src/matching/scoreCandidate.js'
import { computeInputHash } from './src/matching/inputHash.js'
import { generateExplanation } from './src/matching/explanation.js'
import { handleNotificationEmail } from './src/email/handleNotificationEmail.js'

initializeApp()
const db = getFirestore()

// Declaring this secret does NOT fetch it, expose it, or make it live by
// itself — it only takes effect the next time computeMatch is actually
// deployed with `secrets: [anthropicApiKey]` bound (below), and only if
// the secret has also been created in Secret Manager first (see
// functions/SECRET_SETUP.md). Until both of those happen, this line is a
// no-op: process.env.ANTHROPIC_API_KEY stays undefined, exactly as it was
// before this line existed.
const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY')

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
 */
export const computeMatch = onCall({ secrets: [anthropicApiKey] }, async (request) => {
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

// Same inert-until-deployed pattern as anthropicApiKey above: declaring
// this does not fetch, expose, or activate anything by itself. See
// functions/SECRET_SETUP.md for the two-step process (create the secret,
// then deploy sendNotificationEmail with it bound) required before real
// emails are ever sent.
const resendApiKey = defineSecret('RESEND_API_KEY')

// Not a secret — just the verified "from" address to send as. Defaults to
// Resend's sandbox address (no domain verification required, but only
// deliverable in Resend's own test mode) so the emulator and every
// environment today keeps working with zero configuration. Production
// needs this overridden to a real address on a domain verified in the
// Resend dashboard — see functions/SECRET_SETUP.md.
const resendFromEmail = defineString('RESEND_FROM_EMAIL', { default: 'ARConnect <onboarding@resend.dev>' })

// Fires once per new notifications/{id} document — i.e. once per existing
// in-app notification event, reusing the exact recipient-verification
// work the Firestore rules already did on that write (see
// firestore.rules' notifications.create branches). Only a handful of
// notification types are email-worthy (handleNotificationEmail checks
// this); the rest (e.g. application_submitted_confirmation) are silently
// left in-app-only, matching the spec's 8 named events.
//
// No retry policy is configured (Cloud Functions v2 default: best-effort,
// no automatic retry), and handleNotificationEmail never throws — both
// deliberate, to avoid ever sending the same email twice. RESEND_FROM_EMAIL
// isn't in `secrets` because defineString params aren't secrets; binding
// it isn't required for it to be read via process.env at runtime once
// deployed with a value set.
export const sendNotificationEmail = onDocumentCreated(
  { document: 'notifications/{notificationId}', secrets: [resendApiKey] },
  async (event) => {
    const notification = event.data?.data()
    if (!notification) return
    await handleNotificationEmail({
      db,
      FieldValue,
      notificationId: event.params.notificationId,
      notification,
    })
  }
)
