import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { doesJobMatchPreferences } from '../lib/jobAlertMatching'

const jobAlertPreferencesRef = collection(db, 'jobAlertPreferences')
const jobAlertMatchesRef = collection(db, 'jobAlertMatches')
const jobsRef = collection(db, 'jobs')

export async function getMyJobAlertPreferences(uid) {
  const snap = await getDoc(doc(jobAlertPreferencesRef, uid))
  return snap.exists() ? snap.data() : null
}

// Full setDoc rebuild each save, same "own dedicated document, never
// shared with the big profile blob" reasoning as candidateProfileService's
// upsertMyProfile -- but since this is the ONLY writer of this document
// (unlike candidateProfiles, which also gets targeted merge-writes from
// resumeService.js), there's no other form that could silently wipe a
// field it doesn't know about. lastAlertCheckAt is the one exception: it's
// owned exclusively by runJobAlertCheck() below, never by this form, so
// it's always carried forward unchanged here.
export async function upsertMyJobAlertPreferences(uid, data) {
  const ref = doc(jobAlertPreferencesRef, uid)
  const existing = await getDoc(ref)
  const existingData = existing.exists() ? existing.data() : null
  const now = new Date()

  const prefs = {
    candidateId: uid,
    enabled: data.enabled ?? true,
    jobTypes: data.jobTypes || [],
    workModes: data.workModes || [],
    locations: data.locations || [],
    skills: data.skills || [],
    experienceLevel: data.experienceLevel || null,
    lastAlertCheckAt: existingData?.lastAlertCheckAt ?? null,
  }

  await setDoc(ref, {
    ...prefs,
    createdAt: existingData?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return { ...prefs, createdAt: existingData?.createdAt ?? now, updatedAt: now }
}

// Runs the alert check for ONE candidate (the caller) against jobs
// published since their own lastAlertCheckAt cursor -- never reads or
// enumerates any other candidate's data, never scans the whole jobs
// collection on a steady-state visit (only what's new since last time).
//
// Duplicate prevention is structural, not a pre-check: the marker write
// and the notification write are batched together, and jobAlertMatches'
// create-only rule (see firestore.rules) means a batch targeting an
// already-matched (candidate, job) pair fails atomically -- so a job
// already alerted on can never get a second notification, and a partial
// "marker written but notification lost" state can never happen either.
// The notification is written inline here (not via notificationService's
// createNotification()) specifically so it can share this same atomic
// batch with the marker -- createNotification() is a standalone async
// call with no way to join an existing batch.
export async function runJobAlertCheck(uid) {
  const prefsSnap = await getDoc(doc(jobAlertPreferencesRef, uid))
  if (!prefsSnap.exists()) return { checked: 0, matched: 0 }

  const prefs = prefsSnap.data()
  if (!prefs.enabled) return { checked: 0, matched: 0 }

  // No `where('status', '==', 'active')` on this query -- combining that
  // equality filter with the createdAt range filter would need a new
  // composite index. `status` is filtered client-side instead, same
  // index-avoidance convention as every other list query in this app.
  const cursor = prefs.lastAlertCheckAt || Timestamp.fromMillis(0)
  const snap = await getDocs(query(jobsRef, where('createdAt', '>', cursor)))
  const newJobs = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((job) => job.status === 'active')

  if (newJobs.length === 0) return { checked: 0, matched: 0 }

  let latestCreatedAt = cursor
  let matched = 0

  for (const job of newJobs) {
    if (job.createdAt?.toMillis?.() > latestCreatedAt.toMillis()) {
      latestCreatedAt = job.createdAt
    }
    if (!doesJobMatchPreferences(job, prefs)) continue

    const batch = writeBatch(db)
    batch.set(doc(jobAlertMatchesRef, `${uid}_${job.id}`), {
      candidateId: uid,
      jobId: job.id,
      createdAt: serverTimestamp(),
    })
    batch.set(doc(collection(db, 'notifications')), {
      recipientId: uid,
      type: 'job_alert_match',
      title: 'New job matching your preferences',
      message: `${job.title} at ${job.companyName} matches your job alert preferences.`,
      relatedJobId: job.id,
      // Every notification type in this app always writes this field
      // (even as null) -- notifications.update's rule pins it via a plain
      // equality check (`request.resource.data.relatedApplicationId ==
      // resource.data.relatedApplicationId`), not the default-aware
      // `.get(key, null)` used for relatedInterviewId, so a document
      // missing it entirely makes every future update (including
      // "mark as read") throw and fail closed. Omitting this was a real
      // bug caught by the E2E test, not a defensive-but-unnecessary field.
      relatedApplicationId: null,
      read: false,
      createdAt: serverTimestamp(),
    })

    try {
      await batch.commit()
      matched += 1
    } catch (err) {
      // permission-denied here means the create-only marker already
      // exists (this job was already alerted on in an earlier check) --
      // expected, not an error. Anything else is a genuine failure.
      if (err.code !== 'permission-denied') throw err
    }
  }

  // Advances to the newest createdAt actually seen in this batch of
  // results, NOT serverTimestamp()/"now" -- a job created between this
  // query executing and this write landing would otherwise be silently
  // skipped forever (its createdAt would already be older than a "now"
  // cursor). Using the real max keeps every job eligible for exactly one
  // future check until it's actually been considered.
  await updateDoc(doc(jobAlertPreferencesRef, uid), {
    lastAlertCheckAt: latestCreatedAt,
    updatedAt: serverTimestamp(),
  }).catch((err) => {
    console.error('[jobAlerts] failed to advance lastAlertCheckAt', err)
  })

  return { checked: newJobs.length, matched }
}
