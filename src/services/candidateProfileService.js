import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

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

  const profileComplete = Boolean(data.skills?.length > 0 && data.experienceYears != null && data.location)
  const now = new Date()

  const profile = {
    candidateId: uid,
    skills: data.skills || [],
    experienceYears: data.experienceYears ?? null,
    experienceSummary: data.experienceSummary || '',
    location: data.location || '',
    preferredJobTypes: data.preferredJobTypes || [],
    preferredWorkModes: data.preferredWorkModes || [],
    expectedSalaryMin: data.expectedSalaryMin ?? null,
    expectedSalaryMax: data.expectedSalaryMax ?? null,
    bio: data.bio || '',
    profileComplete,
  }

  await setDoc(ref, {
    ...profile,
    createdAt: existing.exists() ? existing.data().createdAt : serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return { ...profile, createdAt: existing.exists() ? existing.data().createdAt : now, updatedAt: now }
}
