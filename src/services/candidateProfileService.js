import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { calculateProfileCompletion } from '../lib/profileCompletion'

export async function getMyProfile(uid) {
  const snap = await getDoc(doc(db, 'candidateProfiles', uid))
  return snap.exists() ? snap.data() : null
}

// Returns the profile object that was just written (with a local Date()
// standing in for the server-resolved createdAt/updatedAt sentinels) so
// callers can update their local state directly from a known-successful
// write, instead of re-fetching — re-fetching would mean flipping back
// through a loading state right after save, which is exactly what was
// unmounting ProfileForm before its "Profile saved" confirmation could
// ever be seen.
export async function upsertMyProfile(uid, data) {
  const ref = doc(db, 'candidateProfiles', uid)
  const existing = await getDoc(ref)
  const existingData = existing.exists() ? existing.data() : null
  const now = new Date()

  const profile = {
    candidateId: uid,
    skills: data.skills || [],
    experienceYears: data.experienceYears ?? null,
    experienceSummary: data.experienceSummary || '',
    educationLevel: data.educationLevel || '',
    location: data.location || '',
    preferredJobTypes: data.preferredJobTypes || [],
    preferredWorkModes: data.preferredWorkModes || [],
    expectedSalaryMin: data.expectedSalaryMin ?? null,
    expectedSalaryMax: data.expectedSalaryMax ?? null,
    bio: data.bio || '',
    resumeLink: data.resumeLink || '',
    // Resume FILE metadata (as opposed to the resumeLink URL field above)
    // is managed independently by resumeService.js via merge writes — this
    // form knows nothing about file state, so this write (a full setDoc,
    // not a merge) must carry the existing values forward unchanged,
    // otherwise saving something as unrelated as your bio would silently
    // wipe out an already-uploaded resume.
    resumeFileName: existingData?.resumeFileName ?? null,
    resumeFileUrl: existingData?.resumeFileUrl ?? null,
    resumeFilePath: existingData?.resumeFilePath ?? null,
    resumeUploadedAt: existingData?.resumeUploadedAt ?? null,
  }
  // Single source of truth: the same function that drives the on-screen
  // completion meter also derives the stored flag, so the two can never
  // disagree about whether this profile is "complete".
  profile.profileComplete = calculateProfileCompletion(profile).isComplete

  // `existingData?.createdAt` rather than `existingData ? existingData.createdAt
  // : ...` -- a document created by resumeService.js's merge write (a
  // candidate who uploads a resume before ever saving the rest of their
  // profile) exists but has no createdAt field at all yet. Firestore's
  // setDoc rejects an explicit `undefined` field value outright, so
  // treating "doc exists" as "createdAt exists" crashed this exact case;
  // falling back to serverTimestamp() whenever createdAt specifically is
  // missing (doc missing entirely, or present without it) fixes both.
  await setDoc(ref, {
    ...profile,
    createdAt: existingData?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return { ...profile, createdAt: existingData?.createdAt ?? now, updatedAt: now }
}
